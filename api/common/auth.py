"""
Authentication endpoints
- Local Auth: /auth/local/signup, /auth/local/login
- Cognito Auth: Handled by Frontend, verified by Backend (FUTURE)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, validator
from config.database import get_db
from models.user import UserRole
from services.auth_service import AuthService
from api.dependencies import get_current_user # Import dependency

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ========== Request/Response Models ==========

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    role: str  # "patient" or "professional"
    name: str
    phone: str = None
    
    @validator('role')
    def validate_role(cls, v):
        if v not in ['patient', 'professional']:
            raise ValueError('Role must be patient or professional')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain digit')
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    token: str
    user: dict

# ========== Local Auth Endpoints (Active Now) ==========

@router.post("/local/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def local_signup(request: SignupRequest, db: Session = Depends(get_db)):
    """
    Local Signup (Dev Only)
    Delegates to AuthService
    """
    service = AuthService(db)
    return service.signup(
        email=request.email,
        password=request.password,
        role=request.role,
        name=request.name,
        phone=request.phone
    )

@router.post("/local/login", response_model=AuthResponse)
def local_login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Local Login (Dev Only)
    Delegates to AuthService
    """
    service = AuthService(db)
    return service.login(
        email=request.email,
        password=request.password
    )

# ========== Protected Route Test ==========

@router.get("/me")
def get_current_user_info(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Get current user info (protected route)
    Requires valid Bearer Token
    """
    service = AuthService(db)
    try:
        user = service.get_user_by_id(int(current_user["sub"]))
        return user
    except ValueError:
        # Handle case where sub is not an int (shouldn't happen with Snowflake IDs)
        raise HTTPException(status_code=400, detail="Invalid user ID format method")
