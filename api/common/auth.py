"""
Authentication endpoints
- Signup (patient & professional)
- Login
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, validator
from config.database import get_db
from models.user import User, UserRole
from utils.snowflake import generate_id
from utils.auth import hash_password, verify_password, create_access_token

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
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    token: str
    user: dict

# ========== Endpoints ==========

@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """
    User signup - patient ya professional dono ke liye
    """
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = User(
        id=generate_id(),  # Snowflake ID
        email=request.email,
        password_hash=hash_password(request.password),
        role=UserRole(request.role),
        name=request.name,
        phone=request.phone
    )
    
    # Save to database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)  # Get the saved data back
    
    # Generate JWT token
    token = create_access_token(new_user.id, new_user.role.value)
    
    return {
        "token": token,
        "user": new_user.to_dict()
    }

@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    User login
    """
    
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    
    # Check user exists and password is correct
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Generate token
    token = create_access_token(user.id, user.role.value)
    
    return {
        "token": token,
        "user": user.to_dict()
    }

@router.get("/me")
def get_current_user_info(
    # TODO: Add authentication dependency
    # current_user: dict = Depends(get_current_user)
):
    """
    Get current user info (protected route)
    Abhi ke liye placeholder - Day 3 pe implement karenge
    """
    return {"message": "Protected route - will implement authentication tomorrow"}
