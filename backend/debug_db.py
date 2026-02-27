import sys
import os
sys.path.append(r'c:\Users\PRATEEK G\Desktop\bewell\backend\src')
from config.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    # First check tables
    tables = db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")).fetchall()
    print("Tables in public schema:", [t[0] for t in tables])

    # Check professionals
    query = text("SELECT id, name, role, is_deleted FROM users WHERE role ILIKE 'professional'")
    res = db.execute(query).fetchall()
    print("\nProfessionals found:")
    for r in res:
        print(f"ID: {r[0]}, Name: {r[1]}, Role: {r[2]}, IsDeleted: {r[3]}")
    
    if not res:
        print("\nNo professionals found with ILIKE 'professional'. Fetching all users to see roles...")
        all_users = db.execute(text("SELECT role FROM users LIMIT 20")).fetchall()
        roles = set([r[0] for r in all_users])
        print("Unique roles found in first 20 users:", roles)

except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
