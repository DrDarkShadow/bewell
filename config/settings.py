import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

class Settings:
    # AWS
    AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
    
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL")
    
    # JWT
    JWT_SECRET = os.getenv("JWT_SECRET", "change-me")
    JWT_ALGORITHM = "HS256"
    
    # Bedrock
    BEDROCK_MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0"  # Haiku (fast + cheap)

settings = Settings()