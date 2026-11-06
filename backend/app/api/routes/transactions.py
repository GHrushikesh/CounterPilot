from datetime import datetime
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.common import PaginatedResponse
from app.services.sale_service import SaleService

router = APIRouter(prefix="/transactions", tags=["Transactions"])


class TransactionItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_unit: str
    transaction_type: str
    quantity: Decimal
    previous_stock: Decimal
    new_stock: Decimal
    note: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


@router.get("", response_model=PaginatedResponse[TransactionItemResponse])
def get_transactions(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> PaginatedResponse[TransactionItemResponse]:
    """Retrieve historical stock audit transactions."""
    items, total, total_pages = SaleService.get_inventory_transactions(db, page, page_size)
    return PaginatedResponse[TransactionItemResponse](
        items=[TransactionItemResponse.model_validate(t) for t in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )
