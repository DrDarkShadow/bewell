from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import sys
import os

# Add project root to path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

# Now we can import from agent
try:
    from agent.chatbot.agent import agent
except ImportError:
    # Fallback if running from root
    from agent.chatbot.agent import agent

from agent.chatbot.model_fusion import calculate_stress_score

import asyncio
from backend.history_api import router as history_router
from backend.games_api import games_router

app = FastAPI()

# Allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Companion Bot FastAPI backend is running!"}

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

class ChatResponse(BaseModel):
    messages: List[Message]


import concurrent.futures

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(chat: ChatRequest):
    user_message = chat.messages[-1].content if chat.messages else ""
    # Build conversation context for LLM
    conv_history = [{"role": m.role, "content": m.content} for m in chat.messages]
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, lambda: agent.invoke({"messages": conv_history}))
    content = result["messages"][-1].content if "messages" in result and result["messages"] else ""
    if isinstance(content, list):
        response = "".join(block["text"] if isinstance(block, dict) and "text" in block else str(block) for block in content)
    else:
        response = content
    reply = Message(role="assistant", content=response)
    return ChatResponse(messages=chat.messages + [reply])

class StressResult(BaseModel):
    stress_score: float
    stress_level: str
    sentiment: str
    emotion: str
    recommendation: str

@app.post("/stress", response_model=StressResult)
def stress_endpoint(request: ChatRequest):
    # Use the last user message for stress analysis
    user_message = next((m.content for m in reversed(request.messages) if m.role == "user"), "")
    result = calculate_stress_score(user_message)
    return StressResult(
        stress_score=result.stress_score,
        stress_level=result.stress_level,
        sentiment=getattr(result.sentiment, 'label', ''),
        emotion=getattr(result.emotions, 'primary_emotion', ''),
        recommendation=result.recommendation
    )

app.include_router(history_router, prefix="/api")
app.include_router(games_router, prefix="/api")
