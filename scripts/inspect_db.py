import sys
import os

# Add src to python path so imports work
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
src_dir = os.path.join(parent_dir, 'src')
sys.path.append(src_dir)

from sqlalchemy import create_engine, inspect
from config.settings import settings

try:
    engine = create_engine(settings.DATABASE_URL)
    inspector = inspect(engine)
    
    table_name = "users"
    if inspector.has_table(table_name):
        print(f"✅ Table '{table_name}' exists.")
        columns = inspector.get_columns(table_name)
        for col in columns:
            print(f"   - {col['name']}: {col['type']}")
            if col['name'] == 'id':
                print(f"     -> PK: {col.get('primary_key')}, Type: {col['type']}")
    else:
        print(f"❌ Table '{table_name}' does not exist.")

except Exception as e:
    print(f"❌ Connection Failed: {e}")
