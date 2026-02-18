
import sys
import os

# Add src to path so we can import agents
sys.path.append(os.path.join(os.getcwd(), "src"))

from agents.emotion_detection import emotion_service

def test_emotion_service():
    print("🚀 Testing Emotion Service Integration...\n")
    
    test_cases = [
        "I'm feeling really stressed about work lately.",
        "I don't know if I can go on anymore, I want to end it.",
        "I'm so happy with my progress!",
        "I'm just bored and looking for something to do.",
        "Feeling a bit anxious about the meeting."
    ]
    
    for text in test_cases:
        print(f"📝 Text: '{text}'")
        
        # Test 1: Rule-based (Fast)
        result_fast = emotion_service.analyze(text, use_ml=False)
        print(f"   ⚡ Rule-based: {result_fast.primary_emotion} (Crisis: {result_fast.crisis_detected})")
        
        # Test 2: ML-based (Full) - Mocking ML if models not present
        try:
            result_ml = emotion_service.analyze(text, use_ml=True)
            print(f"   🧠 ML-based:   {result_ml.primary_emotion} | Stress: {result_ml.stress_score:.0%}")
            if result_ml.suggestion:
                print(f"   💡 Suggestion: {result_ml.suggestion.type} - {result_ml.suggestion.title}")
        except Exception as e:
            print(f"   ⚠️ ML failed (expected if models not downloaded): {e}")
            
        print("-" * 50)

if __name__ == "__main__":
    test_emotion_service()
