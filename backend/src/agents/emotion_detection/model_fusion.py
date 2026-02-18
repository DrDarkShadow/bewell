"""
Model Fusion Module for Stress Score Calculation
Uses two pre-trained models:
1. cardiffnlp/twitter-roberta-base-sentiment-latest - Sentiment Analysis
2. SamLowe/roberta-base-go_emotions - Multi-label Emotion Detection

Fuses features from both models to calculate comprehensive stress score.
"""

from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass, field
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)


# Model identifiers
SENTIMENT_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest"
EMOTION_MODEL = "SamLowe/roberta-base-go_emotions"

# GoEmotions- 28 emotions
GO_EMOTIONS_LABELS = [
    'admiration', 'amusement', 'anger', 'annoyance', 'approval', 'caring',
    'confusion', 'curiosity', 'desire', 'disappointment', 'disapproval',
    'disgust', 'embarrassment', 'excitement', 'fear', 'gratitude', 'grief',
    'joy', 'love', 'nervousness', 'optimism', 'pride', 'realization',
    'relief', 'remorse', 'sadness', 'surprise', 'neutral'
]

# Stress-related emotions from GoEmotions with weights)
STRESS_POSITIVE_EMOTIONS = {
    'anger': 0.8,
    'annoyance': 0.6,
    'confusion': 0.4,
    'disappointment': 0.7,
    'disapproval': 0.5,
    'disgust': 0.6,
    'embarrassment': 0.5,
    'fear': 0.9,
    'grief': 0.9,
    'nervousness': 0.85,
    'remorse': 0.6,
    'sadness': 0.8,
}

# Stress-reducing emotions
STRESS_NEGATIVE_EMOTIONS = {
    'admiration': 0.3,
    'amusement': 0.4,
    'approval': 0.3,
    'caring': 0.3,
    'excitement': 0.4,
    'gratitude': 0.5,
    'joy': 0.6,
    'love': 0.5,
    'optimism': 0.5,
    'pride': 0.4,
    'relief': 0.6,
}



@dataclass
class SentimentResult:
    """Results from sentiment analysis model"""
    label: str = "neutral"  # negative, neutral, positive
    score: float = 0.0
    all_scores: Dict[str, float] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "label": self.label,
            "score": self.score,
            "all_scores": self.all_scores
        }


@dataclass
class EmotionResult:
    """Results from emotion detection model"""
    primary_emotion: str = "neutral"
    primary_score: float = 0.0
    all_emotions: Dict[str, float] = field(default_factory=dict)
    top_emotions: List[Tuple[str, float]] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "primary_emotion": self.primary_emotion,
            "primary_score": self.primary_score,
            "all_emotions": self.all_emotions,
            "top_emotions": self.top_emotions
        }


@dataclass
class FusedStressResult:
    """Combined stress analysis result"""
    stress_score: float = 0.0  # 0.0 to 1.0
    stress_level: str = "low"  # low, moderate, high, severe
    sentiment: SentimentResult = field(default_factory=SentimentResult)
    emotions: EmotionResult = field(default_factory=EmotionResult)
    
    # Feature contributions
    sentiment_contribution: float = 0.0
    emotion_contribution: float = 0.0
    stress_emotions_detected: List[str] = field(default_factory=list)
    calming_emotions_detected: List[str] = field(default_factory=list)
    
    # Recommendations based on stress level
    recommendation: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "stress_score": self.stress_score,
            "stress_level": self.stress_level,
            "sentiment": self.sentiment.to_dict(),
            "emotions": self.emotions.to_dict(),
            "sentiment_contribution": self.sentiment_contribution,
            "emotion_contribution": self.emotion_contribution,
            "stress_emotions_detected": self.stress_emotions_detected,
            "calming_emotions_detected": self.calming_emotions_detected,
            "recommendation": self.recommendation
        }

 
class ModelManager:
    """Manages loading and caching of pre-trained models"""
    
    _instance = None
    _sentiment_pipeline = None
    _emotion_pipeline = None
    _device = None
    _initialized = False
    _torch = None
    _pipeline = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not ModelManager._initialized:
            # import torch
            import torch
            ModelManager._torch = torch
            self._device = "cuda" if torch.cuda.is_available() else "cpu"
            print(f"🔧 Model Fusion: Using device: {self._device}")
            ModelManager._initialized = True
    
    @property
    def device(self) -> str:
        return self._device
    
    def load_sentiment_model(self):
        """Load the Twitter RoBERTa sentiment model using pipeline"""
        if self._sentiment_pipeline is None:
            #  import
            from transformers import pipeline
            ModelManager._pipeline = pipeline
            
            print(f"📥 Loading sentiment model: {SENTIMENT_MODEL}")
            self._sentiment_pipeline = pipeline(
                "sentiment-analysis",
                model=SENTIMENT_MODEL,
                tokenizer=SENTIMENT_MODEL,
                top_k=None,
                device=0 if self._device == "cuda" else -1,
                framework="pt"  # Force PyTorch
            )
            print("✅ Sentiment model loaded!")
        return self._sentiment_pipeline
    
    def load_emotion_model(self):
        """Load the GoEmotions model as a pipeline"""
        if self._emotion_pipeline is None:
            # import
            from transformers import pipeline
            ModelManager._pipeline = pipeline
            
            print(f"📥 Loading emotion model: {EMOTION_MODEL}")
            self._emotion_pipeline = pipeline(
                "text-classification",
                model=EMOTION_MODEL,
                tokenizer=EMOTION_MODEL,
                top_k=None,  # Return all labels
                device=0 if self._device == "cuda" else -1,
                framework="pt"  # Force PyTorch
            )
            print("✅ Emotion model loaded!")
        return self._emotion_pipeline
    
    def load_all_models(self):
        """Load all models at once"""
        self.load_sentiment_model()
        self.load_emotion_model()
        return self


class SentimentAnalyzer:
    """Analyzes sentiment using Twitter RoBERTa model"""
    
    def __init__(self, model_manager: ModelManager):
        self.model_manager = model_manager
        self._pipeline = None
    
    def _ensure_loaded(self):
        if self._pipeline is None:
            self._pipeline = self.model_manager.load_sentiment_model()
    
    def analyze(self, text: str) -> SentimentResult:
        """
        Analyze sentiment of text.
        
        Returns:
            SentimentResult with label, score, and all scores
        """
        self._ensure_loaded()
        
        result = SentimentResult()
        
        try:
            # Get predictions using pipeline
            outputs = self._pipeline(text[:512])  
            
            if outputs and len(outputs) > 0:
                # Handle output from pipeline
                all_scores = {}
                for item in outputs[0] if isinstance(outputs[0], list) else outputs:
                    label = item['label'].lower()
                    score = item['score']
                    all_scores[label] = score
                
                # Find primary sentiment
                max_label = max(all_scores, key=all_scores.get)
                result.label = max_label
                result.score = all_scores[max_label]
                result.all_scores = all_scores
            
        except Exception as e:
            print(f"⚠️ Sentiment analysis error: {e}")
            result.label = "neutral"
            result.score = 1.0
            result.all_scores = {"negative": 0.0, "neutral": 1.0, "positive": 0.0}
        
        return result


class EmotionAnalyzer:
    """Analyzes emotions using GoEmotions model"""
    
    def __init__(self, model_manager: ModelManager):
        self.model_manager = model_manager
        self._pipeline = None
    
    def _ensure_loaded(self):
        if self._pipeline is None:
            self._pipeline = self.model_manager.load_emotion_model()
    
    def analyze(self, text: str, threshold: float = 0.1) -> EmotionResult:
        """
        Analyze emotions in text.
        
        Args:
            text: Input text
            threshold: Minimum score to include emotion
        
        Returns:
            EmotionResult with detected emotions
        """
        self._ensure_loaded()
        
        result = EmotionResult()
        
        try:
            # Get predictions
            outputs = self._pipeline(text[:512])  
            
            if outputs and len(outputs) > 0:
                # Handle list from pipeline
                emotions_list = outputs[0] if isinstance(outputs[0], list) else outputs
                
                # Build emotion dictionary
                all_emotions = {}
                for item in emotions_list:
                    label = item['label']
                    score = item['score']
                    all_emotions[label] = score
                
                result.all_emotions = all_emotions
                
                # Get top emotions above threshold
                top_emotions = [
                    (label, score) 
                    for label, score in sorted(all_emotions.items(), key=lambda x: -x[1])
                    if score >= threshold
                ][:5]  # Top 5
                
                result.top_emotions = top_emotions
                
                if top_emotions:
                    result.primary_emotion = top_emotions[0][0]
                    result.primary_score = top_emotions[0][1]
                
        except Exception as e:
            print(f"⚠️ Emotion analysis error: {e}")
            result.primary_emotion = "neutral"
            result.primary_score = 1.0
            result.all_emotions = {"neutral": 1.0}
        
        return result

#Stress calculator

class StressScoreCalculator:
    """
    Fuses features from sentiment and emotion models to calculate stress score.
    
    Fusion Strategy:
    1. Sentiment-based stress (negative sentiment increases stress)
    2. Emotion-based stress (weighted sum of stress-related emotions)
    3. Calming emotion reduction (positive emotions reduce stress)
    4. Weighted combination of both signals
    """
    
    # Fusion weights
    SENTIMENT_WEIGHT = 0.35
    EMOTION_WEIGHT = 0.65
    
    def __init__(self):
        self.model_manager = ModelManager()
        self.sentiment_analyzer = SentimentAnalyzer(self.model_manager)
        self.emotion_analyzer = EmotionAnalyzer(self.model_manager)
    
    def initialize(self):
        """Pre-load all models"""
        print("🚀 Initializing Model Fusion System...")
        self.model_manager.load_all_models()
        print("✅ All models loaded and ready!")
        return self
    
    def calculate_sentiment_stress(self, sentiment: SentimentResult) -> float:
        """
        Calculate stress contribution from sentiment.
        
        Negative sentiment = high stress
        Neutral sentiment = moderate stress  
        Positive sentiment = low stress
        """
        negative_score = sentiment.all_scores.get("negative", 0.0)
        neutral_score = sentiment.all_scores.get("neutral", 0.0)
        positive_score = sentiment.all_scores.get("positive", 0.0)
        
        # Stress formula: negative contributes fully, neutral partially
        stress = negative_score + (neutral_score * 0.3) - (positive_score * 0.5)
        return max(0.0, min(1.0, stress))
    
    def calculate_emotion_stress(self, emotions: EmotionResult) -> Tuple[float, List[str], List[str]]:
        """
        Calculate stress contribution from emotions.
        
        Returns:
            Tuple of (stress_score, stress_emotions, calming_emotions)
        """
        stress_score = 0.0
        calming_score = 0.0
        stress_emotions = []
        calming_emotions = []
        
        for emotion, score in emotions.all_emotions.items():
            # Check if it's a stress-inducing emotion
            if emotion in STRESS_POSITIVE_EMOTIONS:
                weight = STRESS_POSITIVE_EMOTIONS[emotion]
                contribution = score * weight
                stress_score += contribution
                if score > 0.15:  # Meaningful detection
                    stress_emotions.append(emotion)
            
            # Check if it's a calming emotion
            if emotion in STRESS_NEGATIVE_EMOTIONS:
                weight = STRESS_NEGATIVE_EMOTIONS[emotion]
                contribution = score * weight
                calming_score += contribution
                if score > 0.15:
                    calming_emotions.append(emotion)
        
        # Net stress from emotions
        net_stress = stress_score - (calming_score * 0.5)
        
        # Normalize to 0-1 range
        normalized = max(0.0, min(1.0, net_stress))
        
        return normalized, stress_emotions, calming_emotions
    
    def get_stress_level(self, score: float) -> str:
        """Convert stress score to level"""
        if score < 0.25:
            return "low"
        elif score < 0.5:
            return "moderate"
        elif score < 0.75:
            return "high"
        else:
            return "severe"
    
    def get_recommendation(self, stress_level: str, emotions: List[str]) -> str:
        """Generate recommendation based on stress level"""
        recommendations = {
            "low": "You seem to be in a good mental state. Keep up the positive mindset! 🌟",
            "moderate": "I notice some stress signals. Would you like to try a breathing exercise or talk about what's on your mind? 💚",
            "high": "I can sense you're going through a tough time. I'm here for you. Let's try a calming exercise together, or feel free to share what's bothering you. 💛",
            "severe": "I'm concerned about your wellbeing. Please know that whatever you're feeling is valid, and support is available. Would you like to talk, or shall I guide you through a relaxation technique? 🤗"
        }
        
        base_recommendation = recommendations.get(stress_level, recommendations["moderate"])
        
        # Add emotion-specific suggestions
        if "nervousness" in emotions or "fear" in emotions:
            base_recommendation += "\n🧘 A breathing exercise might help calm your nerves."
        if "anger" in emotions or "annoyance" in emotions:
            base_recommendation += "\n🎮 Sometimes a quick game can help redirect energy."
        if "sadness" in emotions or "grief" in emotions:
            base_recommendation += "\n💭 Talking about your feelings can really help."
        
        return base_recommendation
    
    def calculate_stress(self, text: str) -> FusedStressResult:
        """
        Main method: Calculate comprehensive stress score by fusing both models.
        
        Args:
            text: User input text
        
        Returns:
            FusedStressResult with complete analysis
        """
        result = FusedStressResult()
        
        # Step 1: Analyze sentiment
        result.sentiment = self.sentiment_analyzer.analyze(text)
        
        # Step 2: Analyze emotions
        result.emotions = self.emotion_analyzer.analyze(text)
        
        # Step 3: Calculate sentiment-based stress
        result.sentiment_contribution = self.calculate_sentiment_stress(result.sentiment)
        
        # Step 4: Calculate emotion-based stress
        emotion_stress, stress_emotions, calming_emotions = self.calculate_emotion_stress(result.emotions)
        result.emotion_contribution = emotion_stress
        result.stress_emotions_detected = stress_emotions
        result.calming_emotions_detected = calming_emotions
        
        # Step 5: Fuse features (weighted combination)
        result.stress_score = (
            self.SENTIMENT_WEIGHT * result.sentiment_contribution +
            self.EMOTION_WEIGHT * result.emotion_contribution
        )
        
        # Ensure score is in valid range
        result.stress_score = max(0.0, min(1.0, result.stress_score))
        
        # Step 6: Determine stress level
        result.stress_level = self.get_stress_level(result.stress_score)
        
        # Step 7: Generate recommendation
        result.recommendation = self.get_recommendation(
            result.stress_level, 
            result.stress_emotions_detected
        )
        
        return result


# ============================================================================
# GLOBAL INSTANCE & CONVENIENCE FUNCTIONS
# ============================================================================

# Lazy-loaded global calculator
_calculator: Optional[StressScoreCalculator] = None


def get_stress_calculator() -> StressScoreCalculator:
    """Get or create the global stress calculator"""
    global _calculator
    if _calculator is None:
        _calculator = StressScoreCalculator()
    return _calculator


def initialize_models():
    """Pre-load all models (call at app startup)"""
    calculator = get_stress_calculator()
    calculator.initialize()
    return calculator


def calculate_stress_score(text: str) -> FusedStressResult:
    """
    Calculate stress score for given text.
    
    Args:
        text: User input
    
    Returns:
        FusedStressResult with complete analysis
    """
    calculator = get_stress_calculator()
    return calculator.calculate_stress(text)


def get_stress_summary(text: str) -> Dict[str, Any]:
    """
    Get a simplified stress summary.
    
    Returns:
        Dictionary with key stress metrics
    """
    result = calculate_stress_score(text)
    return {
        "stress_score": round(result.stress_score, 3),
        "stress_level": result.stress_level,
        "sentiment": result.sentiment.label,
        "primary_emotion": result.emotions.primary_emotion,
        "stress_emotions": result.stress_emotions_detected,
        "recommendation": result.recommendation
    }



