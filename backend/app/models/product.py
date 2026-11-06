from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    Boolean,
    DateTime,
    CheckConstraint,
    func,
)
from sqlalchemy.orm import relationship
from app.database.session import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    sku = Column(String(100), unique=True, index=True, nullable=True)
    
    # Prices stored as Decimal-compatible Numeric(10, 2)
    selling_price = Column(Numeric(precision=10, scale=2, asdecimal=True), nullable=False)
    purchase_price = Column(Numeric(precision=10, scale=2, asdecimal=True), nullable=False)
    
    # Stock quantities stored as Decimal-compatible Numeric(10, 2)
    current_stock = Column(Numeric(precision=10, scale=2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    minimum_stock = Column(Numeric(precision=10, scale=2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    
    unit = Column(String(50), nullable=False, default="pcs")
    
    # Soft deletion flag to preserve historical records and transactions
    is_active = Column(Boolean, nullable=False, default=True)
    
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )

    # Relationships - RESTRICT on delete prevents destruction of historical records
    transactions = relationship(
        "InventoryTransaction",
        back_populates="product",
        passive_deletes=False,
    )

    __table_args__ = (
        CheckConstraint("selling_price >= 0", name="ck_product_selling_price_non_negative"),
        CheckConstraint("purchase_price >= 0", name="ck_product_purchase_price_non_negative"),
        CheckConstraint("current_stock >= 0", name="ck_product_current_stock_non_negative"),
        CheckConstraint("minimum_stock >= 0", name="ck_product_minimum_stock_non_negative"),
    )

    def __repr__(self):
        return f"<Product(id={self.id}, name='{self.name}', sku='{self.sku}', stock={self.current_stock})>"
