"""
Authentication utilities
- Password hashing
- JWT token generation
- Token verification
"""
import hashlib
import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from config.settings import settings

def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return hash_password(plain_password) == hashed_password

def create_access_token(user_id: int, role: str) -> str:
    """
    Create JWT access token
    
    Args:
        user_id: User's snowflake ID
        role: 'patient' or 'professional'
    
    Returns:
        JWT token string
    """
    payload = {
        "user_id": str(user_id),  # String mein convert karo
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=24),  # 24 hour expiry
        "iat": datetime.utcnow()  # Issued at
    }
    
    token = jwt.encode(
        payload,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return token

def decode_token(token: str) -> dict:
    """
    Decode and verify JWT token
    
    Returns:
        Payload dict with user_id and role
    
    Raises:
        HTTPException if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )