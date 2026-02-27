import sys
import os
sys.path.append(os.path.abspath("backend/src"))
from config.settings import settings
print(settings.AWS_REGION)
from agent.chatbot.llm import llm
try:
    res = llm.invoke("Hello")
    print("Success:", res)
except Exception as e:
    print("Error:", e)
