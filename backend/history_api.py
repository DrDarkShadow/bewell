from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import json
import os

router = APIRouter()

# In-memory store for demo (replace with DB in production)
CHAT_HISTORY_FILE = os.path.join(os.path.dirname(__file__), '../chat_history.json')

class ChatSession(BaseModel):
    id: str
    messages: List[dict]
    timestamp: Optional[str] = None

@router.get("/history", response_model=List[ChatSession])
def get_chat_history():
    if not os.path.exists(CHAT_HISTORY_FILE):
        return []
    with open(CHAT_HISTORY_FILE, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
            return data if isinstance(data, list) else []
        except Exception:
            return []

@router.post("/history", response_model=bool)
def save_chat_session(session: ChatSession):
    data = []
    if os.path.exists(CHAT_HISTORY_FILE):
        with open(CHAT_HISTORY_FILE, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except Exception:
                data = []
    data.append(session.dict())
    with open(CHAT_HISTORY_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return True
