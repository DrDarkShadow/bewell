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

# Initialize AWS Bedrock using backend settings
llm = ChatBedrock(
    model_id=settings.BEDROCK_MODEL_ID,
    model_kwargs={
        "temperature": 0.7,
        "max_tokens": 1000,
    },
    client=None, # Langchain AWS client will use environment vars or default session, which settings also load
    region_name=settings.AWS_REGION
)
