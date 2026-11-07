from sqlalchemy.orm import Session
from app.models.store_setting import StoreSetting
from app.schemas.store_setting import StoreSettingUpdate, StoreSettingResponse


class StoreSettingService:
    @staticmethod
    def get_or_create_setting(db: Session) -> StoreSetting:
        """Retrieves active store setting or initializes default if absent."""
        setting = db.query(StoreSetting).first()
        if not setting:
            setting = StoreSetting(
                shop_name="CounterPilot Store",
                tagline="Provisions & Retail Store",
                address="Main Market Road",
                phone="",
                gstin="Unregistered Retailer",
                currency="INR",
                currency_symbol="₹",
            )
            db.add(setting)
            db.commit()
            db.refresh(setting)
        return setting

    @staticmethod
    def update_setting(db: Session, payload: StoreSettingUpdate) -> StoreSettingResponse:
        """Updates store profile details."""
        setting = StoreSettingService.get_or_create_setting(db)

        if payload.shop_name is not None and payload.shop_name.strip():
            setting.shop_name = payload.shop_name.strip()
        if payload.tagline is not None:
            setting.tagline = payload.tagline.strip()
        if payload.address is not None:
            setting.address = payload.address.strip()
        if payload.phone is not None:
            setting.phone = payload.phone.strip()
        if payload.gstin is not None:
            setting.gstin = payload.gstin.strip()
        if payload.currency is not None:
            setting.currency = payload.currency.strip()
        if payload.currency_symbol is not None:
            setting.currency_symbol = payload.currency_symbol.strip()

        db.commit()
        db.refresh(setting)
        return StoreSettingResponse.model_validate(setting)

    @staticmethod
    def get_shop_name(db: Session) -> str:
        """Fast helper to retrieve the shop name."""
        setting = db.query(StoreSetting.shop_name).first()
        return setting[0] if setting and setting[0] else "CounterPilot Store"

