from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.product import ProductResponse, ProductCreate, ProductUpdate, ProductRestock
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=PaginatedResponse[ProductResponse])
def get_products(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by product name, SKU, or category"),
    category: Optional[str] = Query(None, description="Filter by category"),
    low_stock: Optional[bool] = Query(None, description="Filter items at or below minimum stock threshold"),
    db: Session = Depends(get_db),
) -> PaginatedResponse[ProductResponse]:
    """Retrieve products with search, filtering, and pagination."""
    items, total, total_pages = ProductService.get_products(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        category=category,
        low_stock_only=low_stock,
    )
    return PaginatedResponse[ProductResponse](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/summary", response_model=Dict[str, Any])
def get_product_summary(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Retrieve inventory summary metrics for dashboard cards."""
    return ProductService.get_summary_metrics(db)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)) -> ProductResponse:
    """Retrieve a single product by ID."""
    product = ProductService.get_product_by_id(db, product_id)
    return ProductResponse.from_orm_product(product)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
) -> ProductResponse:
    """Create a new product with inventory audit logging."""
    return ProductService.create_product(db, payload)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
) -> ProductResponse:
    """Update an existing product's prices, name, or thresholds."""
    return ProductService.update_product(db, product_id, payload)


@router.post("/{product_id}/restock", response_model=ProductResponse)
def restock_product(
    product_id: int,
    payload: ProductRestock,
    db: Session = Depends(get_db),
) -> ProductResponse:
    """Refill stock for a product and automatically log an audit transaction."""
    return ProductService.restock_product(db, product_id, payload.quantity, payload.note)


@router.delete("/{product_id}", status_code=status.HTTP_200_OK)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Deactivate / remove a product from inventory."""
    ProductService.delete_product(db, product_id)
    return {"success": True, "message": f"Product {product_id} deactivated successfully"}

