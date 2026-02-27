import sys
import os
sys.path.append(r'c:\Users\PRATEEK G\Desktop\bewell\backend\src')
from config.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    count = db.execute(text('SELECT count(*) FROM users')).scalar()
    with open('db_stats.txt', 'w') as f:
        f.write(f'TOTAL_USERS_COUNT: {count}\n')
        
        # Also check unique roles
        roles = db.execute(text('SELECT DISTINCT role::text FROM users')).fetchall()
        f.write(f'UNIQUE_ROLES: {[r[0] for r in roles]}\n')
finally:
    db.close()
