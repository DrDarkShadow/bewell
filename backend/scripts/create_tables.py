import sys
import os

# Add backend and backend/src to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))
sys.path.append(os.path.join(os.getcwd(), 'backend', 'src'))

from config.database import engine, Base
from models.user import User
from models.conversation import Conversation, Message
from models.consent import ConsentLog
from models.appointment import Appointment
from models.professional import ProfessionalProfile, ProfessionalReview

def create_all_tables():
    """Create all tables (Drop existing first)"""
    print("⚠️  Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("🗑️  All tables dropped!")
    
    print("🔨 Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ All tables (including Professional Profiles) created successfully!")

if __name__ == "__main__":
    create_all_tables()
