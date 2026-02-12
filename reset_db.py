"""
Script to DROP and RE-CREATE all tables
Includes new models: Escalation, Appointment, Notification, Profile
"""
from config.database import engine, Base
from models.user import User
from models.conversation import Conversation, Message
from models.consent import ConsentLog
# Import new models to register them with Base.metadata
from models.escalation import Escalation
from models.appointment import Appointment
from models.notification import Notification
from models.profile import Profile

def reset_database():
    """Drop and Create tables"""
    print("🗑️ Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("✅ Tables dropped.")
    
    print("🛠️ Creating new tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully!")
    
    # Verify tables created
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"📋 Created tables: {tables}")

if __name__ == "__main__":
    reset_database()
