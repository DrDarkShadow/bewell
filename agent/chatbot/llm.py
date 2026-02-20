import os
from dotenv import load_dotenv
from langchain_aws import ChatBedrock

load_dotenv()

# Initialize AWS Bedrock (Amazon Nova Lite)
llm = ChatBedrock(
    model_id="amazon.nova-lite-v1:0",
    model_kwargs={
        "temperature": 0.7,
        "max_tokens": 1000,
    },
    region_name=os.getenv("AWS_REGION", "us-east-1")
)
