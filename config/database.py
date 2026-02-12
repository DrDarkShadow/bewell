from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool
from config.settings import settings

# Connection pool configuration
POOL_SIZE = 5          # Number of connections to keep
MAX_OVERFLOW = 10      # Additional connections when needed
POOL_TIMEOUT = 30      # Seconds to wait for connection
POOL_RECYCLE = 3600    # Recycle connections after 1 hour

# Create engine with production settings
engine = create_engine(
    settings.DATABASE_URL,
    
    # Logging - only in development
    echo=settings.ENVIRONMENT == "development",
    
    # Connection pool
    poolclass=QueuePool,
    pool_size=POOL_SIZE,
    max_overflow=MAX_OVERFLOW,
    pool_timeout=POOL_TIMEOUT,
    pool_recycle=POOL_RECYCLE,
    
    # Connection health check
    pool_pre_ping=True,  # Test connection before using
    
    # Performance
    connect_args={
        "connect_timeout": 10,  # Connection timeout
        "options": "-c timezone=utc"  # Always use UTC
    }
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for models
Base = declarative_base()

# Database dependency with proper error handling
def get_db():
    """
    Dependency for database session
    Properly handles connection cleanup
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()