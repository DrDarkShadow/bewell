import sys
import os
import asyncio

# Setup path
sys.path.insert(0, os.path.abspath("src"))

from src.config.database import SessionLocal
from src.api.common.escalations import doctor_accept_request
from src.models.appointment import AppointmentRequest

async def main():
    db = SessionLocal()
    try:
        # Find any pending request
        req = db.query(AppointmentRequest).filter(AppointmentRequest.status == "pending").first()
        if not req:
            print("No pending requests found to test.")
            return
            
        print(f"Testing accept for request {req.id}")
        
        from src.models.appointment import RequestReceiver
        receiver = db.query(RequestReceiver).filter(RequestReceiver.request_id == req.id).first()
        if not receiver:
            print("No receiver for this request")
            return
            
        doctor_id = receiver.professional_id
        
        # Test it
        try:
            res = await doctor_accept_request(req.id, db, {"sub": str(doctor_id)})
            print("Success!", res)
        except Exception as e:
            import traceback
            traceback.print_exc()
            
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
