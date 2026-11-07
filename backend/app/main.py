import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.database.session import init_db, SessionLocal
from app.database.seed import seed_database
from app.api.api_router import api_router

# Configure root logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("counterpilot")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database schema is created and idempotent sample products are seeded
    logger.info("Initializing CounterPilot database schema...")
    init_db()
    
    logger.info("Verifying / seeding initial sample products...")
    with SessionLocal() as session:
        seed_res = seed_database(session)
        logger.info(f"Database readiness check complete: {seed_res}")
        
    yield
    logger.info("Shutting down CounterPilot application...")


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version="0.1.0",
        description="CounterPilot - AI-powered business operating assistant for small Indian retail shops",
        lifespan=lifespan,
    )

    # Security Headers Middleware
    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Server"] = "CounterPilot-Secure"
        return response

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register standardized error handlers
    register_exception_handlers(app)

    # Mount API routes
    app.include_router(api_router, prefix=settings.API_PREFIX)

    return app


app = create_application()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

