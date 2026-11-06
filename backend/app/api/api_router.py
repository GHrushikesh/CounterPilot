from fastapi import APIRouter
from app.api.routes import health, products

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(products.router)
