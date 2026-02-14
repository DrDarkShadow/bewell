import os
import sys

# Add src to python path
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

from urllib.parse import urlparse
from config.settings import settings

def debug_connection():
    url = settings.DATABASE_URL
    if not url:
        print("❌ DATABASE_URL is not set!")
        return

    try:
        # redacted_url = url
        # if ":" in url and "@" in url:
        #    ... (logic to redact password)
        # simplistic redaction for display
        print(f"Original URL length: {len(url)}")
        
        parsed = urlparse(url)
        print(f"Scheme: {parsed.scheme}")
        print(f"Hostname detected: '{parsed.hostname}'")
        print(f"Port detected: {parsed.port}")
        print(f"Username detected: '{parsed.username}'")
        
        if parsed.password:
            print("Password detected: Yes (length: {})".format(len(parsed.password)))
            if "@" in parsed.password:
                 print("⚠️ WARNING: Password contains '@'. This might break the URL parsing!")
                 print("   The part after '@' is being interpreted as the hostname.")
                 print("   Solution: URL-encode the password (replace '@' with '%40').")
        else:
            print("Password detected: No/None")

        print("\nAttempting connection with psycopg2...")
        import psycopg2
        conn = psycopg2.connect(url)
        print("✅ Connection successful!")
        conn.close()

    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    debug_connection()
