from fastapi import FastAPI
import uvicorn
print("Import success")
app = FastAPI()
if __name__ == "__main__":
    uvicorn.run(app)
