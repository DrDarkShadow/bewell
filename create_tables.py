"""
Script to create all tables in database
Ye ek baar run karo, tables ban jayenge
"""
from config.database import engine, Base
from models.user import User
from models.conversation import Conversation, Message
from models.consent import ConsentLog

def create_all_tables():
    """Create all tables"""
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully!")

if __name__ == "__main__":
    create_all_tables()