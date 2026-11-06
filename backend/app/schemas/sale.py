from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SaleItemCreate(BaseModel):
    product_id: int
    quantity: Decimal = Field(..., gt=Decimal("0.00"), description="Quantity to purchase")


class SaleCreate(BaseModel):
    items: List[SaleItemCreate] = Field(..., min_length=1, description="List of items in the sale")
    discount_amount: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"), description="Optional discount in INR")
    payment_method: str = Field(default="CASH", description="Payment method: CASH, UPI, CARD, KHATA")
    customer_name: Optional[str] = Field(None, max_length=100)
    customer_phone: Optional[str] = Field(None, max_length=20)


class SaleItemResponse(BaseModel):
    id: int
    sale_id: int
    product_id: int
    product_name: str
    unit_price: Decimal
    quantity: Decimal
    total_price: Decimal

    model_config = ConfigDict(from_attributes=True)


class SaleResponse(BaseModel):
    id: int
    invoice_number: str
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    payment_method: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    status: str
    created_at: datetime
    items: List[SaleItemResponse]

    model_config = ConfigDict(from_attributes=True)
