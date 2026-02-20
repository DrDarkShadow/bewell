"""
Chat Service - Business Logic Layer
Handles conversation management and AI interaction
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import logging
from datetime import datetime
from typing import Dict, List

from models.conversation import Conversation, Message
from utils.snowflake import generate_id
# Note: Agent imports are done locally to avoid circular dependencies

logger = logging.getLogger(__name__)


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
        Send message and get AI response using AWS Bedrock Agent
        """
        # 1. Verify ownership
        conv = self._get_conversation(conversation_id, user_id)

        # 2. Advanced Stress & Emotion Analysis (Model Fusion)
        try:
            # Import locally to avoid circular dependency
            import sys
            import os
            # Ensure project root is in path so we can import 'agent'
            current_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
            if project_root not in sys.path:
                sys.path.append(project_root)
                
            from agent.chatbot.model_fusion import calculate_stress_score
            stress_result = calculate_stress_score(content)
            
            logger.info(
                f"🧠 Model Fusion: Stress {stress_result.stress_score:.0%} | "
                f"Emotion: {stress_result.emotions.primary_emotion}"
            )
            
            # Convert to dict for JSON storage
            emotion_data = stress_result.to_dict()
            
        except Exception as e:
            logger.warning(f"⚠️ Stress analysis failed: {e}")
            emotion_data = {"error": str(e)}

        # 3. Save User Message (with rich emotion data)
        user_msg = Message(
            id=generate_id(),
            conversation_id=conversation_id,
            sender_type="patient",
            content=content,
            emotion_score=emotion_data, # ✅ Rich JSON data
            timestamp=datetime.utcnow()
        )
        self.db.add(user_msg)
        
        logger.info(f"💬 User {user_id} sent message: '{content[:30]}...'")

        # 4. Build Context for Agent
        # Get last 15 messages for context
        previous_messages = self.db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.timestamp.desc()).limit(15).all()[::-1]

        # Convert to LangGraph format
        chat_history = []
        for m in previous_messages:
            role = "user" if m.sender_type == "patient" else "assistant"
            chat_history.append({"role": role, "content": m.content})
            
        # Add current message
        chat_history.append({"role": "user", "content": content})

        # 5. Invoke Chatbot Agent (AWS Bedrock)
        try:
            import sys
            import os
            # Ensure project root is in path so we can import 'agent'
            current_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
            if project_root not in sys.path:
                sys.path.append(project_root)
                
            from agent.chatbot.agent import agent
            
            # Invoke agent synchronously
            result = agent.invoke({"messages": chat_history})
            
            # Extract response
            ai_content = result["messages"][-1].content
            if isinstance(ai_content, list):
                # Handle block content from Bedrock
                ai_text = "".join(block["text"] for block in ai_content if "text" in block)
            else:
                ai_text = str(ai_content)
                
            logger.info(f"✅ Agent responded: '{ai_text[:50]}...'")

        except Exception as e:
            logger.error(f"❌ Agent invocation failed: {e}")
            ai_text = "I'm having trouble connecting right now. Please try again in a moment. 😔"

        # 6. Save AI Response
        ai_msg = Message(
            id=generate_id(),
            conversation_id=conversation_id,
            sender_type="ai",
            content=ai_text,
            timestamp=datetime.utcnow()
        )
        self.db.add(ai_msg)

        # 7. Update conversation timestamp
        conv.last_message_at = datetime.utcnow()
        self.db.commit()

        return {
            "user_message": user_msg,
            "ai_message": ai_msg,
            "emotion": emotion_data
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
