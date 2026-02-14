"""
Emotion Service - ML-powered emotion detection + smart suggestions
Replaces keyword-based detection with RoBERTa + GoEmotions model fusion
"""
import logging
from dataclasses import dataclass, field
from typing import Optional, Dict, List

logger = logging.getLogger(__name__)

# Lazy imports to avoid slow startup
_text_processor = None
_stress_calculator = None


def _get_text_processor():
    global _text_processor
    if _text_processor is None:
        from agents.emotion_detection.text_processing import process_user_text
        _text_processor = process_user_text
    return _text_processor


def _get_stress_calculator():
    global _stress_calculator
    if _stress_calculator is None:
        from agents.emotion_detection.model_fusion import get_stress_calculator
        _stress_calculator = get_stress_calculator()
    return _stress_calculator


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class Suggestion:
    type: str           # breathing, game, affirmation, crisis, celebrate, tip
    title: str
    description: str
    data: Dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "type": self.type,
            "title": self.title,
            "description": self.description,
            "data": self.data
        }


@dataclass
class EmotionResult:
    primary_emotion: str = "neutral"
    stress_score: float = 0.0
    stress_level: str = "low"          # low, moderate, high, severe
    sentiment: str = "neutral"         # positive, neutral, negative
    crisis_detected: bool = False
    needs_escalation: bool = False
    suggestion: Optional[Suggestion] = None
    details: Dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "primary_emotion": self.primary_emotion,
            "stress_score": round(self.stress_score, 3),
            "stress_level": self.stress_level,
            "sentiment": self.sentiment,
            "crisis_detected": self.crisis_detected,
            "needs_escalation": self.needs_escalation,
            "suggestion": self.suggestion.to_dict() if self.suggestion else None,
            "details": self.details
        }


# ============================================================================
# Crisis Detection
# ============================================================================

CRISIS_KEYWORDS = [
    'suicide', 'suicidal', 'kill myself', 'end it all',
    'no point in living', 'no point living', 'hurt myself',
    'self harm', 'self-harm', 'want to die', 'better off dead',
    'no reason to live', 'ending it', 'give up on life',
    'not worth living', "don't want to live", 'dont want to live',
    'marna chahta', 'marna chahti', 'jaan de du', 'zindagi khatam',
]

CRISIS_HELPLINES = {
    "india": {"name": "iCall", "number": "9152987821"},
    "india_vandrevala": {"name": "Vandrevala Foundation", "number": "1860-2662-345"},
    "india_aasra": {"name": "AASRA", "number": "9820466726"},
}


def _check_crisis(text: str) -> bool:
    text_lower = text.lower()
    return any(kw in text_lower for kw in CRISIS_KEYWORDS)


# ============================================================================
# Rule-Based Emotion Detection (Fast, no ML)
# ============================================================================

def _detect_emotion_from_text(features) -> str:
    """Multi-layer emotion detection using text features. No ML needed."""
    normalized = features.normalized_text.lower()
    raw = features.raw_text.lower()
    emoji_emotion = features.dominant_emoji_emotion
    stress_level = features.stress_level
    intensity = features.emotional_intensity

    # Priority 1: High stress/urgency
    if stress_level == "high" or features.urgency_level == "urgent":
        return "anxious" if emoji_emotion in ['anxious', 'fearful', 'overwhelmed'] else "stressed"

    # Priority 2: Strong emoji signal
    if features.emoji_count >= 2:
        emoji_map = {
            'happy': 'happy', 'love': 'happy', 'excited': 'excited',
            'positive': 'happy', 'motivated': 'happy',
            'sad': 'sad', 'very_sad': 'sad', 'heartbroken': 'sad',
            'anxious': 'stressed', 'stressed': 'stressed', 'frustrated': 'stressed',
            'overwhelmed': 'stressed', 'tired': 'stressed',
            'angry': 'angry', 'very_angry': 'angry', 'bored': 'bored'
        }
        if emoji_emotion in emoji_map:
            return emoji_map[emoji_emotion]

    # Priority 3: Keyword-based (English + Hindi/Hinglish)
    keyword_map = [
        (["anxious", "anxiety", "panic", "worried", "fear", "scared",
          "nervous", "dar", "darr", "ghabra", "chinta"], "anxious"),
        (["angry", "mad", "furious", "hate", "gussa", "irritated",
          "annoyed", "pissed", "frustrated"], "angry"),
        (["happy", "good", "great", "awesome", "khush", "maza", "accha",
          "badiya", "mast", "wonderful", "blessed", "grateful", "superb"], "happy"),
        (["excited", "amazing", "wow", "fantastic", "waah", "zabardast",
          "can't wait", "hyped", "thrilled", "pumped"], "excited"),
        (["sad", "down", "upset", "cry", "udaas", "dukhi", "rona",
          "low", "alone", "akela", "depressed", "unhappy", "hurt",
          "lonely", "heartbroken", "missing"], "sad"),
        (["stress", "tired", "exhaust", "thak", "tension", "pressure",
          "overwhelm", "nahi ho raha", "workload", "burnout", "drain",
          "mushkil", "struggling"], "stressed"),
        (["bored", "boring", "bore", "nothing to do", "bore ho",
          "timepass", "dull", "monotonous"], "bored"),
        (["don't know", "not sure", "pata nahi", "kuch nahi",
          "confused", "idk", "uncertain", "samajh nahi", "kya karu"], "uncertain"),
    ]

    for keywords, emotion in keyword_map:
        if any(kw in normalized or kw in raw for kw in keywords):
            # Check for negation
            if features.has_negation:
                 # Negated positive emotion -> neutral/sad
                if emotion in ["happy", "excited"]:
                    return "sad" if "not" in normalized or "n't" in normalized else "neutral"
                
                # Negated negative emotion -> neutral/happy? (e.g. "not sad")
                # For safety, treat "not sad" as neutral, not necessarily happy
                if emotion in ["sad", "anxious", "stressed", "angry"]:
                    return "neutral"

            # Boost happy→excited if high intensity
            if emotion == "happy" and (intensity > 0.5 or features.exclamation_count > 0):
                return "excited"
            return emotion

    # Priority 4: Fallback to emoji
    if features.emoji_count > 0 and emoji_emotion != "neutral":
        fallback_map = {
            'happy': 'happy', 'love': 'happy', 'sad': 'sad',
            'stressed': 'stressed', 'anxious': 'anxious', 'bored': 'bored',
        }
        return fallback_map.get(emoji_emotion, "neutral")

    return "neutral"


# ============================================================================
# Smart Suggestion Engine
# ============================================================================

def _generate_suggestion(emotion: str, stress_level: str, crisis: bool) -> Optional[Suggestion]:
    if crisis:
        return Suggestion(
            type="crisis",
            title="🚨 We're here for you",
            description="Please reach out to a professional. You are not alone.",
            data={"helplines": CRISIS_HELPLINES}
        )

    if stress_level == "severe":
        return Suggestion(
            type="breathing",
            title="🌬️ Let's breathe together",
            description="A quick breathing exercise can help calm your mind.",
            data={"cycles": 3, "inhale_sec": 4, "hold_sec": 4, "exhale_sec": 6}
        )

    if stress_level == "high":
        return Suggestion(
            type="activity",
            title="🧘 Take a moment",
            description="Try a short breathing exercise or step away for a walk.",
            data={"options": ["breathing", "walk", "stretch", "water"]}
        )

    if emotion == "sad":
        return Suggestion(
            type="affirmation",
            title="💛 Reminder for you",
            description="You are stronger than you think. It's okay to feel this way.",
            data={"type": "gratitude_prompt"}
        )

    if emotion == "bored":
        return Suggestion(
            type="game",
            title="🎮 Let's play!",
            description="How about a quick game to lighten the mood?",
            data={"game_options": ["riddle", "trivia", "would_you_rather"]}
        )

    if emotion == "anxious":
        return Suggestion(
            type="breathing",
            title="🌬️ Calm your mind",
            description="Let's try a breathing exercise together.",
            data={"cycles": 3, "inhale_sec": 4, "hold_sec": 7, "exhale_sec": 8}
        )

    if emotion in ("happy", "excited"):
        return Suggestion(
            type="celebrate",
            title="🎉 That's amazing!",
            description="Keep riding this wave of positivity!",
            data={}
        )

    return None


# ============================================================================
# Main Emotion Service
# ============================================================================

class EmotionService:
    """
    ML-powered emotion analysis with smart suggestions.

    Pipeline:
    1. Crisis keyword check (fast, no ML)
    2. Text feature extraction (emoji, emphasis, Hinglish)
    3. Rule-based emotion detection from features
    4. ML model fusion (RoBERTa + GoEmotions) for stress scoring
    5. Smart suggestion generation
    """

    def analyze(self, text: str, use_ml: bool = True) -> EmotionResult:
        """
        Analyze emotion from text.

        Args:
            text: User message
            use_ml: Whether to use ML models (False = faster, rule-based only)

        Returns:
            EmotionResult with emotion, stress score, and suggestion
        """
        # Step 1: Crisis check (always first, always fast)
        crisis = _check_crisis(text)

        # Step 2: Text feature extraction
        process_text = _get_text_processor()
        features = process_text(text)

        # Step 3: Rule-based emotion from features
        emotion = _detect_emotion_from_text(features)

        # Step 4: ML stress scoring (optional)
        stress_score = 0.0
        stress_level = "low"
        sentiment = "neutral"
        details = {}

        if use_ml:
            try:
                calculator = _get_stress_calculator()
                ml_result = calculator.calculate_stress(text)
                stress_score = ml_result.stress_score
                stress_level = ml_result.stress_level
                sentiment = ml_result.sentiment.label
                details = {
                    "ml_sentiment": ml_result.sentiment.to_dict(),
                    "ml_emotions": ml_result.emotions.to_dict(),
                    "sentiment_contribution": round(ml_result.sentiment_contribution, 3),
                    "emotion_contribution": round(ml_result.emotion_contribution, 3),
                    "stress_emotions": ml_result.stress_emotions_detected,
                    "calming_emotions": ml_result.calming_emotions_detected,
                }
                logger.info(f"🧠 ML analysis: {emotion} | stress={stress_score:.0%} | {stress_level}")
            except Exception as e:
                logger.warning(f"⚠️ ML analysis failed, using rule-based: {e}")
                stress_level = features.stress_level if hasattr(features, 'stress_level') else "low"
        else:
            stress_level = getattr(features, 'stress_level', 'low')

        # Override emotion if crisis
        if crisis:
            emotion = "crisis"
            stress_level = "severe"
            stress_score = 1.0

        # Step 5: Escalation check
        needs_escalation = crisis or stress_level == "severe" or (
            stress_level == "high" and emotion in ("sad", "anxious")
        )

        # Step 6: Smart suggestion
        suggestion = _generate_suggestion(emotion, stress_level, crisis)

        return EmotionResult(
            primary_emotion=emotion,
            stress_score=stress_score,
            stress_level=stress_level,
            sentiment=sentiment,
            crisis_detected=crisis,
            needs_escalation=needs_escalation,
            suggestion=suggestion,
            details=details
        )


# Global singleton
emotion_service = EmotionService()
