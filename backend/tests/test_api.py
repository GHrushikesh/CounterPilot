from decimal import Decimal
import pytest
from sqlalchemy.exc import IntegrityError
from app.models.product import Product
from app.models.inventory_transaction import InventoryTransaction, TransactionType
from app.database.seed import seed_database


def test_health_check(client):
    """Verify GET /api/health endpoint returns expected format."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["application"] == "CounterPilot"


def test_seed_database_idempotency(db_session):
    """Verify that seeding multiple times does not produce duplicate products."""
    first_run = seed_database(db_session)
    assert first_run["created"] == 10
    assert first_run["existing"] == 0

    count_after_first = db_session.query(Product).count()
    assert count_after_first == 10

    # Second run must report all existing, 0 created
    second_run = seed_database(db_session)
    assert second_run["created"] == 0
    assert second_run["existing"] == 10

    count_after_second = db_session.query(Product).count()
    assert count_after_second == 10


def test_get_products_list(client, seeded_db):
    """Verify GET /api/products returns paginated sample products."""
    response = client.get("/api/products?page=1&page_size=5")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 10
    assert len(data["items"]) == 5
    assert data["page"] == 1
    assert data["page_size"] == 5
    assert data["total_pages"] == 2

    first_item = data["items"][0]
    assert "name" in first_item
    assert "selling_price" in first_item
    assert "purchase_price" in first_item
    assert "current_stock" in first_item
    assert "unit" in first_item
    assert "is_low_stock" in first_item


def test_get_products_filter_low_stock(client, seeded_db):
    """Verify filtering products by low_stock=true."""
    response = client.get("/api/products?low_stock=true")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    for item in data["items"]:
        assert Decimal(str(item["current_stock"])) <= Decimal(str(item["minimum_stock"]))
        assert item["is_low_stock"] is True


def test_get_products_search(client, seeded_db):
    """Verify searching products by name or SKU."""
    response = client.get("/api/products?search=Maggi")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any("Maggi" in item["name"] for item in data["items"])


def test_product_summary_metrics(client, seeded_db):
    """Verify GET /api/products/summary returns foundational metrics."""
    response = client.get("/api/products/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_products"] == 10
    assert data["low_stock_count"] >= 1
    assert data["categories_count"] >= 1


def test_product_price_and_stock_validation(client, db_session):
    """Verify Pydantic rejection on negative prices and stocks."""
    # Negative selling price
    payload = {
        "name": "Invalid Product",
        "category": "General",
        "selling_price": -10.0,
        "purchase_price": 5.0,
        "current_stock": 10.0,
        "minimum_stock": 2.0,
        "unit": "pcs",
    }
    response = client.post("/api/products", json=payload)
    assert response.status_code == 422

    # Negative stock
    payload["selling_price"] = 10.0
    payload["current_stock"] = -5.0
    response = client.post("/api/products", json=payload)
    assert response.status_code == 422


def test_product_database_constraints(db_session):
    """Verify SQLite CHECK constraints reject negative stock at SQL level."""
    product = Product(
        name="DB Check Test",
        category="General",
        selling_price=Decimal("10.00"),
        purchase_price=Decimal("5.00"),
        current_stock=Decimal("-1.00"),  # Violates ck_product_current_stock_non_negative
        minimum_stock=Decimal("0.00"),
        unit="pcs",
    )
    db_session.add(product)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_product_deletion_restricted_with_transactions(db_session):
    """Verify foreign key constraint on InventoryTransaction restricts accidental product deletion."""
    product = Product(
        name="Test Audit Item",
        category="Test",
        sku="TEST-AUDIT-1",
        selling_price=Decimal("10.00"),
        purchase_price=Decimal("8.00"),
        current_stock=Decimal("5.00"),
        minimum_stock=Decimal("2.00"),
        unit="pcs",
    )
    db_session.add(product)
    db_session.flush()

    tx = InventoryTransaction(
        product_id=product.id,
        transaction_type=TransactionType.INITIAL_STOCK.value,
        quantity=Decimal("5.00"),
        previous_stock=Decimal("0.00"),
        new_stock=Decimal("5.00"),
    )
    db_session.add(tx)
    db_session.commit()

    # Attempt hard deletion of product: must fail because ondelete="RESTRICT"
    db_session.delete(product)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_record_sale_and_inventory_deduction(client, seeded_db):
    """Verify recording counter sale deducts stock and logs inventory audit transaction."""
    # Find a product: Colgate Strong Teeth (Stock: 18.00)
    colgate = seeded_db.query(Product).filter(Product.sku == "COLG-ST-200G").first()
    assert colgate.current_stock == Decimal("18.00")

    payload = {
        "items": [
            {"product_id": colgate.id, "quantity": 3.0}
        ],
        "discount_amount": 10.0,
        "payment_method": "UPI",
        "customer_name": "Ramesh Kumar",
        "customer_phone": "9876543210",
    }

    response = client.post("/api/sales", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["invoice_number"].startswith("INV-")
    assert data["payment_method"] == "UPI"
    assert data["customer_name"] == "Ramesh Kumar"
    # 3 * 120.00 = 360.00, discount 10.00 => total 350.00
    assert Decimal(str(data["subtotal"])) == Decimal("360.00")
    assert Decimal(str(data["total_amount"])) == Decimal("350.00")

    # Check stock decreased from 18 to 15
    seeded_db.refresh(colgate)
    assert colgate.current_stock == Decimal("15.00")

    # Check InventoryTransaction exists
    tx = (
        seeded_db.query(InventoryTransaction)
        .filter(InventoryTransaction.product_id == colgate.id, InventoryTransaction.transaction_type == "SALE")
        .first()
    )
    assert tx is not None
    assert tx.quantity == Decimal("3.00")
    assert tx.previous_stock == Decimal("18.00")
    assert tx.new_stock == Decimal("15.00")
    assert "Counter sale invoice" in tx.note


def test_record_sale_insufficient_stock(client, seeded_db):
    """Verify sale is rejected if requested quantity exceeds current stock."""
    # Aashirvaad Atta has 3 bags in stock
    atta = seeded_db.query(Product).filter(Product.sku == "AASH-ATTA-5KG").first()
    assert atta.current_stock == Decimal("3.00")

    payload = {
        "items": [
            {"product_id": atta.id, "quantity": 10.0}
        ],
        "payment_method": "CASH",
    }
    response = client.post("/api/sales", json=payload)
    assert response.status_code == 400
    err = response.json()
    assert "Insufficient stock" in err["message"]

    # Stock must remain unchanged
    seeded_db.refresh(atta)
    assert atta.current_stock == Decimal("3.00")


def test_get_transactions_audit_log(client, seeded_db):
    """Verify GET /api/transactions returns audit trail."""
    response = client.get("/api/transactions")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 10
    first = data["items"][0]
    assert "product_name" in first
    assert "transaction_type" in first
    assert "previous_stock" in first
    assert "new_stock" in first


