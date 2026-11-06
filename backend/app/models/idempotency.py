from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    func,
)
from sqlalchemy.orm import relationship
from app.database.session import Base


class IdempotencyRecord(Base):
    __tablename__ = "idempotency_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    request_hash = Column(String(64), nullable=False)
    sale_id = Column(
        Integer,
        ForeignKey("sales.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )

    sale = relationship("Sale", backref="idempotency_records")

    def __repr__(self):
        return f"<IdempotencyRecord(key='{self.key}', sale_id={self.sale_id})>"
