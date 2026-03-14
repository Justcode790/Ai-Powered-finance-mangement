"""
Minimal ML service for deployment testing.
Use this if the main model.py has issues.
"""

from fastapi import FastAPI
import os

app = FastAPI(title="Simple ML Service")

@app.get("/")
async def root():
    return {
        "message": "Simple ML service running",
        "status": "healthy",
        "port": os.environ.get("PORT", "unknown")
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)