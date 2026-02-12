"""
API Dependencies
Handles Authentication & Authorization checks
Separated from utils/auth.py for cleaner architecture
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from utils.auth import decode_token

# Security scheme (Bearer Token expected in Header)
security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Verify JWT token and return user info (sub, role)
    Use this dependency to PROTECT routes
    """
    token = credentials.credentials
    try:
        payload = decode_token(token)
        return payload  # {"sub": "123", "role": "patient", ...}
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def require_patient(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Authorization: Only allow PATIENTS
    """
    if current_user.get("role") != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Patients only"
        )
    return current_user

def require_professional(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Authorization: Only allow PROFESSIONALS
    """
    if current_user.get("role") != "professional":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Professionals only"
        )
    return current_user
