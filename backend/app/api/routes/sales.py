from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.sale import SaleCreate, SaleResponse
from app.services.sale_service import SaleService

router = APIRouter(prefix="/sales", tags=["Sales"])


@router.post("", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
def record_sale(
    payload: SaleCreate,
    db: Session = Depends(get_db),
) -> SaleResponse:
    """Record counter sale, deduct product stock, and create audit transactions."""
    sale = SaleService.create_sale(db, payload)
    return SaleResponse.model_validate(sale)


@router.get("", response_model=PaginatedResponse[SaleResponse])
def get_sales(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> PaginatedResponse[SaleResponse]:
    """Retrieve historical counter sales invoices."""
    items, total, total_pages = SaleService.get_sales(db, page, page_size)
    return PaginatedResponse[SaleResponse](
        items=[SaleResponse.model_validate(s) for s in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
) -> SaleResponse:
    """Retrieve sale invoice with itemized line items."""
    sale = SaleService.get_sale_by_id(db, sale_id)
    return SaleResponse.model_validate(sale)
