from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class StoreSettingBase(BaseModel):
    shop_name: str = Field(default="CounterPilot Store", min_length=1, max_length=255)
    tagline: Optional[str] = Field(default="Retail Operating Counter", max_length=255)
    address: Optional[str] = Field(default="", max_length=500)
    phone: Optional[str] = Field(default="", max_length=50)
    gstin: Optional[str] = Field(default="Unregistered Retailer", max_length=50)
    currency: str = Field(default="INR", max_length=10)
    currency_symbol: str = Field(default="₹", max_length=5)


class StoreSettingUpdate(BaseModel):
    shop_name: Optional[str] = Field(None, min_length=1, max_length=255)
    tagline: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = Field(None, max_length=500)
    phone: Optional[str] = Field(None, max_length=50)
    gstin: Optional[str] = Field(None, max_length=50)
    currency: Optional[str] = Field(None, max_length=10)
    currency_symbol: Optional[str] = Field(None, max_length=5)


class StoreSettingResponse(StoreSettingBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

