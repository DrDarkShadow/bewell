from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str

class Token(BaseModel):
    access_token: str
    token_type: str

class MessageCreate(BaseModel):
    receiver_id: str
    content: str  # Encrypted content string

class Message(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    content: str
    timestamp: datetime
