from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from pydantic import BaseModel
import uuid
import json
import os

from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
import base64

try:
    from backend.moderation import check_message, record_violation, is_blocked, toggle_manual_block, get_block_status
except ImportError:
    from moderation import check_message, record_violation, is_blocked, toggle_manual_block, get_block_status

# ─────────────── Config ───────────────
SECRET_KEY = "anonomus_super_secret_key_32chr!"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

ENCRYPTION_KEY = base64.urlsafe_b64encode(b"anonomus_enc_key_32bytes!!!!!!!!")
cipher = Fernet(ENCRYPTION_KEY)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ─────────────── Storage ───────────────
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
USERS_FILE = os.path.join(DATA_DIR, "users.json")
MESSAGES_FILE = os.path.join(DATA_DIR, "messages.json")

os.makedirs(DATA_DIR, exist_ok=True)

def read_json(path):
    if not os.path.exists(path):
        with open(path, "w") as f:
            json.dump([], f)
    with open(path, "r") as f:
        try:
            return json.load(f)
        except:
            return []

def write_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2, default=str)

def append_json(path, item):
    data = read_json(path)
    data.append(item)
    write_json(path, data)

# ─────────────── Models ───────────────
class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# ─────────────── Auth Helpers ───────────────
def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def hash_password(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=60))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise exc
    except JWTError:
        raise exc
    users = read_json(USERS_FILE)
    user = next((u for u in users if u["email"] == email), None)
    if user is None:
        raise exc
    return user

# ─────────────── WebSocket Manager ───────────────
class ConnectionManager:
    def __init__(self):
        self.connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, ws: WebSocket):
        await ws.accept()
        self.connections[user_id] = ws

    def disconnect(self, user_id: str):
        self.connections.pop(user_id, None)

    async def send_to(self, user_id: str, data: dict):
        ws = self.connections.get(user_id)
        if ws:
            try:
                await ws.send_json(data)
            except:
                self.disconnect(user_id)

    async def broadcast(self, data: dict):
        for ws in list(self.connections.values()):
            try:
                await ws.send_json(data)
            except:
                pass

    def get_online_users(self) -> List[str]:
        return list(self.connections.keys())

manager = ConnectionManager()

# ─────────────── App ───────────────
app = FastAPI(title="Anonomus API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────── Routes ───────────────
@app.post("/register")
def register(user_in: UserCreate):
    users = read_json(USERS_FILE)
    if any(u["email"] == user_in.email for u in users):
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = {
        "id": str(uuid.uuid4()),
        "name": user_in.name,
        "email": user_in.email,
        "hashed_password": hash_password(user_in.password),
    }
    append_json(USERS_FILE, new_user)
    return {"id": new_user["id"], "name": new_user["name"], "email": new_user["email"]}

@app.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    users = read_json(USERS_FILE)
    user = next((u for u in users if u["email"] == form_data.username), None)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(data={"sub": user["email"]})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/users/me")
async def me(current_user: dict = Depends(get_current_user)):
    return {"id": current_user["id"], "name": current_user["name"], "email": current_user["email"]}

@app.get("/users")
async def list_users(current_user: dict = Depends(get_current_user)):
    users = read_json(USERS_FILE)
    res = []
    for u in users:
        if u["id"] != current_user["id"]:
            block_st = get_block_status(current_user["id"], u["id"])
            res.append({
                "id": u["id"], 
                "name": u["name"], 
                "email": u["email"],
                "blocked_by_me": block_st["is_blocked_by_me"],
                "blocking_me": block_st["is_blocking_me"]
            })
    return res

@app.post("/users/{user_id}/block")
async def block_user(user_id: str, current_user: dict = Depends(get_current_user)):
    is_now_blocked = toggle_manual_block(current_user["id"], user_id)
    return {"status": "success", "blocked": is_now_blocked}

@app.get("/messages/{chat_with_id}")
async def get_messages(chat_with_id: str, current_user: dict = Depends(get_current_user)):
    all_msgs = read_json(MESSAGES_FILE)
    result = []
    for m in all_msgs:
        if (m["sender_id"] == current_user["id"] and m["receiver_id"] == chat_with_id) or \
           (m["sender_id"] == chat_with_id and m["receiver_id"] == current_user["id"]):
            try:
                m_copy = m.copy()
                m_copy["content"] = cipher.decrypt(m["content"].encode()).decode()
                result.append(m_copy)
            except Exception:
                result.append(m)
    return result

@app.delete("/messages/{chat_with_id}")
async def delete_messages(chat_with_id: str, current_user: dict = Depends(get_current_user)):
    all_msgs = read_json(MESSAGES_FILE)
    # Filter out messages belonging to this pair
    new_msgs = [
        m for m in all_msgs
        if not (
            (m["sender_id"] == current_user["id"] and m["receiver_id"] == chat_with_id) or
            (m["sender_id"] == chat_with_id and m["receiver_id"] == current_user["id"])
        )
    ]
    write_json(MESSAGES_FILE, new_msgs)
    return {"status": "success", "message": "Chat deleted"}

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    # Broadcast that a user came online
    await manager.broadcast({"type": "presence", "user_id": user_id, "status": "online"})
    # Send current online users to the newly connected user
    await manager.send_to(user_id, {"type": "initial_presence", "online_users": manager.get_online_users()})
    
    try:
        while True:
            data = await websocket.receive_json()
            receiver_id = data.get("receiver_id")
            content = data.get("content", "").strip()
            if receiver_id and content:
                # ── MODERATION CHECK (Now Informational, letting user send msg) ──
                # if is_blocked(user_id, receiver_id):
                #     await manager.send_to(user_id, {"type": "blocked", "message": "🚫 You are blocked from this chat."})
                #     # continue  # We no longer block the message from being sent

                is_violation, v_type, v_msg = check_message(content, user_id, receiver_id)
                if is_violation:
                    count = record_violation(user_id, receiver_id)
                    await manager.send_to(user_id, {
                        "type": count >= 3 and "blocked" or "warning",
                        "warning_count": count,
                        "message": count >= 3 and "🚫 You have been blocked from this conversation." or f"{v_msg} (Warning {count}/3)"
                    })
                    continue
                # ─────────────────────

                encrypted = cipher.encrypt(content.encode()).decode()
                msg = {
                    "id": str(uuid.uuid4()),
                    "sender_id": user_id,
                    "receiver_id": receiver_id,
                    "content": encrypted,
                    "timestamp": datetime.utcnow().isoformat(),
                }
                append_json(MESSAGES_FILE, msg)
                # Send plain text to both parties over WebSocket
                msg_out = {**msg, "content": content}
                await manager.send_to(receiver_id, msg_out)
                await manager.send_to(user_id, msg_out)
    except WebSocketDisconnect:
        manager.disconnect(user_id)
        # Broadcast that a user went offline
        await manager.broadcast({"type": "presence", "user_id": user_id, "status": "offline"})
