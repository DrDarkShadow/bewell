import os
import httpx
from langchain_core.tools import tool
from .text_processing import process_user_text, get_text_emotional_context, TextFeatures

MODEL_SERVER_URL = os.environ.get("MODEL_SERVER_URL", "http://localhost:6000")


def _call_analyze_stress(text: str) -> dict:
    """Call the model server for stress analysis. Falls back to rule-based on error."""
    try:
        response = httpx.post(
            f"{MODEL_SERVER_URL}/analyze-stress",
            json={"text": text},
            timeout=30.0
        )
        response.raise_for_status()
        return response.json()
    except Exception as exc:
        raise RuntimeError(f"Model server unavailable: {exc}")


def _detect_emotion_from_features(features: TextFeatures) -> str:
    """
    Enhanced emotion detection using text processing features.
    Returns: happy, sad, stressed, excited, neutral, bored, uncertain, anxious, angry
    """
    normalized_text = features.normalized_text.lower()
    raw_text = features.raw_text.lower()
    
    # Get emotional context from text processing
    emoji_emotion = features.dominant_emoji_emotion
    stress_level = features.stress_level
    intensity = features.emotional_intensity
    
    # Priority 1: Check for high stress/urgency (crisis detection)
    if stress_level == "high" or features.urgency_level == "urgent":
        if emoji_emotion in ['anxious', 'fearful', 'overwhelmed']:
            return "anxious"
        return "stressed"
    
    # Priority 2: Emoji-based emotion (if strong emoji signal)
    if features.emoji_count >= 2:
        if emoji_emotion in ['happy', 'love', 'excited', 'positive', 'motivated']:
            return "happy" if emoji_emotion != 'excited' else "excited"
        elif emoji_emotion in ['sad', 'very_sad', 'heartbroken']:
            return "sad"
        elif emoji_emotion in ['anxious', 'stressed', 'frustrated', 'overwhelmed']:
            return "stressed"
        elif emoji_emotion in ['angry', 'very_angry']:
            return "angry"
        elif emoji_emotion == 'tired':
            return "stressed"
        elif emoji_emotion == 'bored':
            return "bored"
    
    # Priority 3: Text-based detection with enhanced patterns
    
    # Uncertain/Confused indicators
    uncertain_words = ["don't know", "dont know", "not sure", "pata nahi", "kuch nahi", 
                       "no idea", "confused", "idk", "dunno", "uncertain", "clueless",
                       "samajh nahi", "kya karu", "what should i"]
    if any(word in normalized_text or word in raw_text for word in uncertain_words):
        return "uncertain"
    
    # Anxious indicators (more specific than stressed)
    anxious_words = ["anxious", "anxiety", "panic", "worried", "fear", "scared", 
                     "nervous", "dar", "darr", "ghabra", "chinta"]
    if any(word in normalized_text for word in anxious_words):
        return "anxious"
    
    # Angry indicators
    angry_words = ["angry", "mad", "furious", "hate", "gussa", "irritated", 
                   "annoyed", "pissed", "frustrated"]
    if any(word in normalized_text for word in angry_words):
        # Check if it's expressed with high intensity
        if intensity > 0.4 or features.exclamation_count > 1:
            return "angry"
        return "stressed"
    
    # Happy (English + Hindi/Hinglish)
    happy_words = ["happy", "good", "great", "awesome", "khush", "maza", "accha", 
                   "badiya", "mast", "yay", "wonderful", "blessed", "grateful",
                   "shukar", "lovely", "fantastic", "superb"]
    if any(word in normalized_text for word in happy_words):
        # Extra happy if expressed with emphasis
        if intensity > 0.5 or features.exclamation_count > 0:
            return "excited"
        return "happy"
    
    # Sad indicators
    sad_words = ["sad", "down", "upset", "cry", "udaas", "dukhi", "rona", "bura", 
                 "low", "alone", "akela", "depressed", "unhappy", "hurt", "pain",
                 "dard", "tanha", "lonely", "heartbroken", "miss you", "missing"]
    if any(word in normalized_text for word in sad_words):
        return "sad"
    
    # Stressed/Tired indicators
    stressed_words = ["stress", "tired", "exhaust", "thak", "thakan", "tension", 
                      "pressure", "overwhelm", "nahi ho raha", "bahut kaam", 
                      "workload", "thakavat", "difficult", "struggling", "hard time",
                      "mushkil", "burnout", "drain"]
    if any(word in normalized_text for word in stressed_words):
        return "stressed"
    
    # Bored indicators
    bored_words = ["bored", "boring", "bore", "nothing to do", "bore ho", 
                   "timepass", "dull", "monotonous", "same thing"]
    if any(word in normalized_text for word in bored_words):
        return "bored"
    
    # Excited indicators
    excited_words = ["excited", "amazing", "wow", "fantastic", "waah", "zabardast",
                     "can't wait", "hyped", "thrilled", "pumped"]
    if any(word in normalized_text for word in excited_words):
        return "excited"
    
    # Priority 4: Fallback to emoji emotion if present
    if features.emoji_count > 0 and emoji_emotion != "neutral":
        emotion_map = {
            'happy': 'happy', 'love': 'happy', 'positive': 'happy',
            'excited': 'excited', 'motivated': 'happy',
            'sad': 'sad', 'very_sad': 'sad', 'heartbroken': 'sad',
            'stressed': 'stressed', 'anxious': 'anxious', 'tired': 'stressed',
            'frustrated': 'stressed', 'overwhelmed': 'stressed',
            'bored': 'bored', 'thinking': 'uncertain', 'confused': 'uncertain',
            'angry': 'stressed', 'very_angry': 'stressed'
        }
        return emotion_map.get(emoji_emotion, "neutral")
    
    return "neutral"


@tool
def detect_emotion(text: str) -> str:
    """
    Detect emotion from user message using advanced text processing.
    Analyzes emojis, emphasis, linguistic stress features, and word patterns.
    Return one word: happy, sad, stressed, excited, neutral, bored, uncertain, anxious, angry
    """
    # Process text with full text processing pipeline
    features = process_user_text(text)
    
    # Detect emotion using enhanced features
    emotion = _detect_emotion_from_features(features)
    
    return emotion


@tool
def analyze_text_features(text: str) -> str:
    """
    Analyze text and return detailed emotional features.
    Use this for deeper understanding of user's emotional state.
    Returns: emotional context including stress level, intensity, and linguistic features.
    """
    features = process_user_text(text)
    context = get_text_emotional_context(features)
    
    analysis = f"""
📊 Text Analysis Results:
• Detected Emotion (from emoji): {context['emoji_emotion']}
• Stress Level: {context['stress_level']}
• Urgency: {context['urgency']}
• Emotional Intensity: {context['intensity']:.0%}
• Has Emphasis (caps/repeated chars): {context['has_emphasis']}
• Emphasis Words: {', '.join(context['emphasis_words']) if context['emphasis_words'] else 'None'}
• Language Detected: {context['language']}
• Contains Negation: {context['is_negative']}
• Is Question: {context['is_question']}
• Emojis Found: {' '.join(features.emojis) if features.emojis else 'None'}
"""
    return analysis.strip()


@tool
def analyze_stress_deep(text: str) -> str:
    """
    Perform deep stress analysis using AI models (RoBERTa sentiment + GoEmotions).
    Fuses features from two pre-trained models to calculate comprehensive stress score.
    Use this for accurate stress level assessment when user seems distressed.
    Returns: detailed stress analysis with score, emotions, and recommendations.
    """
    try:
        result = _call_analyze_stress(text)
        sentiment = result.get("sentiment", {})
        emotions = result.get("emotions", {})
        top_emotions = emotions.get("top_emotions", [])
        top_emotions_str = ', '.join([
            f"{e} ({s:.0%})" for e, s in top_emotions[:3]
        ]) if top_emotions else "None"

        analysis = f"""
🔬 **Deep Stress Analysis (AI-Powered)**

📊 **Stress Score:** {result.get('stress_score', 0):.1%}
📈 **Stress Level:** {result.get('stress_level', 'unknown').upper()}

💭 **Sentiment Analysis (Twitter-RoBERTa):**
   • Overall: {sentiment.get('label', 'neutral').capitalize()} ({sentiment.get('score', 0):.1%})
   • Negative: {sentiment.get('all_scores', {}).get('negative', 0):.1%}
   • Neutral: {sentiment.get('all_scores', {}).get('neutral', 0):.1%}
   • Positive: {sentiment.get('all_scores', {}).get('positive', 0):.1%}

🎭 **Emotion Detection (GoEmotions):**
   • Primary: {emotions.get('primary_emotion', 'neutral')} ({emotions.get('primary_score', 0):.1%})
   • Top Emotions: {top_emotions_str}

⚖️ **Feature Fusion:**
   • Sentiment Contribution: {result.get('sentiment_contribution', 0):.1%}
   • Emotion Contribution: {result.get('emotion_contribution', 0):.1%}

⚠️ **Stress Indicators:** {', '.join(result.get('stress_emotions_detected', [])) or 'None detected'}
💚 **Calming Signals:** {', '.join(result.get('calming_emotions_detected', [])) or 'None detected'}

💡 **Recommendation:**
{result.get('recommendation', '')}
"""
        return analysis.strip()

    except Exception as e:
        return f"⚠️ Could not perform deep stress analysis: {str(e)}. Using basic emotion detection instead."


@tool
def get_stress_score(text: str) -> str:
    """
    Get quick stress score using AI models.
    Returns stress score (0-100%) and level (low/moderate/high/severe).
    """
    try:
        result = _call_analyze_stress(text)
        sentiment = result.get("sentiment", {})
        emotions = result.get("emotions", {})
        return (
            f"Stress Score: {result.get('stress_score', 0):.0%} | "
            f"Level: {result.get('stress_level', 'unknown')} | "
            f"Sentiment: {sentiment.get('label', 'neutral')} | "
            f"Primary Emotion: {emotions.get('primary_emotion', 'neutral')}"
        )
    except Exception as e:
        # Fallback to rule-based
        features = process_user_text(text)
        return f"Stress Level: {features.stress_level} | Intensity: {features.emotional_intensity:.0%} (rule-based fallback)"


@tool
def get_emotional_history() -> str:
    """
    Get user's emotional history summary.
    Use this when user asks about their mood patterns or emotional state.
    """
    return "I'm here to chat with you! How are you feeling right now? Tell me what's on your mind. 💛"
