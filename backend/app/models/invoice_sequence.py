from sqlalchemy import Column, String, Integer
from app.database.session import Base


class DailyInvoiceSequence(Base):
    __tablename__ = "daily_invoice_sequences"

    date_str = Column(String(8), primary_key=True)  # Format: YYYYMMDD, e.g. "20261106"
    last_sequence = Column(Integer, nullable=False, default=0)

    def __repr__(self):
        return f"<DailyInvoiceSequence(date='{self.date_str}', last_sequence={self.last_sequence})>"
