"""
AI Service - AWS Bedrock Integration
Patient Agent for empathetic mental health support
"""
import boto3
import json
import logging
from typing import List, Dict, Optional
from datetime import datetime
from config.settings import settings

# Configure logging
logger = logging.getLogger(__name__)

class AIServiceError(Exception):
    """Custom exception for AI service errors"""
    pass

class AIService:
    """
    Patient Agent - Empathetic AI support
    
    Responsibilities:
    - Generate empathetic responses via AWS Bedrock
    - Detect emotions in user messages
    - Manage conversation context
    - Handle API failures gracefully
    
    Design decisions:
    - Model: Claude Haiku (fast, cost-effective)
    - Context window: Last 10 messages
    - Fallback: Predefined responses on error
    - Rate limiting: Handled by AWS (built-in)
    """
    
    def __init__(self):
        """Initialize AWS Bedrock client"""
        try:
            self.bedrock = boto3.client(
                service_name='bedrock-runtime',
                region_name=settings.AWS_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
            )
            logger.info("✅ Bedrock client initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Bedrock client: {e}")
            # Don't raise here if you want app to start even if Bedrock fails
            # But creating a service usually implies dependency is needed.
            # We will catch this in health checks.
            self.bedrock = None
        
        # Model configuration
        self.model_id = "amazon.nova-lite-v1:0"  # Updated to Amazon Nova Lite
        self.max_tokens = 300  # Keep responses concise
        self.temperature = 0.7  # Balanced creativity
        
        # Context management
        self.max_context_messages = 10  # Last 10 messages
        
        # System prompt - defines AI personality
        self.system_prompt = """You are BeWell, a compassionate mental health support AI assistant.

Your role:
- Listen empathetically and validate feelings
- Ask gentle follow-up questions to understand better
- Provide emotional support (NOT medical advice or diagnosis)
- Keep responses warm, brief (2-4 sentences maximum)
- If user seems in crisis, gently suggest professional help

Remember:
- You support, you don't diagnose
- You listen, you don't solve
- Be kind, patient, and non-judgmental
- Never make promises you can't keep
- Respect user's autonomy

Crisis indicators:
- If you detect suicidal thoughts, self-harm, or immediate danger
- Acknowledge their pain with compassion
- Gently suggest: "It sounds like you're going through an incredibly difficult time. Have you considered talking to a crisis counselor? They're trained to help in moments like this."
- Do NOT panic or over-react
"""
        
        # Fallback responses (when AI fails)
        self.fallback_responses = [
            "I'm here to listen. Could you tell me more about how you're feeling?",
            "Thank you for sharing that with me. What's on your mind right now?",
            "I hear you. Would you like to talk more about what you're experiencing?",
        ]
        
        logger.info(f"✅ AI Service configured: model={self.model_id}, max_tokens={self.max_tokens}")
    
    def get_chat_response(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict]] = None,
        conversation_summary: Optional[str] = None
    ) -> Dict:
        """
        Get empathetic AI response
        
        Args:
            user_message: Current message from user
            conversation_summary: Summary of previous conversation (context window extension)
            conversation_history: Previous messages (optional)
        """
        if not self.bedrock:
             # Fallback if client init failed
            fallback = self._get_fallback_response()
            return {
                "response": fallback,
                "model_used": "fallback (client init failed)",
                "tokens_used": 0,
                "response_time_ms": 0,
                "error": "Bedrock client not initialized"
            }

        start_time = datetime.utcnow()
        
        try:
            # Build message history with context window
            messages = self._build_message_context(user_message, conversation_history)
            
            # Construct system prompt with summary if available
            current_system_prompt = self.system_prompt
            if conversation_summary:
                current_system_prompt += f"\n\nHere is a summary of the conversation so far (use this for context but do not mention it explicitly):\n{conversation_summary}"
            
            # Prepare request body
            # Prepare request body for Amazon Nova
            # Nova uses 'system' inside inferenceConfig or top level depending on version, 
            # but standard Bedrock `converse` API or `invoke_model` with Nova schema is:
            # { "system": [...], "messages": [...], "inferenceConfig": { ... } }
            
            body = json.dumps({
                "system": [{"text": current_system_prompt}],
                "messages": messages,
                "inferenceConfig": {
                    "max_new_tokens": self.max_tokens,
                    "temperature": self.temperature
                }
            })
            
            logger.info(f"🤖 Calling Bedrock API (Nova) for message: '{user_message[:50]}...'")
            
            # Call Bedrock
            response = self.bedrock.invoke_model(
                modelId=self.model_id,
                body=body
            )
            
            # Parse response
            # Parse response - Nova returns 'output.message.content[0].text'
            result = json.loads(response['body'].read())
            ai_response = result['output']['message']['content'][0]['text']
            
            # Calculate response time
            response_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            logger.info(f"✅ AI responded in {response_time_ms}ms: '{ai_response[:50]}...'")
            
            # Count tokens (approximation: 1 token ≈ 4 chars)
            tokens_used = len(ai_response) // 4
            
            return {
                "response": ai_response,
                "model_used": self.model_id,
                "tokens_used": tokens_used,
                "response_time_ms": response_time_ms
            }
            
        except Exception as e:
            logger.error(f"❌ Bedrock API error: {e}")
            
            # Use fallback response
            fallback = self._get_fallback_response()
            
            logger.warning(f"⚠️ Using fallback response: '{fallback}'")
            
            return {
                "response": fallback,
                "model_used": "fallback",
                "tokens_used": 0,
                "response_time_ms": 0,
                "error": str(e)
            }
    
    def _build_message_context(
        self,
        current_message: str,
        history: Optional[List[Dict]] = None
    ) -> List[Dict]:
        """
        Build conversation context with sliding window
        
        Args:
            current_message: Latest user message
            history: Previous conversation messages
        
        Returns:
            List of messages for AI (max 10 previous + current)
        """
        messages = []
        
        # Add history (last N messages)
        if history:
            # Take only last N messages to stay within context window
            # Reformating history for Nova if needed. 
            # Nova expects content as list of blocks: "content": [{"text": "..."}]
            # Our history storage usually has string content.
            # We need to ensure we pass correctly formatted blocks.
            for msg in history[-self.max_context_messages:]:
                 content_block = msg["content"]
                 if isinstance(content_block, str):
                     content_block = [{"text": content_block}]
                 
                 messages.append({
                     "role": msg["role"],
                     "content": content_block
                 })
            
            logger.debug(f"📚 Added {len(messages)} messages from history")
        
        # Add current message
        messages.append({
            "role": "user",
            "content": [{"text": current_message}]
        })
        
        return messages

    def summarize_conversation(self, history: List[Dict]) -> str:
        """
        Generate a summary of the conversation
        
        Args:
            history: List of conversation messages
            
        Returns:
            Summary string
        """
        if not history or not self.bedrock:
            return ""
            
        try:
            # Prepare prompt for summarization
            messages = [
                {
                    "role": "user", 
                    "content": [{"text": f"Summarize the following mental health conversation in 2-3 sentences. Focus on the user's key concerns and emotional state:\n\n{json.dumps(history)}"}]
                }
            ]
            
            body = json.dumps({
                "messages": messages,
                "inferenceConfig": {
                    "max_new_tokens": 200,
                    "temperature": 0.5
                }
            })
            
            response = self.bedrock.invoke_model(
                modelId=self.model_id,
                body=body
            )
            
            result = json.loads(response['body'].read())
            return result['output']['message']['content'][0]['text']
            
        except Exception as e:
            logger.error(f"❌ Failed to generate summary: {e}")
            return ""
    

    
    def _get_fallback_response(self) -> str:
        """
        Get a fallback response when AI fails
        
        Uses a rotation to avoid repetitive responses
        """
        import random
        return random.choice(self.fallback_responses)
    
    def health_check(self) -> Dict:
        """
        Check if AI service is healthy
        
        Returns:
            {
                "status": "healthy" | "unhealthy",
                "model_id": self.model_id,
                "region": settings.AWS_REGION,
                "error": str (if unhealthy)
            }
        """
        try:
            if not self.bedrock:
                raise Exception("Bedrock client not initialized")

            # Simple test call
            self.bedrock.invoke_model(
                modelId=self.model_id,
                body=json.dumps({
                    "messages": [{"role": "user", "content": [{"text": "Hi"}]}],
                     "inferenceConfig": {"max_new_tokens": 10}
                })
            )
            
            return {
                "status": "healthy",
                "model_id": self.model_id,
                "region": settings.AWS_REGION
            }
        
        except Exception as e:
            return {
                "status": "unhealthy",
                "model_id": self.model_id,
                "region": settings.AWS_REGION,
                "error": str(e)
            }

# Global singleton instance
ai_service = AIService()
