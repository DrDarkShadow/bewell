import boto3
import json
import sys
import os

# Add src to path so we can import config
sys.path.append(os.path.join(os.getcwd(), "src"))
from config.settings import settings

def test_bedrock():
    print(f"🕵️ Testing Bedrock connectivity in {settings.AWS_REGION}...")
    print(f"🔑 Key: {settings.AWS_ACCESS_KEY_ID[:5]}... (length: {len(settings.AWS_ACCESS_KEY_ID)})")
    
    client = boto3.client(
        service_name='bedrock-runtime',
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
    )
    
    model_id = "amazon.nova-lite-v1:0"
    
    body = json.dumps({
        "system": [{"text": "You are a helpful assistant."}],
        "messages": [{"role": "user", "content": [{"text": "Hello, how are you?"}]}],
        "inferenceConfig": {
            "max_new_tokens": 100,
            "temperature": 0.7
        }
    })
    
    try:
        print(f"🤖 Invoking model {model_id}...")
        response = client.invoke_model(
            modelId=model_id,
            body=body
        )
        result = json.loads(response['body'].read())
        print("✅ Success! Response:")
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(f"❌ Bedrock Error: {e}")

if __name__ == "__main__":
    test_bedrock()
