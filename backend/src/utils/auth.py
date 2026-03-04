"""
Authentication Utilities (Production Ready)
Handles password hashing (bcrypt) and JWT operations.
"""
from datetime import datetime, timedelta
import bcrypt
import jwt
from config.settings import settings
from fastapi import HTTPException, status
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")  # Removed due to version conflict

def hash_password(password: str) -> str:
    """
    Hash a plain password using bcrypt (native library).
    """
    # Generate salt and hash
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Check if plain password matches the stored hash.
    Safe against timing attacks.
    """
    pwd_bytes = plain_password.encode('utf-8')
    hash_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hash_bytes)

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
