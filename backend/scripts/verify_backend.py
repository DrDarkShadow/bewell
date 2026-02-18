import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"
API_URL = f"{BASE_URL}/api/v1"

def test_backend():
    print(f"🚀 Testing Backend at {BASE_URL}...")
    
    # 1. Health Check
    try:
        res = requests.get(f"{BASE_URL}/")
        if res.status_code == 200:
            print("✅ Health Check Passed!")
        else:
            print(f"❌ Health Check Failed: {res.status_code}")
            return
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
        print("⚠️  Make sure 'uvicorn src.main:app --reload' is running!")
        return

    # 2. Signup
    email = f"test_user_{int(time.time())}@example.com"
    password = "TestPassword123"
    payload = {
        "email": email,
        "password": password,
        "role": "patient",
        "name": "Test User"
    }
    
    print("\n👤 Testing Signup...")
    res = requests.post(f"{API_URL}/auth/local/signup", json=payload)
    if res.status_code == 201:
        print("✅ Signup Successful!")
        user_data = res.json()
        print(f"   Created User ID: {user_data['user']['id']}")
    else:
        print(f"❌ Signup Failed: {res.status_code} - {res.text}")
        return

    # 3. Login
    print("\n🔑 Testing Login...")
    login_payload = {
        "email": email,
        "password": password
    }
    res = requests.post(f"{API_URL}/auth/local/login", json=login_payload)
    if res.status_code == 200:
        print("✅ Login Successful!")
        token = res.json()['token']
        print(f"   Token received (len={len(token)})")
    else:
        print(f"❌ Login Failed: {res.status_code} - {res.text}")
        return

    print("\n✨ All Backend Tests Passed!")

if __name__ == "__main__":
    test_backend()
