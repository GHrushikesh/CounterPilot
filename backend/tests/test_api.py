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
