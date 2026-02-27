import sys
import os
sys.path.append(r'c:\Users\PRATEEK G\Desktop\bewell\backend\src')
from config.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    # Fetch all users with role PROFESSIONAL or professional
    query = text("SELECT id, name, role, is_deleted FROM users WHERE role::text ILIKE 'professional'")
    res = db.execute(query).fetchall()
    print(f"Total Professionals found: {len(res)}")
    for r in res:
        print(f"ID: {r[0]}, Name: {r[1]}, Role: {r[2]}, IsDeleted: {r[3]}")
    
    # Check if any have is_deleted=True
    deleted = [r for r in res if r[3] is True]
    print(f"Deleted pros: {len(deleted)}")
    
    # Check if any have is_deleted=None
    null_deleted = [r for r in res if r[3] is None]
    print(f"NULL is_deleted pros: {len(null_deleted)}")

except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
