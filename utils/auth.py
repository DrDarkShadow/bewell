"""
Authentication Utilities (Production Ready)
Handles password hashing (bcrypt) and JWT operations.
"""
from datetime import datetime, timedelta
import jwt
from fastapi import HTTPException, status
from passlib.context import CryptContext
from config.settings import settings

# Password Hashing Setup
# schemes=["bcrypt"]: Industry standard algorithm (slow & secure)
# deprecated="auto": Automatically handle old hashes if we upgrade later
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """
    Hash a plain password using bcrypt.
    Why bcrypt? It limits brute-force attacks by being intentionally slow.
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Check if plain password matches the stored hash.
    Safe against timing attacks.
    """
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(user_id: str, role: str) -> str:
    """
    Generate a JWT Token.
    Payload (Data inside token):
    - sub: Subject (User ID) - Standard Claim
    - role: Custom Claim (for permissions)
    - exp: Expiration Time (Security)
    - iat: Issued At (Audit)
    """
    expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    
    to_encode = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
        "iat": datetime.utcnow()
    }
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.JWT_SECRET, 
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt

def decode_token(token: str) -> dict:
    """
    Verify and Decode a JWT Token.
    Checks:
    1. Signature: Was it signed by OUR secret key?
    2. Expiration: Is it still valid?
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
            detail="Token has expired. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token. Authentication failed.",
            headers={"WWW-Authenticate": "Bearer"},
        )
