import requests
import json

base_url = "http://localhost:8000/api/v1"
auth_url = f"{base_url}/auth/local/login"
chat_url = f"{base_url}/patient/chat"

print("Logging in...")
res = requests.post(auth_url, json={"email": "patient@bewell.app", "password": "Patient123"})
if not res.ok:
    print(f"Login failed: {res.text}")
    exit(1)

token = res.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

print("Starting chat...")
# Get conversations first to see if we can just continue one
res = requests.get(f"{chat_url}/conversations", headers=headers)
conv_id = None
if res.ok and len(res.json()) > 0:
    conv_id = res.json()[0]["id"]
    print(f"Resuming conversation {conv_id}")
else:
    res = requests.post(f"{chat_url}/start", headers=headers)
    if not res.ok:
        print(f"Start chat failed: {res.text}")
        exit(1)
    conv_id = res.json().get("conversation_id")
    print(f"Started new conversation {conv_id}")

print(f"Sending message to {conv_id}...")
# Send message
msg_url = f"{chat_url}/{conv_id}/message"
res = requests.post(msg_url, json={"content": "Hello! I am testing the system. How are you?"}, headers=headers)

print(f"Status CODE: {res.status_code}")
try:
    print("Response JSON:")
    print(json.dumps(res.json(), indent=2))
except Exception:
    print("Raw Response output:")
    print(res.text)
