"""
Test AI Service
Run: python src/test_ai.py
"""
import sys
import os

# Add src to python path to allow imports
sys.path.append(os.path.join(os.path.dirname(__file__)))

from services.ai_service import ai_service
import json

def test_simple_message():
    """Test 1: Simple message"""
    print("\n" + "="*60)
    print("TEST 1: Simple Message")
    print("="*60)
    
    response = ai_service.get_chat_response(
        user_message="I'm feeling stressed about work"
    )
    
    print(f"\n💬 User: I'm feeling stressed about work")
    print(f"🤖 AI: {response['response']}")
    print(f"\n📊 Emotions: {json.dumps(response['emotion_detected'], indent=2)}")
    print(f"⏱️  Response time: {response['response_time_ms']}ms")
    print(f"🎫 Tokens used: {response['tokens_used']}")

def test_with_context():
    """Test 2: Conversation with context"""
    print("\n" + "="*60)
    print("TEST 2: Conversation with Context")
    print("="*60)
    
    # First message
    response1 = ai_service.get_chat_response(
        user_message="I'm having trouble sleeping"
    )
    print(f"\n💬 User: I'm having trouble sleeping")
    print(f"🤖 AI: {response1['response']}")
    
    # Second message with context
    history = [
        {"role": "user", "content": "I'm having trouble sleeping"},
        {"role": "assistant", "content": response1['response']}
    ]
    
    response2 = ai_service.get_chat_response(
        user_message="It's been like this for weeks",
        conversation_history=history
    )
    
    print(f"\n💬 User: It's been like this for weeks")
    print(f"🤖 AI: {response2['response']}")

def test_crisis_detection():
    """Test 3: Crisis detection"""
    print("\n" + "="*60)
    print("TEST 3: Crisis Detection")
    print("="*60)
    
    crisis_message = "I don't see any point in living anymore"
    
    response = ai_service.get_chat_response(
        user_message=crisis_message
    )
    
    print(f"\n💬 User: {crisis_message}")
    print(f"🤖 AI: {response['response']}")
    print(f"\n🚨 Crisis detected: {response['emotion_detected']['crisis_detected']}")
    print(f"⚠️  Needs escalation: {response['emotion_detected']['needs_escalation']}")

def test_health_check():
    """Test 4: Service health"""
    print("\n" + "="*60)
    print("TEST 4: Health Check")
    print("="*60)
    
    health = ai_service.health_check()
    
    print(f"\n🏥 Service Status: {health['status']}")
    print(f"🤖 Model: {health['model_id']}")
    print(f"🌍 Region: {health['region']}")

if __name__ == "__main__":
    print("\n🧪 AI SERVICE TESTS")
    print("="*60)
    
    test_simple_message()
    test_with_context()
    test_crisis_detection()
    test_health_check()
    
    print("\n✅ All tests completed!")
