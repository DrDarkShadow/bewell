from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.common import auth, chat

# API Version Prefix
API_V1_PREFIX = "/api/v1"

app = FastAPI(
    title="BeWell API",
    description="Mental Health Support Platform - AWS Hackathon",
    version="1.0.0",
    docs_url=f"{API_V1_PREFIX}/docs",
    redoc_url=f"{API_V1_PREFIX}/redoc"
)

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
