import sys
import os
sys.path.append(os.path.abspath("backend/src"))
from agent.chatbot.agent import agent

chat_history = [
    {"role": "system", "content": "[SESSION CONTEXT: Turn #1]"},
    {"role": "user", "content": "Hello! I am testing the system. How are you?"}
]

import traceback
try:
    res = agent.invoke({"messages": chat_history})
    print("Success")
except Exception as e:
    print("Agent error:")
    traceback.print_exc()
