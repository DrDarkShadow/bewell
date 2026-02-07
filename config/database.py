from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config.settings import settings

# SQLAlchemy engine - database connection
engine = create_engine(
    settings.DATABASE_URL,
    echo=True,  # SQL queries print honge (debugging ke liye)
    pool_pre_ping=True,  # Connection check before use
    pool_size=5,  # Connection pool size
    max_overflow=10
)

# Session factory - har request ke liye new session
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for models
Base = declarative_base()

# Dependency - FastAPI routes mein use hoga
def get_db():
    """
    Database session dependency
    Har API call ke liye naya session banata hai
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
