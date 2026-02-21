import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

class Settings:
    """Application settings with validation"""
    
    # AWS Configuration
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    
    # Fix for SQLAlchemy (Postgresql dialect) if URL starts with postgres:// (common in Supabase/Heroku)
    if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    # JWT Configuration  
    JWT_SECRET: str = os.getenv("JWT_SECRET")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # Worker Configuration
    WORKER_ID: int = int(os.getenv("WORKER_ID", 1))

    # Bedrock Configuration
    BEDROCK_MODEL_ID: str = "amazon.nova-lite-v1:0"
    
    # Validation
    def __init__(self):
        self._validate()
    
    def _validate(self):
        """Validate required settings"""
        required = [
            "AWS_ACCESS_KEY_ID",
            "AWS_SECRET_ACCESS_KEY", 
            "DATABASE_URL",
            "JWT_SECRET"
        ]
        
        missing = []
        for var in required:
            if not getattr(self, var):
                missing.append(var)
        
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
        
        print("Configuration validated successfully")

# Create singleton instance
settings = Settings()