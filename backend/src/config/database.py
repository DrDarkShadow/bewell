from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool, NullPool
from config.settings import settings

# Determine if we are using Supabase Transaction Pooler (port 6543)
is_pooler = "pooler.supabase.com" in settings.DATABASE_URL or ":6543" in settings.DATABASE_URL

# Connection pool configuration
POOL_SIZE = 5          # Number of connections to keep
MAX_OVERFLOW = 10      # Additional connections when needed
POOL_TIMEOUT = 30      # Seconds to wait for connection
POOL_RECYCLE = 3600    # Recycle connections after 1 hour

# Create engine with production settings
engine = create_engine(
    settings.DATABASE_URL,
    
    # Logging - only in development
    # echo=settings.ENVIRONMENT == "development",
    
    # Connection pool configuration
    # If using Supabase Transaction Pooler, disable client-side pooling (NullPool)
    # Otherwise, use standard QueuePool
    poolclass=NullPool if is_pooler else QueuePool,
    **({
        "pool_size": POOL_SIZE,
        "max_overflow": MAX_OVERFLOW,
        "pool_timeout": POOL_TIMEOUT,
        "pool_recycle": POOL_RECYCLE,
    } if not is_pooler else {}),
    
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