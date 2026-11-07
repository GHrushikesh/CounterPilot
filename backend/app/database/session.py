from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)

# Enable Foreign Key enforcement in SQLite
if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(Engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency for providing a transactional database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Safely initialize all database tables and schema migrations."""
    # Import all models to ensure they are registered with Base.metadata
    from app.models.product import Product  # noqa: F401
    from app.models.inventory_transaction import InventoryTransaction  # noqa: F401
    from app.models.sale import Sale, SaleItem  # noqa: F401
    from app.models.idempotency import IdempotencyRecord  # noqa: F401
    from app.models.invoice_sequence import DailyInvoiceSequence  # noqa: F401

    Base.metadata.create_all(bind=engine)

    # Non-destructive SQLite column migration for sales table
    with engine.connect() as conn:
        cursor = conn.exec_driver_sql("PRAGMA table_info(sales)")
        cols = [r[1] for r in cursor.fetchall()]
        if cols and "idempotency_key" not in cols:
            conn.exec_driver_sql("ALTER TABLE sales ADD COLUMN idempotency_key VARCHAR(100)")
            conn.commit()

        cursor = conn.exec_driver_sql("PRAGMA table_info(sale_items)")
        sale_item_cols = [r[1] for r in cursor.fetchall()]
        if sale_item_cols and "purchase_price_snapshot" not in sale_item_cols:
            conn.exec_driver_sql("ALTER TABLE sale_items ADD COLUMN purchase_price_snapshot NUMERIC(10, 2)")
            conn.commit()

