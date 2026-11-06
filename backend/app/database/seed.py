import logging
from decimal import Decimal
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.inventory_transaction import InventoryTransaction, TransactionType

logger = logging.getLogger(__name__)

INITIAL_PRODUCTS: List[Dict[str, Any]] = [
    {
        "name": "Surf Excel Easy Wash Detergent Powder 1kg",
        "category": "Household Cleaning",
        "sku": "SURF-EW-1KG",
        "purchase_price": Decimal("115.00"),
        "selling_price": Decimal("140.00"),
        "current_stock": Decimal("24.00"),
        "minimum_stock": Decimal("8.00"),
        "unit": "packet",
    },
    {
        "name": "Amul Pasteurised Butter 100g",
        "category": "Dairy & Refrigerated",
        "sku": "AMUL-BUT-100G",
        "purchase_price": Decimal("49.00"),
        "selling_price": Decimal("56.00"),
        "current_stock": Decimal("5.00"),
        "minimum_stock": Decimal("10.00"),
        "unit": "packet",
    },
    {
        "name": "Tata Salt Vacuum Evaporated Iodised 1kg",
        "category": "Grocery & Staples",
        "sku": "TATA-SALT-1KG",
        "purchase_price": Decimal("22.00"),
        "selling_price": Decimal("28.00"),
        "current_stock": Decimal("45.00"),
        "minimum_stock": Decimal("15.00"),
        "unit": "packet",
    },
    {
        "name": "Parle-G Gold Glucose Biscuits 250g",
        "category": "Snacks & Biscuits",
        "sku": "PARLE-G-250G",
        "purchase_price": Decimal("24.00"),
        "selling_price": Decimal("30.00"),
        "current_stock": Decimal("40.00"),
        "minimum_stock": Decimal("12.00"),
        "unit": "packet",
    },
    {
        "name": "Maggi 2-Minute Masala Instant Noodles 70g",
        "category": "Instant Foods",
        "sku": "MAGGI-MAS-70G",
        "purchase_price": Decimal("11.50"),
        "selling_price": Decimal("14.00"),
        "current_stock": Decimal("4.00"),
        "minimum_stock": Decimal("20.00"),
        "unit": "packet",
    },
    {
        "name": "Colgate Strong Teeth Dental Cream Toothpaste 200g",
        "category": "Personal Care",
        "sku": "COLG-ST-200G",
        "purchase_price": Decimal("95.00"),
        "selling_price": Decimal("120.00"),
        "current_stock": Decimal("18.00"),
        "minimum_stock": Decimal("6.00"),
        "unit": "pcs",
    },
    {
        "name": "Dettol Original Germ Protection Bathing Soap 125g",
        "category": "Personal Care",
        "sku": "DETT-SOAP-125G",
        "purchase_price": Decimal("36.00"),
        "selling_price": Decimal("46.00"),
        "current_stock": Decimal("32.00"),
        "minimum_stock": Decimal("10.00"),
        "unit": "pcs",
    },
    {
        "name": "Fortune Sunlite Refined Sunflower Oil 1L",
        "category": "Edible Oils",
        "sku": "FORT-OIL-1L",
        "purchase_price": Decimal("128.00"),
        "selling_price": Decimal("155.00"),
        "current_stock": Decimal("16.00"),
        "minimum_stock": Decimal("8.00"),
        "unit": "bottle",
    },
    {
        "name": "Aashirvaad Superior MP Whole Wheat Atta 5kg",
        "category": "Grocery & Staples",
        "sku": "AASH-ATTA-5KG",
        "purchase_price": Decimal("235.00"),
        "selling_price": Decimal("280.00"),
        "current_stock": Decimal("3.00"),
        "minimum_stock": Decimal("8.00"),
        "unit": "bag",
    },
    {
        "name": "Britannia Good Day Rich Butter Cookies 100g",
        "category": "Snacks & Biscuits",
        "sku": "BRIT-GD-100G",
        "purchase_price": Decimal("16.50"),
        "selling_price": Decimal("20.00"),
        "current_stock": Decimal("35.00"),
        "minimum_stock": Decimal("12.00"),
        "unit": "packet",
    },
]


def seed_database(db: Session) -> Dict[str, int]:
    """
    Idempotently seeds foundational retail product catalog.
    Will not create duplicates if run multiple times.
    """
    created_count = 0
    existing_count = 0

    for item in INITIAL_PRODUCTS:
        existing = db.query(Product).filter(Product.sku == item["sku"]).first()
        if existing:
            existing_count += 1
            continue

        product = Product(
            name=item["name"],
            category=item["category"],
            sku=item["sku"],
            purchase_price=item["purchase_price"],
            selling_price=item["selling_price"],
            current_stock=item["current_stock"],
            minimum_stock=item["minimum_stock"],
            unit=item["unit"],
            is_active=True,
        )
        db.add(product)
        db.flush()

        # Audit initial stock in transactions table
        if product.current_stock > 0:
            tx = InventoryTransaction(
                product_id=product.id,
                transaction_type=TransactionType.INITIAL_STOCK.value,
                quantity=product.current_stock,
                previous_stock=Decimal("0.00"),
                new_stock=product.current_stock,
                note="Initial stock migration during system setup",
            )
            db.add(tx)

        created_count += 1

    db.commit()
    logger.info(f"Database seeded: {created_count} products created, {existing_count} already existed.")
    return {"created": created_count, "existing": existing_count}


if __name__ == "__main__":
    from app.database.session import SessionLocal, init_db
    init_db()
    with SessionLocal() as db_session:
        res = seed_database(db_session)
        print(f"Seed completed: {res}")

