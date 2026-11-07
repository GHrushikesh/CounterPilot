from fastapi import APIRouter
from app.api.routes import health, products, sales, transactions, assistant, settings

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(products.router)
api_router.include_router(sales.router)
api_router.include_router(transactions.router)
api_router.include_router(assistant.router)
api_router.include_router(settings.router)
