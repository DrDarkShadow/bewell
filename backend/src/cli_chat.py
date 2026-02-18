import sys
import os
import requests
import json
import time

# Base URL
API_URL = "http://127.0.0.1:8000/api/v1"

# Colors
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header():
    print(f"{Colors.HEADER}{Colors.BOLD}")
    print("==================================================")
    print("       🧠 BeWell - AI Mental Health Companion      ")
    print("==================================================")
    print(f"{Colors.ENDC}")

def get_token():
    """Handle Login/Signup"""
    while True:
        print(f"\n{Colors.CYAN}1. Login{Colors.ENDC}")
        print(f"{Colors.CYAN}2. Signup{Colors.ENDC}")
        choice = input(f"\nChoose option (1/2): ").strip()
        
        if choice == "1":
            email = input("Email: ").strip()
            password = input("Password: ").strip()
            try:
                res = requests.post(f"{API_URL}/auth/local/login", json={"email": email, "password": password})
                if res.status_code == 200:
                    data = res.json()
                    print(f"\n{Colors.GREEN}✅ Login Successful! Welcome {data['user']['name']}{Colors.ENDC}")
                    return data['token'], data['user']['id'], data['user']['name']
                else:
                    print(f"\n{Colors.FAIL}❌ Login Failed: {res.text}{Colors.ENDC}")
            except Exception as e:
                print(f"\n{Colors.FAIL}⚠️ Error connecting to server: {e}{Colors.ENDC}")

        elif choice == "2":
            name = input("Name: ").strip()
            email = input("Email: ").strip()
            password = input("Password (min 8 chars, 1 upper, 1 digit): ").strip()
            try:
                payload = {
                    "email": email,
                    "password": password,
                    "role": "patient",
                    "name": name
                }
                res = requests.post(f"{API_URL}/auth/local/signup", json=payload)
                if res.status_code == 201:
                    print(f"\n{Colors.GREEN}✅ Signup Successful! Please Login.{Colors.ENDC}")
                else:
                    print(f"\n{Colors.FAIL}❌ Signup Failed: {res.text}{Colors.ENDC}")
            except Exception as e:
                print(f"\n{Colors.FAIL}⚠️ Error connecting to server: {e}{Colors.ENDC}")
        else:
            print("Invalid choice.")

def start_chat(token, user_id, user_name):
    """Chat Loop"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Start new conversation
    try:
        res = requests.post(f"{API_URL}/patient/chat/start", headers=headers)
        if res.status_code == 200:
            conv_id = res.json()['conversation_id']
            print(f"\n{Colors.BLUE}💬 New conversation started (ID: {conv_id}){Colors.ENDC}")
        else:
            print(f"{Colors.FAIL}Failed to start chat: {res.text}{Colors.ENDC}")
            return
    except Exception as e:
        print(f"{Colors.FAIL}Connection error: {e}{Colors.ENDC}")
        return

    print(f"\n{Colors.BOLD}Type 'exit' to quit.{Colors.ENDC}\n")

    while True:
        try:
            user_input = input(f"{Colors.GREEN}You: {Colors.ENDC}").strip()
            if user_input.lower() in ['exit', 'quit']:
                print(f"\n{Colors.HEADER}👋 Take care, {user_name}!{Colors.ENDC}")
                break
            
            if not user_input:
                continue

            # Send message
            payload = {"content": user_input}
            
            # Show typing...
            print(f"{Colors.WARNING}🤖 AI is thinking...{Colors.ENDC}", end="\r")
            
            start_time = time.time()
            res = requests.post(f"{API_URL}/patient/chat/{conv_id}/message", json=payload, headers=headers)
            
            if res.status_code == 200:
                data = res.json()
                ai_msg = data['ai_message']['content']
                emotion = data.get('emotion', {})
                suggestion = data.get('suggestion')
                
                # Clear typing line
                print(" " * 50, end="\r")
                
                # Print AI Response
                print(f"{Colors.BLUE}AI: {Colors.ENDC}{ai_msg}")
                
                # Print Emotion & Analysis
                if emotion:
                    stress = emotion.get('stress_score', 0)
                    stress_visual = "🔴" if stress > 0.7 else "🟡" if stress > 0.3 else "🟢"
                    emo_text = emotion.get('primary_emotion', 'neutral').upper()
                    print(f"\n   {Colors.WARNING}📊 Analysis:{Colors.ENDC} {stress_visual} {emo_text} (Stress: {stress:.0%})")
                
                # Print Suggestion
                if suggestion:
                    title = suggestion.get('title')
                    desc = suggestion.get('description')
                    stype = suggestion.get('type').upper()
                    print(f"   {Colors.CYAN}💡 Suggestion [{stype}]:{Colors.ENDC} {Colors.BOLD}{title}{Colors.ENDC}")
                    print(f"      {desc}")
                
                print("-" * 50)
            else:
                print(f"\n{Colors.FAIL}❌ Error: {res.text}{Colors.ENDC}")

        except KeyboardInterrupt:
            print("\n👋 Bye!")
            break
        except Exception as e:
            print(f"\n{Colors.FAIL}⚠️ Error: {e}{Colors.ENDC}")

if __name__ == "__main__":
    print_header()
    try:
        # Check if server is running
        try:
            requests.get(API_URL.replace("/api/v1", ""))
        except:
            print(f"{Colors.FAIL}⚠️  Server not running! Please run 'uvicorn src.main:app --reload' in another terminal.{Colors.ENDC}")
            sys.exit(1)

        token, uid, name = get_token()
        start_chat(token, uid, name)
    except KeyboardInterrupt:
        print("\n👋 Bye!")
