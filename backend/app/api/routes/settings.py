from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.store_setting import StoreSettingResponse, StoreSettingUpdate
from app.services.store_setting_service import StoreSettingService

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("", response_model=StoreSettingResponse)
def get_store_settings(db: Session = Depends(get_db)) -> StoreSettingResponse:
    """Retrieve current store settings and profile."""
    setting = StoreSettingService.get_or_create_setting(db)
    return StoreSettingResponse.model_validate(setting)


@router.put("", response_model=StoreSettingResponse)
def update_store_settings(
    payload: StoreSettingUpdate,
    db: Session = Depends(get_db),
) -> StoreSettingResponse:
    """Update store settings, shop name, address, or tax details."""
    return StoreSettingService.update_setting(db, payload)

