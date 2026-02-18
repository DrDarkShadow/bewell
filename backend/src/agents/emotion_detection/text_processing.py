"""
Text Processing Module for Companion Bot
Handles: Raw Input, Normalization, Emoji/Emphasis Extraction, Linguistic Stress Features
"""

import re
import unicodedata
from typing import Dict, List, Tuple, Any
from dataclasses import dataclass, field
from collections import Counter


# ============================================================================
# EMOJI MAPPINGS & PATTERNS
# ============================================================================

EMOJI_EMOTION_MAP = {
    # Happy/Positive
    '😊': 'happy', '😄': 'happy', '😃': 'happy', '🙂': 'happy', '😁': 'happy',
    '😀': 'happy', '🥰': 'happy', '😍': 'love', '❤️': 'love', '💕': 'love',
    '💖': 'love', '💗': 'love', '🥳': 'excited', '🎉': 'excited', '✨': 'excited',
    '👍': 'positive', '👏': 'positive', '🙌': 'positive', '💪': 'motivated',
    
    # Sad/Negative
    '😢': 'sad', '😭': 'very_sad', '😞': 'sad', '😔': 'sad', '🥺': 'sad',
    '😿': 'sad', '💔': 'heartbroken', '😥': 'sad', '😓': 'stressed',
    
    # Stressed/Anxious
    '😰': 'anxious', '😨': 'anxious', '😱': 'fearful', '😬': 'nervous',
    '🤯': 'overwhelmed', '😵': 'exhausted', '🥴': 'confused', '😫': 'frustrated',
    '😩': 'stressed', '😤': 'frustrated', '🤦': 'frustrated',
    
    # Tired/Exhausted
    '😴': 'tired', '🥱': 'tired', '😪': 'tired', '🛌': 'tired',
    
    # Bored
    '😐': 'neutral', '😑': 'bored', '🙄': 'bored', '😒': 'bored',
    
    # Confused/Uncertain
    '🤔': 'thinking', '❓': 'confused', '❔': 'confused', '🤷': 'uncertain',
    
    # Angry
    '😠': 'angry', '😡': 'angry', '🤬': 'very_angry', '👿': 'angry',
}

# Patterns for emphasis detection
CAPS_PATTERN = re.compile(r'\b[A-Z]{2,}\b')  # All caps words
REPEATED_CHAR_PATTERN = re.compile(r'(.)\1{2,}')  # Repeated characters (3+)
REPEATED_PUNCT_PATTERN = re.compile(r'([!?.])\1+')  # Repeated punctuation
EXCLAMATION_PATTERN = re.compile(r'!+')
QUESTION_PATTERN = re.compile(r'\?+')


# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class TextFeatures:
    """Stores extracted features from text"""
    raw_text: str = ""
    normalized_text: str = ""
    
    # Emoji features
    emojis: List[str] = field(default_factory=list)
    emoji_count: int = 0
    emoji_emotions: List[str] = field(default_factory=list)
    dominant_emoji_emotion: str = "neutral"
    
    # Emphasis features
    caps_words: List[str] = field(default_factory=list)
    repeated_chars: List[Tuple[str, str]] = field(default_factory=list)  # (original, char)
    exclamation_count: int = 0
    question_count: int = 0
    
    # Linguistic stress features
    stress_indicators: List[str] = field(default_factory=list)
    stress_level: str = "low"  # low, medium, high
    urgency_level: str = "normal"  # normal, elevated, urgent
    emotional_intensity: float = 0.0  # 0.0 to 1.0
    
    # Additional features
    word_count: int = 0
    sentence_count: int = 0
    avg_word_length: float = 0.0
    has_negation: bool = False
    language_hint: str = "english"  # english, hindi, hinglish, mixed
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "raw_text": self.raw_text,
            "normalized_text": self.normalized_text,
            "emojis": self.emojis,
            "emoji_count": self.emoji_count,
            "emoji_emotions": self.emoji_emotions,
            "dominant_emoji_emotion": self.dominant_emoji_emotion,
            "caps_words": self.caps_words,
            "repeated_chars": [(orig, char) for orig, char in self.repeated_chars],
            "exclamation_count": self.exclamation_count,
            "question_count": self.question_count,
            "stress_indicators": self.stress_indicators,
            "stress_level": self.stress_level,
            "urgency_level": self.urgency_level,
            "emotional_intensity": self.emotional_intensity,
            "word_count": self.word_count,
            "sentence_count": self.sentence_count,
            "avg_word_length": self.avg_word_length,
            "has_negation": self.has_negation,
            "language_hint": self.language_hint
        }


# ============================================================================
# RAW INPUT HANDLING
# ============================================================================

class RawInputHandler:
    """Handles raw user input - cleaning, validation, encoding fixes"""
    
    @staticmethod
    def handle_raw_input(text: str) -> str:
        """
        Process raw input while preserving important emotional markers.
        - Fixes encoding issues
        - Removes invisible characters
        - Preserves emojis and emphasis
        """
        if not text:
            return ""
        
        # Handle None or non-string inputs
        if not isinstance(text, str):
            text = str(text)
        
        # Fix common encoding issues
        text = RawInputHandler._fix_encoding(text)
        
        # Remove invisible/control characters but keep important ones
        text = RawInputHandler._remove_control_chars(text)
        
        # Normalize unicode (NFC form - composed characters)
        text = unicodedata.normalize('NFC', text)
        
        # Handle multiple spaces while preserving single spaces
        text = re.sub(r' +', ' ', text)
        
        # Strip leading/trailing whitespace
        text = text.strip()
        
        return text
    
    @staticmethod
    def _fix_encoding(text: str) -> str:
        """Fix common encoding issues"""
        # Common mojibake fixes
        replacements = {
            'â€™': "'",
            'â€œ': '"',
            'â€': '"',
            'â€"': '—',
            'â€"': '–',
            'Ã©': 'é',
            'Ã¨': 'è',
            'Ã ': 'à',
            '\ufeff': '',  # BOM
        }
        for old, new in replacements.items():
            text = text.replace(old, new)
        return text
    
    @staticmethod
    def _remove_control_chars(text: str) -> str:
        """Remove control characters while preserving necessary ones"""
        # Keep: newlines, tabs, and printable characters
        cleaned = []
        for char in text:
            if char in '\n\t\r':
                cleaned.append(char)
            elif unicodedata.category(char) != 'Cc':  # Not a control character
                cleaned.append(char)
            elif char == ' ':
                cleaned.append(char)
        return ''.join(cleaned)


# ============================================================================
# TEXT NORMALIZER
# ============================================================================

class TextNormalizer:
    """
    Careful normalization that preserves emotional context.
    Keeps emphasis markers while normalizing for analysis.
    """
    
    # Words to NOT normalize (preserve case for emphasis detection)
    PRESERVE_EMPHASIS = {'HELP', 'PLEASE', 'URGENT', 'NOW', 'STOP', 'NO', 'YES',
                         'NEED', 'WANT', 'LOVE', 'HATE', 'SAD', 'HAPPY', 'STRESSED',
                         'TIRED', 'SORRY', 'THANK', 'OK', 'OKAY'}
    
    @staticmethod
    def normalize(text: str, preserve_emphasis: bool = True) -> str:
        """
        Normalize text while optionally preserving emphasis markers.
        
        Args:
            text: Input text
            preserve_emphasis: If True, preserves caps words as markers
        
        Returns:
            Normalized text
        """
        if not text:
            return ""
        
        # Store emphasis markers before normalization
        emphasis_markers = {}
        if preserve_emphasis:
            for match in CAPS_PATTERN.finditer(text):
                word = match.group()
                placeholder = f"__CAPS_{len(emphasis_markers)}__"
                emphasis_markers[placeholder] = word
                text = text.replace(word, placeholder, 1)
        
        # Basic normalization
        normalized = text.lower()
        
        # Restore emphasis markers
        for placeholder, word in emphasis_markers.items():
            normalized = normalized.replace(placeholder.lower(), f"[EMPHASIS:{word}]")
        
        # Normalize repeated characters (but preserve info)
        # e.g., "sooooo" -> "so" but record the emphasis
        normalized = TextNormalizer._normalize_repeated_chars(normalized)
        
        # Normalize common text speak
        normalized = TextNormalizer._normalize_text_speak(normalized)
        
        # Normalize Hindi/Hinglish romanization variations
        normalized = TextNormalizer._normalize_hindi_variations(normalized)
        
        return normalized
    
    @staticmethod
    def _normalize_repeated_chars(text: str) -> str:
        """Reduce repeated characters to max 2"""
        return re.sub(r'(.)\1{2,}', r'\1\1', text)
    
    @staticmethod
    def _normalize_text_speak(text: str) -> str:
        """Normalize common text abbreviations"""
        text_speak_map = {
            r'\bu\b': 'you',
            r'\br\b': 'are',
            r'\bur\b': 'your',
            r'\bpls\b': 'please',
            r'\bplz\b': 'please',
            r'\bthx\b': 'thanks',
            r'\bthnx\b': 'thanks',
            r'\bthnks\b': 'thanks',
            r'\bty\b': 'thank you',
            r'\bk\b': 'okay',
            r'\bok\b': 'okay',
            r'\bidk\b': "i don't know",
            r'\bwth\b': 'what the heck',
            r'\bomg\b': 'oh my god',
            r'\brn\b': 'right now',
            r'\btbh\b': 'to be honest',
            r'\bimo\b': 'in my opinion',
            r'\bbtw\b': 'by the way',
            r'\bnvm\b': 'never mind',
            r'\bbrb\b': 'be right back',
            r'\bwbu\b': 'what about you',
            r'\bhbu\b': 'how about you',
        }
        for pattern, replacement in text_speak_map.items():
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        return text
    
    @staticmethod
    def _normalize_hindi_variations(text: str) -> str:
        """Normalize common Hindi/Hinglish spelling variations"""
        hindi_variations = {
            r'\bkya\b': 'kya',
            r'\bkyaa\b': 'kya',
            r'\bkyu\b': 'kyu',
            r'\bkyun\b': 'kyu',
            r'\bkyuu\b': 'kyu',
            r'\bhaan\b': 'haan',
            r'\bhaa\b': 'haan',
            r'\bhan\b': 'haan',
            r'\bnahi\b': 'nahi',
            r'\bnahii\b': 'nahi',
            r'\bnhi\b': 'nahi',
            r'\bachha\b': 'accha',
            r'\bachaa\b': 'accha',
            r'\btheek\b': 'thik',
            r'\bthik\b': 'thik',
            r'\bthikk\b': 'thik',
            r'\bpta\b': 'pata',
            r'\bptaa\b': 'pata',
        }
        for pattern, replacement in hindi_variations.items():
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        return text


# ============================================================================
# EMOJI & EMPHASIS EXTRACTOR
# ============================================================================

class EmojiEmphasisExtractor:
    """Extract emojis and emphasis markers from text"""
    
    # Emoji regex pattern (covers most common emoji ranges)
    EMOJI_PATTERN = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F700-\U0001F77F"  # alchemical symbols
        "\U0001F780-\U0001F7FF"  # geometric shapes
        "\U0001F800-\U0001F8FF"  # supplemental arrows
        "\U0001F900-\U0001F9FF"  # supplemental symbols
        "\U0001FA00-\U0001FA6F"  # chess symbols
        "\U0001FA70-\U0001FAFF"  # symbols and pictographs extended
        "\U00002702-\U000027B0"  # dingbats
        "\U0001F1E0-\U0001F1FF"  # flags
        "\U00002600-\U000026FF"  # misc symbols
        "\U00002700-\U000027BF"  # dingbats
        "\U0000FE00-\U0000FE0F"  # variation selectors
        "\U0001F000-\U0001F02F"  # mahjong tiles
        "\U0001F0A0-\U0001F0FF"  # playing cards
        "❤️💔💕💖💗💘💙💚💛💜🖤🤍🤎"  # hearts
        "]+",
        flags=re.UNICODE
    )
    
    @staticmethod
    def extract_emojis(text: str) -> Tuple[List[str], List[str]]:
        """
        Extract emojis and their associated emotions.
        
        Returns:
            Tuple of (list of emojis, list of emotions)
        """
        emojis = EmojiEmphasisExtractor.EMOJI_PATTERN.findall(text)
        # Flatten any multi-emoji matches
        all_emojis = []
        for match in emojis:
            all_emojis.extend(list(match))
        
        emotions = []
        for emoji in all_emojis:
            emotion = EMOJI_EMOTION_MAP.get(emoji, 'neutral')
            emotions.append(emotion)
        
        return all_emojis, emotions
    
    @staticmethod
    def get_dominant_emoji_emotion(emotions: List[str]) -> str:
        """Get the most frequent emotion from emoji list"""
        if not emotions:
            return "neutral"
        counter = Counter(emotions)
        return counter.most_common(1)[0][0]
    
    @staticmethod
    def extract_caps_emphasis(text: str) -> List[str]:
        """Extract words in ALL CAPS (emphasis)"""
        caps_words = CAPS_PATTERN.findall(text)
        # Filter out common abbreviations
        common_abbrevs = {'I', 'OK', 'TV', 'PC', 'ID', 'US', 'UK', 'AM', 'PM'}
        return [w for w in caps_words if w not in common_abbrevs]
    
    @staticmethod
    def extract_repeated_chars(text: str) -> List[Tuple[str, str]]:
        """
        Extract words with repeated characters.
        
        Returns:
            List of tuples (full_word, repeated_char)
        """
        results = []
        words = text.split()
        for word in words:
            match = REPEATED_CHAR_PATTERN.search(word)
            if match:
                results.append((word, match.group(1)))
        return results
    
    @staticmethod
    def count_punctuation(text: str) -> Tuple[int, int]:
        """Count exclamation and question marks"""
        exclamations = len(re.findall(r'!', text))
        questions = len(re.findall(r'\?', text))
        return exclamations, questions


# ============================================================================
# LINGUISTIC STRESS FEATURE EXTRACTOR
# ============================================================================

class LinguisticStressExtractor:
    """Extract linguistic stress and urgency features from text"""
    
    # Stress indicator words (English + Hindi/Hinglish)
    STRESS_WORDS = {
        'high': [
            'help', 'urgent', 'emergency', 'desperate', "can't take", 'cant take',
            'breaking', 'dying', 'horrible', 'terrible', 'worst', 'panic',
            'madad', 'bachao', 'please help', 'kya karu', 'kya karun',
            'suffer', 'suffering', 'unbearable', 'nahi ho raha', 'mar jaunga',
            'overwhelmed', 'breaking down', 'falling apart'
        ],
        'medium': [
            'stressed', 'anxious', 'worried', 'tension', 'pressure', 'difficult',
            'hard', 'tough', 'struggling', 'problem', 'issue', 'trouble',
            'pareshan', 'mushkil', 'dikkat', 'taklif', 'worried', 'chinta',
            'frustrated', 'upset', 'annoyed', 'irritated', 'restless', 'uneasy'
        ],
        'low': [
            'bit', 'little', 'slightly', 'somewhat', 'kinda', 'kind of',
            'thoda', 'thodi', 'halka', 'maybe', 'might be'
        ]
    }
    
    # Urgency indicators
    URGENCY_WORDS = {
        'urgent': ['now', 'immediately', 'asap', 'urgent', 'right now', 'abhi', 
                   'jaldi', 'turant', 'fatafat', 'quickly', 'hurry'],
        'elevated': ['soon', 'today', 'tonight', 'aaj', 'need to', 'have to',
                     'must', 'important', 'priority']
    }
    
    # Negation words
    NEGATION_WORDS = ['not', "n't", 'no', 'never', 'none', 'neither', 'nobody',
                      'nothing', 'nowhere', 'nahi', 'nhi', 'na', 'mat', 'kabhi nahi']
    
    # Intensifiers
    INTENSIFIERS = ['very', 'really', 'extremely', 'so', 'too', 'super', 'totally',
                    'absolutely', 'completely', 'utterly', 'highly', 'incredibly',
                    'bahut', 'bohot', 'itna', 'kitna', 'zyada', 'kaafi']
    
    @staticmethod
    def extract_stress_features(text: str, text_features: TextFeatures) -> TextFeatures:
        """
        Extract all linguistic stress features and update TextFeatures.
        
        Args:
            text: The normalized text
            text_features: TextFeatures object to update
        
        Returns:
            Updated TextFeatures
        """
        text_lower = text.lower()
        
        # Find stress indicators
        stress_indicators = []
        stress_score = 0
        
        for word in LinguisticStressExtractor.STRESS_WORDS['high']:
            if word in text_lower:
                stress_indicators.append(f"high:{word}")
                stress_score += 3
        
        for word in LinguisticStressExtractor.STRESS_WORDS['medium']:
            if word in text_lower:
                stress_indicators.append(f"medium:{word}")
                stress_score += 2
        
        for word in LinguisticStressExtractor.STRESS_WORDS['low']:
            if word in text_lower:
                stress_score -= 0.5  # Mitigating words reduce score
        
        text_features.stress_indicators = stress_indicators
        
        # Determine stress level
        if stress_score >= 5:
            text_features.stress_level = "high"
        elif stress_score >= 2:
            text_features.stress_level = "medium"
        else:
            text_features.stress_level = "low"
        
        # Check urgency
        for word in LinguisticStressExtractor.URGENCY_WORDS['urgent']:
            if word in text_lower:
                text_features.urgency_level = "urgent"
                break
        else:
            for word in LinguisticStressExtractor.URGENCY_WORDS['elevated']:
                if word in text_lower:
                    text_features.urgency_level = "elevated"
                    break
        
        # Check negation
        text_features.has_negation = any(neg in text_lower for neg in LinguisticStressExtractor.NEGATION_WORDS)
        
        # Calculate emotional intensity (0.0 to 1.0)
        intensity_score = 0.0
        
        # Intensifiers boost intensity
        intensifier_count = sum(1 for word in LinguisticStressExtractor.INTENSIFIERS if word in text_lower)
        intensity_score += min(intensifier_count * 0.15, 0.3)
        
        # Caps words boost intensity
        intensity_score += min(len(text_features.caps_words) * 0.1, 0.2)
        
        # Repeated chars boost intensity
        intensity_score += min(len(text_features.repeated_chars) * 0.1, 0.2)
        
        # Exclamations boost intensity
        intensity_score += min(text_features.exclamation_count * 0.05, 0.15)
        
        # Emoji count affects intensity
        intensity_score += min(text_features.emoji_count * 0.03, 0.15)
        
        text_features.emotional_intensity = min(intensity_score, 1.0)
        
        return text_features
    
    @staticmethod
    def detect_language_hint(text: str) -> str:
        """Detect if text is English, Hindi, or Hinglish"""
        # Hindi/Hinglish indicator words
        hindi_words = ['hai', 'hain', 'ho', 'hoon', 'kar', 'karo', 'kya', 'kyun', 
                       'kaise', 'kab', 'kaun', 'kaha', 'mein', 'mujhe', 'tum', 
                       'aap', 'yeh', 'woh', 'ye', 'wo', 'nahi', 'haan', 'acha',
                       'accha', 'theek', 'thik', 'bahut', 'bohot', 'zyada']
        
        text_lower = text.lower()
        words = set(re.findall(r'\b\w+\b', text_lower))
        
        hindi_count = sum(1 for word in words if word in hindi_words)
        total_words = len(words) if words else 1
        
        hindi_ratio = hindi_count / total_words
        
        if hindi_ratio > 0.5:
            return "hindi"
        elif hindi_ratio > 0.15:
            return "hinglish"
        else:
            return "english"


# ============================================================================
# MAIN TEXT PROCESSOR
# ============================================================================

class TextProcessor:
    """
    Main text processing class that combines all processing components.
    Use this for complete text analysis.
    """
    
    def __init__(self):
        self.raw_handler = RawInputHandler()
        self.normalizer = TextNormalizer()
        self.emoji_extractor = EmojiEmphasisExtractor()
        self.stress_extractor = LinguisticStressExtractor()
    
    def process(self, text: str) -> TextFeatures:
        """
        Process text and extract all features.
        
        Args:
            text: Raw user input
        
        Returns:
            TextFeatures object with all extracted features
        """
        features = TextFeatures()
        
        # Step 1: Handle raw input
        features.raw_text = text
        cleaned_text = self.raw_handler.handle_raw_input(text)
        
        # Step 2: Extract emojis and emphasis BEFORE normalization
        features.emojis, features.emoji_emotions = self.emoji_extractor.extract_emojis(cleaned_text)
        features.emoji_count = len(features.emojis)
        features.dominant_emoji_emotion = self.emoji_extractor.get_dominant_emoji_emotion(features.emoji_emotions)
        
        features.caps_words = self.emoji_extractor.extract_caps_emphasis(cleaned_text)
        features.repeated_chars = self.emoji_extractor.extract_repeated_chars(cleaned_text)
        features.exclamation_count, features.question_count = self.emoji_extractor.count_punctuation(cleaned_text)
        
        # Step 3: Normalize text
        features.normalized_text = self.normalizer.normalize(cleaned_text)
        
        # Step 4: Calculate basic text statistics
        words = cleaned_text.split()
        features.word_count = len(words)
        features.sentence_count = len(re.findall(r'[.!?]+', cleaned_text)) or 1
        if words:
            features.avg_word_length = sum(len(w) for w in words) / len(words)
        
        # Step 5: Detect language
        features.language_hint = self.stress_extractor.detect_language_hint(cleaned_text)
        
        # Step 6: Extract linguistic stress features
        features = self.stress_extractor.extract_stress_features(cleaned_text, features)
        
        return features
    
    def get_emotional_context(self, features: TextFeatures) -> Dict[str, Any]:
        """
        Get a summary of emotional context from features.
        Useful for emotion detection integration.
        """
        return {
            "emoji_emotion": features.dominant_emoji_emotion,
            "stress_level": features.stress_level,
            "urgency": features.urgency_level,
            "intensity": features.emotional_intensity,
            "has_emphasis": len(features.caps_words) > 0 or len(features.repeated_chars) > 0,
            "emphasis_words": features.caps_words,
            "language": features.language_hint,
            "is_negative": features.has_negation,
            "is_question": features.question_count > 0
        }


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

# Global processor instance
_processor = TextProcessor()


def process_user_text(text: str) -> TextFeatures:
    """
    Convenience function to process user text.
    
    Args:
        text: Raw user input
    
    Returns:
        TextFeatures object with all extracted features
    """
    return _processor.process(text)


def get_text_emotional_context(text: str) -> Dict[str, Any]:
    """
    Get emotional context from text.
    
    Args:
        text: Raw user input
    
    Returns:
        Dictionary with emotional context
    """
    features = _processor.process(text)
    return _processor.get_emotional_context(features)


def normalize_text(text: str) -> str:
    """
    Simple text normalization.
    
    Args:
        text: Raw text
    
    Returns:
        Normalized text
    """
    cleaned = RawInputHandler.handle_raw_input(text)
    return TextNormalizer.normalize(cleaned)


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    # Test examples
    test_texts = [
        "I'm soooo stressed right now 😰😰 HELP ME PLEASE!!!",
        "feeling kinda low today 😔",
        "Bahut tension ho raha hai yaar 😫",
        "I'm REALLY happy!!! 🎉🥳✨",
        "idk what to do anymore... everything is falling apart",
        "thoda sa tired hoon but I'm okay 🙂",
    ]
    
    print("=" * 60)
    print("TEXT PROCESSING MODULE TEST")
    print("=" * 60)
    
    for text in test_texts:
        print(f"\nInput: {text}")
        print("-" * 40)
        
        features = process_user_text(text)
        context = _processor.get_emotional_context(features)
        
        print(f"Normalized: {features.normalized_text}")
        print(f"Emojis: {features.emojis} -> {features.dominant_emoji_emotion}")
        print(f"Caps Words: {features.caps_words}")
        print(f"Stress Level: {features.stress_level}")
        print(f"Urgency: {features.urgency_level}")
        print(f"Intensity: {features.emotional_intensity:.2f}")
        print(f"Language: {features.language_hint}")
        print()
