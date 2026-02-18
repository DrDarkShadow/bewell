import sys
import os

sys.path.append(os.path.join(os.getcwd(), "src"))

from config.database import SessionLocal
from models.user import User

def debug_user(email):
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    if user:
        print(f"User: {user.email}")
        print(f"Hash: {user.password_hash!r}")
        print(f"Hash Type: {type(user.password_hash)}")
    else:
        print("User not found")
    db.close()

if __name__ == "__main__":
    debug_user("test@example.com")
