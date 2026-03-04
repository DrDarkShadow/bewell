"""
Migration script to add request_id column to appointments table
"""
import sys
import os

# Add project root to path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.insert(0, os.path.join(backend_dir, 'src'))

from sqlalchemy import text
from config.database import engine

def add_request_id_column():
    """Add request_id column to appointments table"""
    
    with engine.connect() as conn:
        # Check if column already exists
        check_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='appointments' AND column_name='request_id'
        """)
        
        result = conn.execute(check_query).fetchone()
        
        if result:
            print("✓ Column 'request_id' already exists in appointments table")
            return
        
        # Add the column
        print("Adding 'request_id' column to appointments table...")
        
        alter_query = text("""
            ALTER TABLE appointments 
            ADD COLUMN request_id BIGINT,
            ADD CONSTRAINT fk_appointments_request_id 
                FOREIGN KEY (request_id) 
                REFERENCES appointment_requests(id)
        """)
        
        conn.execute(alter_query)
        conn.commit()
        
        print("✓ Successfully added 'request_id' column to appointments table")

if __name__ == "__main__":
    try:
        add_request_id_column()
        print("\n✓ Migration completed successfully!")
    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
