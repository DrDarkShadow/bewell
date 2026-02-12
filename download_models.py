"""
Script to download and cache the pre-trained models.
Run this once before starting the app.
"""

print("📦 Downloading and caching pre-trained models...")
print("This may take a few minutes on first run.\n")

# Download sentiment model
print("1️⃣ Downloading sentiment model (cardiffnlp/twitter-roberta-base-sentiment-latest)...")
from transformers import pipeline as transformers_pipeline

sentiment_pipeline = transformers_pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment-latest",
    device=-1  # CPU
)
print("   ✅ Sentiment model downloaded!\n")

# Download emotion model
print("2️⃣ Downloading emotion model (SamLowe/roberta-base-go_emotions)...")
emotion_pipeline = transformers_pipeline(
    "text-classification",
    model="SamLowe/roberta-base-go_emotions",
    top_k=None,
    device=-1  # CPU
)
print("   ✅ Emotion model downloaded!\n")

# Test both models
print("3️⃣ Testing models...")
test_text = "I am feeling stressed and worried"

sentiment_result = sentiment_pipeline(test_text)
print(f"   Sentiment: {sentiment_result}")

emotion_result = emotion_pipeline(test_text)
top_emotions = [(e['label'], round(e['score'], 2)) for e in emotion_result[0][:3]]
print(f"   Top emotions: {top_emotions}")

print("\n✅ All models downloaded and working!")
print("   Models are cached in ~/.cache/huggingface/")
print("   Future runs will use the cached models.")
