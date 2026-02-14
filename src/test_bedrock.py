import boto3
import json
from config.settings import settings

def test_bedrock():
    """Test AWS Bedrock connection"""
    try:
        # Create Bedrock client
        bedrock = boto3.client(
            service_name='bedrock-runtime',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        
        # Simple test prompt for Amazon Nova Lite
        # Nova Lite expects: { "messages": [...], "inferenceConfig": {...} }
        body = json.dumps({
            "messages": [
                {
                    "role": "user",
                    "content": [{"text": "Say hello in one sentence"}]
                }
            ],
            "inferenceConfig": {
                "max_new_tokens": 100,
                "temperature": 0.7
            }
        })
        
        # Call Bedrock
        response = bedrock.invoke_model(
            modelId=settings.BEDROCK_MODEL_ID,
            body=body
        )
        
        # Parse response
        # Nova returns 'output.message.content[0].text'
        result = json.loads(response['body'].read())
        ai_message = result['output']['message']['content'][0]['text']
        
        print("✅ Bedrock Working!")
        print(f"AI Response: {ai_message}")
        return True
        
    except Exception as e:
        print(f"❌ Bedrock Error: {e}")
        return False

if __name__ == "__main__":
    test_bedrock()