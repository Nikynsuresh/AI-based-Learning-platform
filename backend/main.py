from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, learning
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

from app.db import connect_to_mongo, close_mongo_connection
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(title="Advanced AI Learning Platform API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(learning.router, prefix="/api/learning", tags=["Learning"])

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Python Backend is running"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
