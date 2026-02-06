from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.common import auth

app = FastAPI(
    title="BeWell API",
    description="Mental Health Support Platform - AWS Hackathon",
    version="1.0.0"
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
app.include_router(auth.router)

# Health check
@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "BeWell Backend",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)