"""
Emotion Detection Package
ML-powered emotion analysis for BeWell mental health platform

Usage:
    from agents.emotion_detection import emotion_service
    result = emotion_service.analyze("I'm feeling stressed")
"""
from agents.emotion_detection.emotion_service import emotion_service, EmotionResult, Suggestion

__all__ = ["emotion_service", "EmotionResult", "Suggestion"]
