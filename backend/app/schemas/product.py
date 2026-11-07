from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Product display name")
    category: str = Field(..., min_length=1, max_length=100, description="Product category")
    sku: Optional[str] = Field(None, max_length=100, description="Unique Stock Keeping Unit")
    selling_price: Decimal = Field(..., ge=Decimal("0.00"), description="Selling price (INR)")
    purchase_price: Decimal = Field(..., ge=Decimal("0.00"), description="Purchase / wholesale price (INR)")
    current_stock: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"), description="Current stock on hand")
    minimum_stock: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"), description="Low stock threshold alert")
    unit: str = Field(default="pcs", max_length=50, description="Unit of measurement (e.g. pcs, kg, packet)")
    is_active: bool = Field(default=True, description="Active status for soft-deletion")


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    sku: Optional[str] = Field(None, max_length=100)
    selling_price: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    purchase_price: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    current_stock: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    minimum_stock: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    unit: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


class ProductRestock(BaseModel):
    quantity: Decimal = Field(..., gt=Decimal("0.00"), description="Quantity to add to stock")
    note: Optional[str] = Field(default="Stock replenishment", max_length=255)


class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    is_low_stock: bool = False

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_product(cls, product) -> "ProductResponse":
        return cls(
            id=product.id,
            name=product.name,
            category=product.category,
            sku=product.sku,
            selling_price=product.selling_price,
            purchase_price=product.purchase_price,
            current_stock=product.current_stock,
            minimum_stock=product.minimum_stock,
            unit=product.unit,
            is_active=product.is_active,
            created_at=product.created_at,
            updated_at=product.updated_at,
            is_low_stock=product.current_stock <= product.minimum_stock,
        )


class InventoryTransactionResponse(BaseModel):
    id: int
    product_id: int
    transaction_type: str
    quantity: Decimal
    previous_stock: Decimal
    new_stock: Decimal
    note: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

