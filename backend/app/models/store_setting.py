from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, func
from app.database.session import Base


class StoreSetting(Base):
    __tablename__ = "store_settings"

    id = Column(Integer, primary_key=True, index=True)
    shop_name = Column(String(255), nullable=False, default="CounterPilot Store")
    tagline = Column(String(255), nullable=True, default="Retail Operating Counter")
    address = Column(String(500), nullable=True, default="")
    phone = Column(String(50), nullable=True, default="")
    gstin = Column(String(50), nullable=True, default="Unregistered Retailer")
    currency = Column(String(10), nullable=False, default="INR")
    currency_symbol = Column(String(5), nullable=False, default="₹")
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

