"""
Chat Service - Business Logic Layer
Handles conversation management and AI interaction
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import logging
import os
import sys
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from typing import Dict, List

from models.conversation import Conversation, Message
from utils.snowflake import generate_id

logger = logging.getLogger(__name__)

# Ensure project root is on sys.path once at module load time
_current_dir = os.path.dirname(os.path.abspath(__file__))
_project_root = os.path.dirname(os.path.dirname(os.path.dirname(_current_dir)))
if _project_root not in sys.path:
    sys.path.append(_project_root)

# ── Pre-check gate ──────────────────────────────────────────────────────────
# These patterns are trivial small-talk that don't need a full ReAct agent call.
# Matching messages get an instant friendly reply, skipping Bedrock entirely.
_SIMPLE_RE = re.compile(
    r'^\s*('
    r'hi+|hello+|hey+|heyy+|sup|yo|ok|okay|k|thanks?|thank\s+you|thx|'
    r'good|great|nice|cool|got\s+it|sure|yep|yes|no|nah|bye|goodbye|cya'
    r')\s*[!?.]*\s*$',
    re.IGNORECASE
)
_QUICK_REPLIES = [
    "Hey! 😊 How are you doing today?",
    "Hi there! What's on your mind?",
    "Hey! Great to hear from you. How are you feeling?",
    "Hello! I'm here for you. How's your day going?",
]
_reply_idx = 0

def _is_simple_message(text: str) -> bool:
    """True if the message is trivial small-talk that doesn't need the agent."""
    return bool(_SIMPLE_RE.match(text.strip())) and len(text.strip()) < 40

def _quick_reply() -> str:
    global _reply_idx
    reply = _QUICK_REPLIES[_reply_idx % len(_QUICK_REPLIES)]
    _reply_idx += 1
    return reply
# ────────────────────────────────────────────────────────────────────────────


class ChatService:
    """
    Chat business logic

    Responsibilities:
    - Conversation lifecycle management
    - Message storage and retrieval
    - AI interaction with context + summary
    - Automatic summarization (every 10 messages)
    """

    def __init__(self, db: Session):
        self.db = db

    def start_conversation(self, user_id: int) -> Conversation:
        """Create new conversation"""
        conv = Conversation(
            id=generate_id(),
            patient_id=user_id,
            status="active"
        )
        self.db.add(conv)
        self.db.commit()
        self.db.refresh(conv)

        logger.info(f"✨ Created conversation {conv.id} for user {user_id}")
        return conv

    def get_user_conversations(self, user_id: int) -> List[Conversation]:
        """Get all conversations for user (most recent first)"""
        return self.db.query(Conversation).filter(
            Conversation.patient_id == user_id
        ).order_by(Conversation.last_message_at.desc()).all()

    def get_conversation_history(self, conversation_id: int, user_id: int) -> List[Message]:
        """Get all messages in conversation (chronological)"""
        self._get_conversation(conversation_id, user_id)

        return self.db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.timestamp.asc()).all()

    def send_message(self, conversation_id: int, user_id: int, content: str) -> Dict:
        """
        Send message and get AI response using AWS Bedrock Agent.
        Optimizations:
          - Pre-check gate: trivial greetings skip Bedrock entirely
          - Parallel execution: emotion scoring + agent run concurrently
        """
        # 1. Verify ownership
        conv = self._get_conversation(conversation_id, user_id)

        # ── FAST PATH: trivial messages skip the agent entirely ──────────────
        if _is_simple_message(content):
            logger.info(f"⚡ Fast path: trivial message, skipping agent")
            ai_text = _quick_reply()
            emotion_data = {"stress_score": 0, "emotions": {"primary_emotion": "neutral"}}
            return self._save_and_return(conv, conversation_id, content, ai_text, emotion_data)
        # ─────────────────────────────────────────────────────────────────────

        # 2. Build conversation context (needed by both emotion + agent)
        previous_messages = self.db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.timestamp.desc()).limit(15).all()[::-1]

        turn_count = self.db.query(Message).filter(
            Message.conversation_id == conversation_id,
            Message.sender_type == "patient"
        ).count()

        # 3. PARALLEL: run emotion scoring + agent call concurrently
        from agent.chatbot.model_fusion import calculate_stress_score
        from agent.chatbot.agent import agent

        emotion_data = {}
        ai_text = ""

        def _run_emotion():
            try:
                result = calculate_stress_score(content)
                logger.info(f"🧠 Stress {result.stress_score:.0%} | Emotion: {result.emotions.primary_emotion}")
                return result.to_dict()
            except Exception as e:
                logger.warning(f"⚠️ Stress analysis failed: {e}")
                return {"error": str(e)}

        def _run_agent():
            # Build context header with best-effort stress (0 before emotion result)
            chat_history = [{"role": "system", "content": f"[SESSION CONTEXT: Turn #{turn_count}]"}]
            for m in previous_messages:
                role = "user" if m.sender_type == "patient" else "assistant"
                chat_history.append({"role": role, "content": m.content})
            chat_history.append({"role": "user", "content": content})
            try:
                result = agent.invoke({"messages": chat_history})
                ai_content = result["messages"][-1].content
                if isinstance(ai_content, list):
                    return "".join(b["text"] for b in ai_content if "text" in b)
                return str(ai_content)
            except Exception as e:
                logger.error(f"❌ Agent failed: {e}")
                return "I'm having a bit of trouble right now. Please try again in a moment. 😔"

        with ThreadPoolExecutor(max_workers=2) as pool:
            emotion_future = pool.submit(_run_emotion)
            agent_future   = pool.submit(_run_agent)
            emotion_data   = emotion_future.result()
            ai_text        = agent_future.result()

        logger.info(f"✅ Agent responded: '{ai_text[:50]}...'")

        return self._save_and_return(conv, conversation_id, content, ai_text, emotion_data)

    def _save_and_return(self, conv, conversation_id, content, ai_text, emotion_data) -> Dict:
        """Persist both messages, commit, and return the standard response dict."""
        user_msg = Message(
            id=generate_id(),
            conversation_id=conversation_id,
            sender_type="patient",
            content=content,
            emotion_score=emotion_data,
            timestamp=datetime.utcnow()
        )
        ai_msg = Message(
            id=generate_id(),
            conversation_id=conversation_id,
            sender_type="ai",
            content=ai_text,
            timestamp=datetime.utcnow()
        )
        self.db.add(user_msg)
        self.db.add(ai_msg)
        conv.last_message_at = datetime.utcnow()
        self.db.commit()

        stress_score = emotion_data.get("stress_score", 0) if isinstance(emotion_data, dict) else 0
        if stress_score > 0.65:
            suggestion = {"type": "breathing", "label": "Try Guided Breathing", "urgency": "high"}
        elif stress_score > 0.4:
            suggestion = {"type": "breathing", "label": "2-min Calm Exercise", "urgency": "medium"}
        else:
            suggestion = None

        return {
            "user_message": user_msg,
            "ai_message": ai_msg,
            "emotion": emotion_data,
            "suggestion": suggestion,
        }

    def _get_conversation(self, conversation_id: int, user_id: int) -> Conversation:
        """Get conversation with ownership verification"""
        conv = self.db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.patient_id == user_id
        ).first()

        if not conv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found or you don't have access"
            )
        return conv

    def _update_summary(self, conv: Conversation, conversation_id: int):
        """
        Update conversation summary (called every 10 messages)
        Compresses context so AI remembers beyond the 10-message window
        """
        try:
            recent_history = self.db.query(Message).filter(
                Message.conversation_id == conversation_id
            ).order_by(Message.timestamp.desc()).limit(20).all()[::-1]

            history_dicts = [
                {
                    "role": "user" if m.sender_type == "patient" else "assistant",
                    "content": m.content
                }
                for m in recent_history
            ]

            new_summary = ai_service.summarize_conversation(history_dicts)
            if new_summary:
                conv.summary = new_summary
                logger.info(f"📝 Updated summary: '{new_summary[:50]}...'")

        except Exception as e:
            logger.error(f"❌ Summarization failed: {e}")
