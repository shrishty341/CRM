"""
FastAPI Application Entry Point for Pharma CRM HCP Interaction Module.
Initializes the application, middleware, and routes.
"""
import os
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from api.routes import router
from database.config import init_db

load_dotenv()

# Configure structured logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown events."""
    logger.info("Starting Pharma CRM HCP Interaction Module...")

    # Initialize database tables
    try:
        init_db()
        logger.info("Database tables initialized successfully")
    except Exception as e:
        logger.warning(f"Database initialization warning: {e}")
        logger.info("Will retry on first request")

    yield

    logger.info("Shutting down Pharma CRM HCP Interaction Module...")


# Create FastAPI application
app = FastAPI(
    title="Pharma CRM HCP Interaction Module",
    description="""
    AI-Powered Healthcare CRM for pharmaceutical field representatives.
    
    Features:
    - Log HCP interactions via traditional form
    - AI Chat Assistant using LangGraph + Groq LLM
    - Automatic structured data extraction from natural language
    - PostgreSQL persistence with full CRUD operations
    - Doctor search and interaction history
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS middleware configuration
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://localhost:8000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "X-Requested-With",
        "Origin",
    ],
    expose_headers=["Content-Length", "X-Request-ID"],
    max_age=600,
)

# Trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"],
)

# Include API routes
app.include_router(router)


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Pharma CRM HCP Interaction Module",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "openapi": "/openapi.json",
        "endpoints": {
            "chat": "POST /api/v1/chat",
            "create_interaction": "POST /api/v1/interaction",
            "get_interaction": "GET /api/v1/interaction/{id}",
            "interaction_history": "GET /api/v1/interaction/history",
            "list_hcps": "GET /api/v1/hcp",
            "recent_hcps": "GET /api/v1/hcp/recent",
            "get_hcp": "GET /api/v1/hcp/{id}",
            "hcp_interactions": "GET /api/v1/hcp/{id}/interactions",
            "health": "GET /api/v1/health",
        },
    }


# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=404,
        content={
            "success": False,
            "message": "The requested resource was not found",
            "path": str(request.url),
        },
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    from fastapi.responses import JSONResponse
    logger.error(f"Internal server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "An internal server error occurred",
        },
    )


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    debug = os.getenv("DEBUG", "false").lower() == "true"

    logger.info(f"Starting server on {host}:{port} (debug={debug})")
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info",
    )
