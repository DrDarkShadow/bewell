from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import json
import os

games_router = APIRouter()

GAMES_FILE = os.path.join(os.path.dirname(__file__), '../games.json')

class GameQuestion(BaseModel):
    q: str
    a: Optional[str] = None

class Game(BaseModel):
    type: str
    title: str
    image: str
    questions: List[GameQuestion]

def load_games():
    if not os.path.exists(GAMES_FILE):
        return []
    with open(GAMES_FILE, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
            return data if isinstance(data, list) else []
        except Exception:
            return []

def save_games(games):
    with open(GAMES_FILE, 'w', encoding='utf-8') as f:
        json.dump(games, f, ensure_ascii=False, indent=2)

@games_router.get("/games", response_model=List[Game])
def get_games():
    return load_games()

@games_router.post("/games", response_model=bool)
def update_games(games: List[Game]):
    save_games([g.dict() for g in games])
    return True
