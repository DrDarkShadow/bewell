import sys
import os
import traceback
import logging

# Configure logging to write to a file in utf-8
logging.basicConfig(filename='backend_logs.txt', level=logging.DEBUG, 
                    format='%(asctime)s %(levelname)s %(name)s %(message)s',
                    encoding='utf-8')

sys.path.append(os.path.abspath("backend/src"))

from config.database import SessionLocal
from services.chat_service import ChatService
from models.conversation import Conversation

db = SessionLocal()
try:
    service = ChatService(db)
    conv = db.query(Conversation).first()
    if not conv:
        print("No conversation found in DB!")
    else:
        print(f"Testing on conversation {conv.id} for user {conv.patient_id}...")
        res = service.send_message(conv.id, conv.patient_id, "Hello again from script!")
        with open("agent_result.txt", "w", encoding="utf-8") as f:
            f.write(res["ai_message"].content)
        print("Done. Look at backend_logs.txt")
except Exception as e:
    print("Top-level exception:", e)
finally:
    db.close()
