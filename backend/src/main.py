from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

# Suppress TensorFlow oneDNN logs (must be set before TF import)
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Suppress INFO/WARNING

# Add src to path so relative imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api.common import auth, chat, appointments, listening, activities, escalations

# API Version Prefix
API_V1_PREFIX = "/api/v1"

app = FastAPI(
    title="BeWell API",
    description="Mental Health Support Platform - AWS Hackathon",
    version="1.0.0",
    docs_url=f"{API_V1_PREFIX}/docs",
    redoc_url=f"{API_V1_PREFIX}/redoc"
)

# Startup Event: Check & Download ML Models
@app.on_event("startup")
async def startup_event():
    import os
    import subprocess
    from config.database import engine, Base
    import models  # Import all models so Base knows about them
    
    print("Starting BeWell API...")

    # Create Tables
    print("Checking database schema...")
    Base.metadata.create_all(bind=engine)
    # Check if models are cached (simple check)
    cache_dir = os.environ.get("TRANSFORMERS_CACHE", os.path.join(os.path.expanduser("~"), ".cache", "huggingface", "hub"))
    print(f"Checking model cache at: {cache_dir}")
    
    # We can also just run the download script - it skips if cached
    script_path = os.path.join(os.getcwd(), "scripts", "download_models.py")
    if os.path.exists(script_path):
        print("Verifying ML models...")
        try:
            # Run download script
            subprocess.run(["python", script_path], check=True)
            print("Models verification complete!")
        except Exception as e:
            print(f"Model verification failed: {e}")
            print("Server starting anyway (ML features might degrade)")
    else:
        print(f"verification script not found at {script_path}")

# CORS - frontend se connect karne ke liye
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production mein specific domain dalna
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{API_V1_PREFIX}")
app.include_router(chat.router, prefix=f"{API_V1_PREFIX}")
app.include_router(appointments.router, prefix=f"{API_V1_PREFIX}")
app.include_router(listening.router, prefix=f"{API_V1_PREFIX}")
app.include_router(activities.router, prefix=f"{API_V1_PREFIX}")
app.include_router(escalations.router, prefix=f"{API_V1_PREFIX}")
# Health check (Root)
@app.get("/")
def root():
    return {
        "service": "BeWell API",
        "version": "1.0.0",
        "status": "healthy"
    }

# Health check (Versioned)
@app.get(f"{API_V1_PREFIX}/health")
def health_check():
    return {
        "status": "healthy",
        "service": "BeWell Backend",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
