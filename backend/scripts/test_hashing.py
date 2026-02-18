import sys
import os

# Add src to python path so imports work
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
src_dir = os.path.join(parent_dir, 'src')
sys.path.append(src_dir)

from utils.auth import hash_password, verify_password

try:
    password = "TestPassword123"
    print(f"Testing hashing for: '{password}' (len={len(password)})")
    hashed = hash_password(password)
    print(f"✅ Hash generated: {hashed}")
    
    is_valid = verify_password(password, hashed)
    print(f"✅ Verification: {is_valid}")

except Exception as e:
    print(f"❌ Hashing Failed: {e}")
    sys.exit(1)
