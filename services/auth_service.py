from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.user import User, UserRole
from utils.snowflake import generate_id
from utils.auth import hash_password, verify_password, create_access_token

class AuthService:
    """Authentication business logic"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def signup(self, email: str, password: str, role: str, name: str, phone: str = None):
        """
        Create new user account
        
        Args:
            email: User email
            password: Plain text password
            role: 'patient' or 'professional'
            name: Full name
            phone: Phone number (optional)
        
        Returns:
            {"token": "...", "user": {...}}
        
        Raises:
            HTTPException: If email already exists
        """
        # Check duplicate
        existing = self.db.query(User).filter(User.email == email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user
        # Note: role is expected to be a string here, converted to Enum for DB
        user = User(
            id=generate_id(),
            email=email,
            password_hash=hash_password(password),
            role=UserRole(role),
            name=name,
            phone=phone
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        # Generate token
        token = create_access_token(user.id, user.role.value)
        
        return {
            "token": token,
            "user": user.to_dict()
        }
    
    def login(self, email: str, password: str):
        """
        Authenticate user
        
        Args:
            email: User email
            password: Plain text password
        
        Returns:
            {"token": "...", "user": {...}}
        
        Raises:
            HTTPException: If credentials invalid
        """
        # Find user
        user = self.db.query(User).filter(User.email == email).first()
        
        if not user or not verify_password(password, user.password_hash):
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
    
    def get_user_by_id(self, user_id: int):
        """Get user by ID"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user.to_dict()
