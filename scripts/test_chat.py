import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_chat():
    print("🚀 Testing Chat API...")
    
    # 1. Login to get token
    print("🔑 Logging in...")
    email = f"test_{int(datetime.now().timestamp())}@example.com"
    login_data = {
        "email": email,
        "password": "Password123"
    }
    
    res = requests.post(f"{BASE_URL}/auth/local/login", json=login_data, timeout=120)
    if res.status_code not in [200, 201]:
        print(f"👤 User not found or login failed ({res.status_code}), signing up...")
        signup_data = {
            "email": email,
            "password": "Password123",
            "name": "Test User", 
            "role": "patient"
        }
        res = requests.post(f"{BASE_URL}/auth/local/signup", json=signup_data, timeout=30)
        if res.status_code not in [200, 201]:
            print(f"❌ Signup/Login Failed: {res.status_code} - {res.text}")
            return

    token = res.json()["token"]
    print("✅ Logged in successfully.")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Start Conversation
    print("💬 Starting new conversation...")
    res = requests.post(f"{BASE_URL}/patient/chat/start", headers=headers)
    if res.status_code != 200:
        print(f"❌ Start Chat Failed: {res.status_code} - {res.text}")
        return
        
    conv_id = res.json()["conversation_id"]
    print(f"✅ Conversation ID: {conv_id}")
    
    # 3. Send Message
    print("✉️ Sending message...")
    msg_data = {"content": "I am feeling stressed today"}
    res = requests.post(
        f"{BASE_URL}/patient/chat/{conv_id}/message", 
        headers=headers, 
        json=msg_data
    )
    
    if res.status_code == 200:
        print("✅ Message sent successfully!")
        print(json.dumps(res.json(), indent=2))
    else:
        print(f"❌ Message Failed: {res.status_code} - {res.text}")

if __name__ == "__main__":
    test_chat()
