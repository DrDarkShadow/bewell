import sys
import os
import random
import json
import time

# Add backend to path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(os.path.join(project_root, 'backend'))
sys.path.append(os.path.join(project_root, 'backend', 'src'))

from sqlalchemy import create_engine, text

# Hardcoded valid bcrypt hash for "password123"
PASSWORD_HASH = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWrn96pzwloLE1zOIyMoGj33P5xWO"

# Try to get DB URL
try:
    from config.settings import settings
    DATABASE_URL = settings.DATABASE_URL
except ImportError:
    try:
        from src.config.settings import settings
        DATABASE_URL = settings.DATABASE_URL
    except ImportError:
        DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:54322/postgres")

engine = create_engine(DATABASE_URL)

FIRST_NAMES = ["Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Zara", "Diya", "Ananya", "Ishaan", "Myra", "Rohan", "Priya", "Rahul", "Snake", "Kabir", "Meera", "Neagin", "Kriti", "Suresh", "Ramesh"]
LAST_NAMES = ["Sharma", "Verma", "Gupta", "Malhotra", "Singh", "Patel", "Reddy", "Nair", "Iyer", "Khan", "Kumar", "Das", "Joshi", "Mehta", "Chopra"]
SPECIALIZATIONS = ["Clinical Psychologist", "Psychiatrist", "Therapist", "Counselor", "Life Coach", "Child Psychologist", "Marriage Counselor"]

def random_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"

def random_phone():
    return f"9{random.randint(100000000, 999999999)}"

def seed_data():
    print(f"🚀 Seeding 100+ records to {DATABASE_URL.split('@')[-1]}...")
    
    with engine.begin() as conn:
        try:
            # 1. Create 100 Patients using RETURNING ID
            print("👤 Generating 100 Patients...")
            patient_ids = []
            for i in range(100):
                email = f"patient_{int(time.time())}_{i}@example.com"
                
                # Try simple insert by casting everything to correct types
                # Using ::varchar to be explicit
                res = conn.execute(text("""
                    INSERT INTO users (email, password_hash, role, name, phone, created_at, updated_at)
                    VALUES (:email, :pw, CAST(:role AS VARCHAR), :name, :phone, NOW(), NOW())
                    RETURNING id
                """), {
                    "email": email, "pw": PASSWORD_HASH, "role": "patient",
                    "name": random_name(), "phone": random_phone()
                }).fetchone()
                patient_ids.append(res[0])
            
            print(f"✅ Created {len(patient_ids)} patients.")

            # 2. Create 50 Professionals
            print("👨‍⚕️ Generating 50 Professionals...")
            doc_ids = []
            for i in range(50):
                name = random_name()
                email = f"dr.{name.lower().replace(' ', '.')}_{int(time.time())}_{i}@bewell.com"
                spec = random.choice(SPECIALIZATIONS)
                
                res = conn.execute(text("""
                    INSERT INTO users (email, password_hash, role, name, phone, created_at, updated_at)
                    VALUES (:email, :pw, CAST(:role AS VARCHAR), :name, :phone, NOW(), NOW())
                    RETURNING id
                """), {
                    "email": email, "pw": PASSWORD_HASH, "role": "professional",
                    "name": "Dr. " + name, "phone": random_phone()
                }).fetchone()
                did = res[0]
                doc_ids.append(did)
                
                # Insert Profile
                # Use plain int/float for numbers, json dump for json
                hours = json.dumps({"mon": "10:00-18:00", "wed": "10:00-14:00", "fri": "10:00-18:00"})
                # Explicitly cast where it matters
                conn.execute(text("""
                    INSERT INTO professional_profiles (
                        user_id, specialization, license_number, years_of_experience, education, bio,
                        working_hours, verified, accepting_patients, languages, consultation_fee,
                        average_rating, total_reviews, current_patient_count, created_at, updated_at
                    ) VALUES (
                        :uid, :spec, :lic, :exp, :edu, :bio,
                        CAST(:hours AS JSONB), :ver, :acc, :lang, :fee,
                        :rating, :reviews, :patients, NOW(), NOW()
                    ) ON CONFLICT (user_id) DO NOTHING
                """), {
                    "uid": did,
                    "spec": spec,
                    "lic": f"LIC-{random.randint(10000,99999)}",
                    "exp": int(random.randint(3, 25)),
                    "edu": "PhD" if "Psych" in spec else "Masters",
                    "bio": f"Experienced {spec}.",
                    "hours": hours,
                    "ver": True,
                    "acc": True,
                    "lang": "English, Hindi",
                    "fee": float(random.randint(8, 30) * 100),
                    "rating": float(round(random.uniform(3.5, 5.0), 1)),
                    "reviews": int(random.randint(0, 50)),
                    "patients": int(random.randint(0, 20))
                })

            print(f"✅ Created {len(doc_ids)} professionals.")

            # 3. Create 200 Reviews
            print("⭐ Generating 200 Reviews...")
            if patient_ids and doc_ids:
                for _ in range(200):
                    doc = random.choice(doc_ids)
                    pat = random.choice(patient_ids)
                    
                    conn.execute(text("""
                        INSERT INTO professional_reviews (
                            professional_id, patient_id, rating, review_text, created_at
                        ) VALUES (
                            :did, :pid, :rating, :text, NOW() - (random() * interval '30 days')
                        ) ON CONFLICT DO NOTHING
                    """), {
                        "did": doc, "pid": pat, 
                        "rating": int(random.randint(3, 5)),
                        "text": random.choice(["Great session!", "Very helpful.", "Kind."])
                    })

            print("✅ Database populated successfully!")

        except Exception as e:
            print(f"❌ Custom seeding failed: {e}")
            raise

if __name__ == "__main__":
    seed_data()
