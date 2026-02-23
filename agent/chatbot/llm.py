import os
import sys

# Ensure backend/src is in the path to import config
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
backend_src = os.path.join(project_root, "backend", "src")
if backend_src not in sys.path:
    sys.path.append(backend_src)

from config.settings import settings
from langchain_aws import ChatBedrock

# Amazon Nova Micro — fastest Bedrock model (~2x faster than Lite)
# Great for short conversational turns (2-3 sentences)
llm = ChatBedrock(
    model_id="amazon.nova-micro-v1:0",
    model_kwargs={
        "temperature": 0.65,
        "max_tokens": 600,   # Enough for 2-3 sentence replies; shorter = faster
    },
    region_name=settings.AWS_REGION
)
