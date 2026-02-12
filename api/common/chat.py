"""
Patient Chat APIs
Merged: richer Pydantic models + correct auth imports
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel

from config.database import get_db
from api.dependencies import require_patient
from services.chat_service import ChatService
from models.conversation import Conversation, Message

router = APIRouter(prefix="/patient/chat", tags=["Patient Chat"])

# ========== Request/Response Models ==========

class StartChatResponse(BaseModel):
    conversation_id: str
    status: str

class MessageRequest(BaseModel):
    content: str

    class Config:
        json_schema_extra = {
            "example": {"content": "I'm feeling stressed about work"}
        }

class MessageResponse(BaseModel):
    id: str
    sender: str
    content: str
    timestamp: Optional[str] = None
    emotion_score: Optional[dict] = None

class SendMessageResponse(BaseModel):
    conversation_id: str
    user_message: MessageResponse
    ai_message: MessageResponse

class ChatHistoryResponse(BaseModel):
    conversation_id: str
    status: str
    message_count: int
    messages: List[MessageResponse]

class ConversationSummary(BaseModel):
    id: str
    status: str
    started_at: str
    last_message_at: Optional[str] = None
    message_count: int
    summary: Optional[str] = None

# ========== Endpoints ==========

@router.post("/start", response_model=StartChatResponse)
async def start_chat(
    current_user: dict = Depends(require_patient),
    db: Session = Depends(get_db)
):
    """Start a new conversation"""
    service = ChatService(db)
    user_id = int(current_user["sub"])
    conv = service.start_conversation(user_id)

    return {
        "conversation_id": str(conv.id),
        "status": conv.status
    }


@router.post("/{conversation_id}/message", response_model=SendMessageResponse)
async def send_message(
    conversation_id: str,
    request: MessageRequest,
    current_user: dict = Depends(require_patient),
    db: Session = Depends(get_db)
):
    """Send message to AI — saves both user + AI messages"""
    service = ChatService(db)
    user_id = int(current_user["sub"])

    result = service.send_message(
        conversation_id=int(conversation_id),
        user_id=user_id,
        content=request.content
    )

    return {
        "conversation_id": conversation_id,
        "user_message": result["user_message"].to_dict(),
        "ai_message": result["ai_message"].to_dict()
    }


@router.get("/{conversation_id}/history", response_model=ChatHistoryResponse)
async def get_history(
    conversation_id: str,
    current_user: dict = Depends(require_patient),
    db: Session = Depends(get_db)
):
    """Get full conversation history"""
    service = ChatService(db)
    user_id = int(current_user["sub"])

    messages = service.get_conversation_history(int(conversation_id), user_id)

    return {
        "conversation_id": conversation_id,
        "status": "active",
        "message_count": len(messages),
        "messages": [msg.to_dict() for msg in messages]
    }


@router.get("/conversations", response_model=List[ConversationSummary])
async def list_conversations(
    current_user: dict = Depends(require_patient),
    db: Session = Depends(get_db)
):
    """List all user conversations with message counts"""
    service = ChatService(db)
    user_id = int(current_user["sub"])

    conversations = service.get_user_conversations(user_id)

    # Batch query: get message counts for all conversations at once
    conv_ids = [c.id for c in conversations]
    counts = {}
    if conv_ids:
        rows = db.query(
            Message.conversation_id,
            func.count(Message.id)
        ).filter(
            Message.conversation_id.in_(conv_ids)
        ).group_by(Message.conversation_id).all()

        counts = {row[0]: row[1] for row in rows}

    return [
        {
            "id": str(c.id),
            "status": c.status,
            "started_at": c.started_at.isoformat(),
            "last_message_at": c.last_message_at.isoformat() if c.last_message_at else None,
            "message_count": counts.get(c.id, 0),
            "summary": c.summary
        }
        for c in conversations
    ]
