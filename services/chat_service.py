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
from services.ai_service import ai_service
from utils.snowflake import generate_id

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
        Send message and get AI response

        Flow:
        1. Verify ownership
        2. Save user message
        3. Build AI context (last 10 messages + summary)
        4. Call AI
        5. Save AI response
        6. Update timestamp
        7. Auto-summarize every 10 messages
        """
        conv = self._get_conversation(conversation_id, user_id)

        # Save user message
        user_msg = Message(
            id=generate_id(),
            conversation_id=conversation_id,
            sender_type="patient",
            content=content,
            timestamp=datetime.utcnow()
        )
        self.db.add(user_msg)

        logger.info(f"💬 User {user_id} sent message in conversation {conversation_id}")

        # Build AI context (last 10 messages, chronological)
        previous_messages = self.db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.timestamp.desc()).limit(10).all()[::-1]

        history_for_ai = [
            {
                "role": "user" if m.sender_type == "patient" else "assistant",
                "content": m.content
            }
            for m in previous_messages
        ]

        # Call AI with context + conversation summary
        try:
            ai_response = ai_service.get_chat_response(
                user_message=content,
                conversation_history=history_for_ai,
                conversation_summary=conv.summary  # ← extends context beyond 10 messages
            )
            logger.info(f"✅ AI responded: '{ai_response['response'][:50]}...'")

        except Exception as e:
            logger.error(f"❌ AI service failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get AI response"
            )

        # Save AI response (emotion_score is JSON column, no json.dumps needed)
        ai_msg = Message(
            id=generate_id(),
            conversation_id=conversation_id,
            sender_type="ai",
            content=ai_response["response"],
            emotion_score=ai_response.get("emotion_detected", {}),
            timestamp=datetime.utcnow()
        )
        self.db.add(ai_msg)

        # Update conversation timestamp
        conv.last_message_at = datetime.utcnow()

        # Auto-summarize every 10 messages
        total_msg_count = self.db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).count()

        if total_msg_count > 0 and total_msg_count % 10 == 0:
            logger.info(f"📝 Auto-summarizing (message count: {total_msg_count})")
            self._update_summary(conv, conversation_id)

        self.db.commit()

        return {
            "user_message": user_msg,
            "ai_message": ai_msg
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
