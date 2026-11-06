from decimal import Decimal
from math import ceil
from typing import Optional, Tuple, List, Dict, Any
from sqlalchemy import or_, func
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.inventory_transaction import InventoryTransaction, TransactionType
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.core.exceptions import NotFoundException, BadRequestException


class ProductService:
    @staticmethod
    def get_products(
        db: Session,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        category: Optional[str] = None,
        low_stock_only: Optional[bool] = None,
        include_inactive: bool = False,
    ) -> Tuple[List[ProductResponse], int, int]:
        """Query products with filtering, search, pagination, and low stock calculations."""
        query = db.query(Product)
        
        if not include_inactive:
            query = query.filter(Product.is_active == True)

        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Product.name.ilike(search_term),
                    Product.sku.ilike(search_term),
                    Product.category.ilike(search_term),
                )
            )

        if category:
            query = query.filter(Product.category == category.strip())

        if low_stock_only is True:
            query = query.filter(Product.current_stock <= Product.minimum_stock)

        total = query.count()
        total_pages = ceil(total / page_size) if total > 0 else 1

        offset = (page - 1) * page_size
        products = (
            query.order_by(Product.name.asc())
            .offset(offset)
            .limit(page_size)
            .all()
        )

        response_items = [ProductResponse.from_orm_product(p) for p in products]
        return response_items, total, total_pages

    @staticmethod
    def get_product_by_id(db: Session, product_id: int) -> Product:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise NotFoundException(f"Product with id {product_id} not found")
        return product

    @staticmethod
    def create_product(db: Session, data: ProductCreate) -> ProductResponse:
        # Check SKU uniqueness if provided
        if data.sku:
            existing = db.query(Product).filter(Product.sku == data.sku.strip()).first()
            if existing:
                raise BadRequestException(f"Product with SKU '{data.sku}' already exists")

        product = Product(
            name=data.name.strip(),
            category=data.category.strip(),
            sku=data.sku.strip() if data.sku else None,
            selling_price=data.selling_price,
            purchase_price=data.purchase_price,
            current_stock=data.current_stock,
            minimum_stock=data.minimum_stock,
            unit=data.unit.strip(),
            is_active=data.is_active,
        )
        db.add(product)
        db.flush()

        # If initial stock > 0, log an initial inventory transaction for auditability
        if product.current_stock > 0:
            tx = InventoryTransaction(
                product_id=product.id,
                transaction_type=TransactionType.INITIAL_STOCK.value,
                quantity=product.current_stock,
                previous_stock=Decimal("0.00"),
                new_stock=product.current_stock,
                note="Initial stock on product creation",
            )
            db.add(tx)

        db.commit()
        db.refresh(product)
        return ProductResponse.from_orm_product(product)

    @staticmethod
    def get_summary_metrics(db: Session) -> Dict[str, Any]:
        """Returns foundational metrics for dashboard summary."""
        total_products = db.query(Product).filter(Product.is_active == True).count()
        low_stock_count = (
            db.query(Product)
            .filter(Product.is_active == True, Product.current_stock <= Product.minimum_stock)
            .count()
        )
        categories_count = (
            db.query(func.count(func.distinct(Product.category)))
            .filter(Product.is_active == True)
            .scalar()
            or 0
        )
        return {
            "total_products": total_products,
            "low_stock_count": low_stock_count,
            "categories_count": categories_count,
        }

