import sys
import os

# Add src to python path so imports work
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
src_dir = os.path.join(parent_dir, 'src')
sys.path.append(src_dir)

from sqlalchemy import create_engine, MetaData, text
from config.settings import settings

def params_url(url):
    # Fix for SQLAlchemy 1.4+ if url is string
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url

try:
    print("🚀 Fixing Database Schema...")
    engine = create_engine(params_url(settings.DATABASE_URL))
    
    # Tables to drop in order (dependents first)
    tables_to_drop = [
        "appointments",
        "escalations",
        "consent_logs",
        "notifications",
        "profiles",
        "messages",
        "conversations",
        "users"
    ]
    
    validation_conn = engine.connect()
    trans = validation_conn.begin()
    
    for table in tables_to_drop:
        print(f"🗑️  Dropping table: {table}...")
        try:
            # Wrap in text() for SQLAlchemy execution
            validation_conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
        except Exception as e:
            print(f"⚠️  Error dropping {table}: {e}")
            
    trans.commit()
    validation_conn.close()
    
    print("✅ All tables dropped. Restart server to recreate them!")

except Exception as e:
    print(f"❌ Error: {e}")
