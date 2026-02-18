"""
Emotion Memory - Tracks user emotional states over time
"""
from datetime import datetime, timedelta
import json
import os


EMOTION_SCORES = {
    "happy": 0.8,
    "excited": 0.9,
    "neutral": 0.0,
    "bored": -0.2,
    "sad": -0.7,
    "stressed": -0.6
}


class EmotionMemory:
    """Tracks and analyzes user emotions over time."""
    
    def __init__(self, file_path: str = None):
        if file_path is None:
            file_path = os.path.join(os.path.dirname(__file__), "emotion_history.json")
        self.file_path = file_path
        self.emotions = self._load()
    
    def _load(self) -> list:
        """Load emotion history from file."""
        try:
            if os.path.exists(self.file_path):
                with open(self.file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
        return []
    
    def _save(self):
        """Save emotion history to file."""
        try:
            with open(self.file_path, 'w', encoding='utf-8') as f:
                json.dump(self.emotions, f, indent=2, ensure_ascii=False)
        except IOError:
            pass
    
    def add_emotion(self, emotion: str, text: str = "", confidence: float = 0.5):
        """Record a detected emotion."""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "emotion": emotion,
            "text_snippet": text[:100] if text else "",
            "confidence": confidence,
            "score": EMOTION_SCORES.get(emotion, 0.0)
        }
        self.emotions.append(entry)
        self._save()
    
    def get_recent(self, hours: int = 24) -> list:
        """Get emotions from the last N hours."""
        cutoff = datetime.now() - timedelta(hours=hours)
        recent = []
        for e in self.emotions:
            try:
                ts = datetime.fromisoformat(e["timestamp"])
                if ts >= cutoff:
                    recent.append(e)
            except (ValueError, KeyError):
                continue
        return recent
    
    def get_analysis_summary(self) -> dict:
        """Get a summary of emotional patterns."""
        recent = self.get_recent(24)
        
        if not recent:
            return {
                "total_interactions": len(self.emotions),
                "last_24h": {
                    "interaction_count": 0,
                    "dominant_emotion": "neutral",
                    "sentiment_score": 0.0
                },
                "trajectory": "stable"
            }
        
        # Calculate dominant emotion
        emotion_counts = {}
        total_score = 0.0
        for e in recent:
            em = e.get("emotion", "neutral")
            emotion_counts[em] = emotion_counts.get(em, 0) + 1
            total_score += e.get("score", 0.0)
        
        dominant = max(emotion_counts.keys(), key=lambda k: emotion_counts[k])
        avg_score = total_score / len(recent) if recent else 0.0
        
        # Calculate trajectory
        if len(recent) >= 2:
            first_half = recent[:len(recent)//2]
            second_half = recent[len(recent)//2:]
            
            first_avg = sum(e.get("score", 0) for e in first_half) / len(first_half) if first_half else 0
            second_avg = sum(e.get("score", 0) for e in second_half) / len(second_half) if second_half else 0
            
            diff = second_avg - first_avg
            if diff > 0.2:
                trajectory = "improving 📈"
            elif diff < -0.2:
                trajectory = "declining 📉"
            else:
                trajectory = "stable ➡️"
        else:
            trajectory = "not enough data yet"
        
        return {
            "total_interactions": len(self.emotions),
            "last_24h": {
                "interaction_count": len(recent),
                "dominant_emotion": dominant,
                "sentiment_score": round(avg_score, 2)
            },
            "trajectory": trajectory
        }


# Global instance
emotion_memory = EmotionMemory()
