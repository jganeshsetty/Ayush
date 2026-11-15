import os
import uuid
from contextlib import asynccontextmanager
from typing import List

from dotenv import load_dotenv

# Load environment variables from .env file in root or current dir
load_dotenv()

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.openapi.utils import get_openapi

from backend.database import connect_to_mongo, close_mongo_connection
from backend.routers import auth, medications, appointments, dashboard, notifications, ai, voice
from backend.scheduler import scheduler
from backend.rate_limiter import rate_limiter, RateLimitConfig, add_rate_limit_headers
from backend.logging_config import setup_logging, get_logger, request_id_var, RequestLogger

# Setup structured logging
setup_logging(os.getenv("LOG_LEVEL", "INFO"))
logger = get_logger(__name__)


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


# Environment check for docs protection
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Create FastAPI app with appropriate docs settings
app = FastAPI(
    title="Ayush API",
    description="Elderly care management platform API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None if ENVIRONMENT == "production" else "/docs",
    redoc_url=None if ENVIRONMENT == "production" else "/redoc",
    openapi_url=None if ENVIRONMENT == "production" else "/openapi.json",
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

# Request ID middleware for tracing
@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    """Add request ID to all requests for tracing."""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request_id_var.set(request_id)
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# Request logging middleware
@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    """Log all HTTP requests with structured data."""
    import time
    start_time = time.time()
    request_id = request_id_var.get()

    response = await call_next(request)

    duration_ms = (time.time() - start_time) * 1000

    # Get user ID if authenticated
    user_id = None
    if hasattr(request.state, "user_id"):
        user_id = request.state.user_id

    RequestLogger.log_request(
        logger, request.method, request.url.path, response.status_code,
        duration_ms, request_id=request_id, user_id=user_id
    )

    return response


# Security headers middleware
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    # CSP in report-only mode for easier deployment
    response.headers["Content-Security-Policy-Report-Only"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' data:; "
        "connect-src 'self' https:; "
        "frame-ancestors 'none'; "
        "form-action 'self'; "
        "base-uri 'self'"
    )
    return response


# Development - add custom docs endpoints (explicit routes for clarity)
if ENVIRONMENT != "production":
    @app.get("/docs", include_in_schema=False)
    async def custom_swagger_ui_html(request: Request):
        return get_swagger_ui_html(openapi_url="/openapi.json", title="Ayush API - Swagger UI")

    @app.get("/redoc", include_in_schema=False)
    async def custom_redoc_html(request: Request):
        return get_redoc_html(openapi_url="/openapi.json", title="Ayush API - ReDoc")

    @app.get("/openapi.json", include_in_schema=False)
    async def custom_openapi(request: Request):
        return get_openapi(title="Ayush API", version="1.0.0", routes=app.routes)


# Register rate limit configs
# Auth endpoints: 5 requests/minute per IP
rate_limiter.register("/api/v1/auth/login", RateLimitConfig(max_requests=5, window_seconds=60, key_prefix="auth:"))
rate_limiter.register("/api/v1/auth/register", RateLimitConfig(max_requests=5, window_seconds=60, key_prefix="auth:"))
# AI endpoints: 20 requests/minute per IP
rate_limiter.register("/api/v1/ai/parse-prescription", RateLimitConfig(max_requests=20, window_seconds=60, key_prefix="ai:"))
rate_limiter.register("/api/v1/ai/safety-check", RateLimitConfig(max_requests=20, window_seconds=60, key_prefix="ai:"))
rate_limiter.register("/api/v1/ai/voice-checkin", RateLimitConfig(max_requests=20, window_seconds=60, key_prefix="ai:"))
# Voice endpoint: 20 requests/minute per IP
rate_limiter.register("/api/v1/voice/speak", RateLimitConfig(max_requests=20, window_seconds=60, key_prefix="voice:"))


@app.middleware("http")
async def rate_limit_headers_middleware(request: Request, call_next):
    """Add rate limit headers to all responses."""
    from fastapi import Response
    response = await call_next(request)
    return add_rate_limit_headers(response, request)


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
    """Health check endpoint with dependency checks."""
    from backend.database import get_db
    health = {
        "status": "ok",
        "service": "ayush-api",
        "checks": {}
    }

    # Check MongoDB
    try:
        db = get_db()
        await db.command("ping")
        health["checks"]["mongodb"] = "ok"
    except Exception as e:
        health["checks"]["mongodb"] = f"error: {str(e)}"
        health["status"] = "degraded"

    # Check scheduler
    try:
        from backend.scheduler import scheduler
        health["checks"]["scheduler"] = "ok" if scheduler.running else "stopped"
    except Exception as e:
        health["checks"]["scheduler"] = f"error: {str(e)}"

    return health


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler with logging."""
    request_id = request_id_var.get()
    RequestLogger.log_request(
        logger, request.method, request.url.path, exc.status_code,
        0, request_id=request_id, error=exc.detail
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler with structured logging."""
    request_id = request_id_var.get()
    RequestLogger.log_error(logger, "Unhandled exception", exc, request_id=request_id)
    # Don't expose internal errors in production
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "status_code": 500}
    )