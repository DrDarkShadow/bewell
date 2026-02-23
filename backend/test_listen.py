import requests
import json
import os

base_url = "http://localhost:8000/api/v1"
auth_url = f"{base_url}/auth/local/login"
listening_url = f"{base_url}/patient/listening/transcribe-summarize"

print("Logging in...")
res = requests.post(auth_url, json={"email": "patient@bewell.app", "password": "Patient123"})
if not res.ok:
    print(f"Login failed: {res.text}")
    exit(1)

token = res.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

# Create a small dummy WAV file
dummy_wav = b"RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80\xbb\x00\x00\x00w\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
with open("test.wav", "wb") as f:
    f.write(dummy_wav)

print("Starting listening test...")
files = {
    'files': ('test.wav', open('test.wav', 'rb'), 'audio/wav')
}
data = {
    'speakers': 'Patient',
    'mental_health_only': 'true'
}

res = requests.post(listening_url, headers=headers, files=files, data=data)

print(f"Status CODE: {res.status_code}")
try:
    print("Response JSON:")
    print(json.dumps(res.json(), indent=2))
except Exception:
    print("Raw Response output:")
    print(res.text)

if os.path.exists("test.wav"):
    os.remove("test.wav")
