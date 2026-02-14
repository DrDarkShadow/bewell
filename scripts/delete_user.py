import sys
import os

sys.path.append(os.path.join(os.getcwd(), "src"))

from config.database import SessionLocal
from models.user import User

def delete_user(email):
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    if user:
        print(f"🗑️ Deleting user: {user.email}")
        
        # Delete related conversations first (since cascading might not be set in DB)
        from models.conversation import Conversation
        conversations = db.query(Conversation).filter(Conversation.patient_id == user.id).all()
        for conv in conversations:
             print(f"  - Deleting conversation {conv.id}")
             db.delete(conv)
        
        db.delete(user)
        db.commit()
        print("✅ User and related data deleted successfully")
    else:
        print("User not found")
    db.close()

if __name__ == "__main__":
    delete_user("test@example.com")
