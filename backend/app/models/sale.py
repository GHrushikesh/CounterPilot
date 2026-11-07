from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    DateTime,
    ForeignKey,
    CheckConstraint,
    func,
)
from sqlalchemy.orm import relationship
from app.database.session import Base


class PaymentMethod(str, Enum):
    CASH = "CASH"
    UPI = "UPI"
    CARD = "CARD"
    KHATA = "KHATA"


class SaleStatus(str, Enum):
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    idempotency_key = Column(String(100), unique=True, index=True, nullable=True)
    
    subtotal = Column(Numeric(precision=10, scale=2, asdecimal=True), nullable=False)
    discount_amount = Column(Numeric(precision=10, scale=2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    tax_amount = Column(Numeric(precision=10, scale=2, asdecimal=True), nullable=False, default=Decimal("0.00"))
    total_amount = Column(Numeric(precision=10, scale=2, asdecimal=True), nullable=False)
    
    payment_method = Column(String(20), nullable=False, default=PaymentMethod.CASH.value)
    customer_name = Column(String(100), nullable=True)
    customer_phone = Column(String(20), nullable=True)
    status = Column(String(20), nullable=False, default=SaleStatus.COMPLETED.value)
    
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        index=True,
    )

    items = relationship(
        "SaleItem",
        back_populates="sale",
        cascade="all, delete-orphan",
        passive_deletes=False,
    )

    __table_args__ = (
        CheckConstraint("subtotal >= 0", name="ck_sale_subtotal_positive"),
        CheckConstraint("discount_amount >= 0", name="ck_sale_discount_positive"),
        CheckConstraint("total_amount >= 0", name="ck_sale_total_positive"),
        CheckConstraint("payment_method IN ('CASH', 'UPI', 'CARD', 'KHATA')", name="ck_sale_valid_payment"),
        CheckConstraint("status IN ('COMPLETED', 'CANCELLED')", name="ck_sale_valid_status"),
    )

    def __repr__(self):
        return f"<Sale(id={self.id}, inv='{self.invoice_number}', total={self.total_amount})>"


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sale_id = Column(
        Integer,
        ForeignKey("sales.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id = Column(
        Integer,
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    product_name = Column(String(255), nullable=False)
    unit_price = Column(Numeric(precision=10, scale=2, asdecimal=True), nullable=False)
    purchase_price_snapshot = Column(Numeric(precision=10, scale=2, asdecimal=True), nullable=True)
    purchase_price_snapshot = Column(Numeric(precision=10, scale=2, asdecimal=True), nullable=True)
    quantity = Column(Numeric(precision=10, scale=2, asdecimal=True), nullable=False)
    total_price = Column(Numeric(precision=10, scale=2, asdecimal=True), nullable=False)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product")

    __table_args__ = (
        CheckConstraint("unit_price >= 0", name="ck_sale_item_price_positive"),
        CheckConstraint("purchase_price_snapshot IS NULL OR purchase_price_snapshot >= 0", name="ck_sale_item_purchase_snapshot_positive"),
        CheckConstraint("purchase_price_snapshot IS NULL OR purchase_price_snapshot >= 0", name="ck_sale_item_purchase_snapshot_positive"),
        CheckConstraint("quantity > 0", name="ck_sale_item_qty_positive"),
        CheckConstraint("total_price >= 0", name="ck_sale_item_total_positive"),
    )

    def __repr__(self):
        return f"<SaleItem(id={self.id}, sale_id={self.sale_id}, product='{self.product_name}', qty={self.quantity})>"
