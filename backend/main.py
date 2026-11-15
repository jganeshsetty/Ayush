import os
from contextlib import asynccontextmanager
from typing import List

from dotenv import load_dotenv

# Load environment variables from .env file in root or current dir
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.database import connect_to_mongo, close_mongo_connection
from backend.routers import auth, medications, appointments, dashboard, notifications, ai, voice
from backend.scheduler import scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events."""
    # Startup
    await connect_to_mongo()
    scheduler.start()
    yield
    # Shutdown
    scheduler.shutdown()
    await close_mongo_connection()


app = FastAPI(
    title="Ayush API",
    description="Elderly care management platform API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration - allow-listed origins only
ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


# Include routers
app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(medications.router, prefix="/api/v1", tags=["medications"])
app.include_router(appointments.router, prefix="/api/v1", tags=["appointments"])
app.include_router(dashboard.router, prefix="/api/v1", tags=["dashboard"])
app.include_router(notifications.router, prefix="/api/v1", tags=["notifications"])
app.include_router(ai.router, prefix="/api/v1", tags=["ai"])
app.include_router(voice.router, prefix="/api/v1", tags=["voice"])


@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "ayush-api"}


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler."""
    # Don't expose internal errors in production
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "status_code": 500}
    )