import asyncio
import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))
sys.path.append(os.path.join(os.getcwd(), 'backend', 'src'))

from sqlalchemy import text
from config.database import engine

async def create_tables():
    async with engine.begin() as conn:
        # 1. Create Professional Profiles Table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS professional_profiles (
                id BIGSERIAL PRIMARY KEY,
                user_id BIGINT UNIQUE NOT NULL REFERENCES users(id),
                
                -- Professional Info
                specialization TEXT,
                license_number VARCHAR(100),
                years_of_experience INTEGER,
                education TEXT,
                bio TEXT,
                
                -- Availability
                working_hours JSONB,
                
                -- Status
                verified BOOLEAN DEFAULT FALSE,
                accepting_patients BOOLEAN DEFAULT TRUE,
                current_patient_count INTEGER DEFAULT 0,
                
                -- Profile
                profile_image_url TEXT,
                languages TEXT,
                
                -- Ratings (computed from reviews)
                average_rating DECIMAL(3,2) DEFAULT 0.0,
                total_reviews INTEGER DEFAULT 0,
                total_appointments INTEGER DEFAULT 0,
                
                -- Pricing
                consultation_fee DECIMAL(10,2),
                
                -- Timestamps
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        """))
        
        # 2. Create Indexes for Professional Profiles
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_professional_user_id ON professional_profiles(user_id);
            CREATE INDEX IF NOT EXISTS idx_professional_rating ON professional_profiles(average_rating DESC);
            CREATE INDEX IF NOT EXISTS idx_professional_accepting ON professional_profiles(accepting_patients) WHERE accepting_patients = TRUE;
            CREATE INDEX IF NOT EXISTS idx_professional_specialization ON professional_profiles USING gin(to_tsvector('english', specialization));
        """))

        # 3. Create Professional Reviews Table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS professional_reviews (
                id BIGSERIAL PRIMARY KEY,
                professional_id BIGINT NOT NULL REFERENCES users(id),
                patient_id BIGINT NOT NULL REFERENCES users(id),
                appointment_id BIGINT REFERENCES appointments(id),
                
                rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
                review_text TEXT,
                
                created_at TIMESTAMP DEFAULT NOW(),
                
                -- Prevent duplicate reviews for same appointment
                UNIQUE(appointment_id, patient_id)
            );
        """))

        # 4. Create Indexes for Reviews
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_review_professional ON professional_reviews(professional_id, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_review_rating ON professional_reviews(professional_id, rating);
        """))
        
        print("✅ Successfully created 'professional_profiles' and 'professional_reviews' tables!")

if __name__ == "__main__":
    import sys
    import os
    # Add backend directory to sys.path to find config
    sys.path.append(os.path.join(os.getcwd(), 'backend'))
    
    asyncio.run(create_tables())
