from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    Text,
    DateTime,
    ForeignKey,
    CheckConstraint,
    func,
)
from sqlalchemy.orm import relationship
from app.database.session import Base


class TransactionType(str, Enum):
    INITIAL_STOCK = "INITIAL_STOCK"
    PURCHASE = "PURCHASE"
    SALE = "SALE"
    ADJUSTMENT = "ADJUSTMENT"
    RESTOCK = "RESTOCK"


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(
        Integer,
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    transaction_type = Column(String(50), nullable=False)
    quantity = Column(Numeric(precision=10, scale=2, asdecimal=True), nullable=False)
    previous_stock = Column(Numeric(precision=10, scale=2, asdecimal=True), nullable=False)
    new_stock = Column(Numeric(precision=10, scale=2, asdecimal=True), nullable=False)
    note = Column(Text, nullable=True)
    
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        index=True,
    )

    # Relationship to Product
    product = relationship("Product", back_populates="transactions")

    __table_args__ = (
        CheckConstraint(
            "transaction_type IN ('INITIAL_STOCK', 'PURCHASE', 'SALE', 'ADJUSTMENT', 'RESTOCK')",
            name="ck_inv_tx_valid_type",
        ),
        CheckConstraint("previous_stock >= 0", name="ck_inv_tx_prev_stock_non_negative"),
        CheckConstraint("new_stock >= 0", name="ck_inv_tx_new_stock_non_negative"),
    )

    def __repr__(self):
        return (
            f"<InventoryTransaction(id={self.id}, product_id={self.product_id}, "
            f"type='{self.transaction_type}', qty={self.quantity}, new_stock={self.new_stock})>"
        )
