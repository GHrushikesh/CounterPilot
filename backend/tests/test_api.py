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


def test_multiline_checkout_failure_atomicity(client, seeded_db):
    """Verify that failure on any order line completely rolls back all stock deductions."""
    colgate = seeded_db.query(Product).filter(Product.sku == "COLG-ST-200G").first()
    atta = seeded_db.query(Product).filter(Product.sku == "AASH-ATTA-5KG").first()

    colgate_stock_initial = colgate.current_stock
    atta_stock_initial = atta.current_stock

    payload = {
        "items": [
            {"product_id": colgate.id, "quantity": 2.0},  # Valid quantity (stock is 18)
            {"product_id": atta.id, "quantity": 999.0},  # Exceeds available stock (stock is 3)
        ],
        "payment_method": "CASH",
    }
    response = client.post("/api/sales", json=payload)
    assert response.status_code == 400
    assert "Insufficient stock" in response.json()["message"]

    # Verify no stock was deducted from colgate despite being first in line
    seeded_db.refresh(colgate)
    seeded_db.refresh(atta)
    assert colgate.current_stock == colgate_stock_initial
    assert atta.current_stock == atta_stock_initial


def test_discount_greater_than_subtotal_clamping(client, seeded_db):
    """Verify discount larger than subtotal is clamped and total payable is 0 without DB constraint error."""
    parle = seeded_db.query(Product).filter(Product.sku == "PARLE-G-250G").first()
    initial_stock = parle.current_stock

    payload = {
        "items": [{"product_id": parle.id, "quantity": 1.0}],  # Selling price is 30.00
        "discount_amount": 100.0,  # Exceeds subtotal (30.00)
        "payment_method": "CASH",
    }
    response = client.post("/api/sales", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert Decimal(str(data["subtotal"])) == Decimal("30.00")
    assert Decimal(str(data["discount_amount"])) == Decimal("30.00")
    assert Decimal(str(data["total_amount"])) == Decimal("0.00")

    seeded_db.refresh(parle)
    assert parle.current_stock == initial_stock - Decimal("1.00")


def test_inactive_product_rejection(client, seeded_db):
    """Verify inactive/soft-deleted product cannot be purchased."""
    product = seeded_db.query(Product).first()
    product.is_active = False
    seeded_db.commit()

    payload = {
        "items": [{"product_id": product.id, "quantity": 1.0}],
        "payment_method": "CASH",
    }
    response = client.post("/api/sales", json=payload)
    assert response.status_code == 404
    assert "inactive" in response.json()["message"].lower()


def test_invalid_payment_method_rejection(client, seeded_db):
    """Verify rejection of unlisted payment methods with HTTP 400."""
    product = seeded_db.query(Product).first()
    payload = {
        "items": [{"product_id": product.id, "quantity": 1.0}],
        "payment_method": "BITCOIN",
    }
    response = client.post("/api/sales", json=payload)
    assert response.status_code == 400
    assert "Invalid payment method" in response.json()["message"]


def test_duplicate_checkout_same_idempotency_key(client, seeded_db):
    """Verify duplicate checkout with same key and payload returns existing sale without double stock deduction."""
    product = seeded_db.query(Product).filter(Product.sku == "TATA-SALT-1KG").first()
    initial_stock = product.current_stock

    payload = {
        "items": [{"product_id": product.id, "quantity": 2.0}],
        "payment_method": "CASH",
        "customer_name": "Idempotent User",
        "idempotency_key": "IDEM-TEST-KEY-001",
    }

    # First request
    res1 = client.post("/api/sales", json=payload)
    assert res1.status_code == 201
    data1 = res1.json()
    invoice1 = data1["invoice_number"]

    seeded_db.refresh(product)
    assert product.current_stock == initial_stock - Decimal("2.00")

    # Second request with identical idempotency key and payload
    res2 = client.post("/api/sales", json=payload)
    assert res2.status_code in [200, 201]
    data2 = res2.json()
    assert data2["invoice_number"] == invoice1
    assert data2["id"] == data1["id"]

    # Stock MUST NOT be deducted a second time
    seeded_db.refresh(product)
    assert product.current_stock == initial_stock - Decimal("2.00")


def test_same_idempotency_key_different_payload_conflict(client, seeded_db):
    """Verify reusing same idempotency key with different payload returns HTTP 409 Conflict."""
    p1 = seeded_db.query(Product).filter(Product.sku == "TATA-SALT-1KG").first()
    p2 = seeded_db.query(Product).filter(Product.sku == "MAGGI-MAS-70G").first()

    payload1 = {
        "items": [{"product_id": p1.id, "quantity": 1.0}],
        "payment_method": "CASH",
        "idempotency_key": "IDEM-CONFLICT-KEY-002",
    }
    res1 = client.post("/api/sales", json=payload1)
    assert res1.status_code == 201

    # Same key but completely different product/payload
    payload2 = {
        "items": [{"product_id": p2.id, "quantity": 2.0}],
        "payment_method": "UPI",
        "idempotency_key": "IDEM-CONFLICT-KEY-002",
    }
    res2 = client.post("/api/sales", json=payload2)
    assert res2.status_code == 409
    assert res2.json()["error_code"] == "CONFLICT"


def test_different_idempotency_keys_create_independent_sales(client, seeded_db):
    """Verify two different checkout keys create two independent sales."""
    product = seeded_db.query(Product).filter(Product.sku == "DETT-SOAP-125G").first()
    initial_stock = product.current_stock

    payload1 = {
        "items": [{"product_id": product.id, "quantity": 1.0}],
        "payment_method": "CASH",
        "idempotency_key": "KEY-ALPHA-001",
    }
    payload2 = {
        "items": [{"product_id": product.id, "quantity": 1.0}],
        "payment_method": "CASH",
        "idempotency_key": "KEY-BETA-002",
    }

    res1 = client.post("/api/sales", json=payload1)
    res2 = client.post("/api/sales", json=payload2)

    assert res1.status_code == 201
    assert res2.status_code == 201
    assert res1.json()["invoice_number"] != res2.json()["invoice_number"]

    seeded_db.refresh(product)
    assert product.current_stock == initial_stock - Decimal("2.00")


def test_invoice_number_uniqueness_and_progression(client, seeded_db):
    """Verify sequential invoice number generation and uniqueness."""
    product = seeded_db.query(Product).filter(Product.sku == "FORT-OIL-1L").first()
    invoices = []

    for i in range(3):
        payload = {
            "items": [{"product_id": product.id, "quantity": 1.0}],
            "payment_method": "CASH",
            "idempotency_key": f"KEY-SEQ-{i}",
        }
        res = client.post("/api/sales", json=payload)
        assert res.status_code == 201
        invoices.append(res.json()["invoice_number"])

    assert len(invoices) == 3
    assert len(set(invoices)) == 3
    # Check format INV-YYYYMMDD-XXXX
    for inv in invoices:
        assert inv.startswith("INV-")
        assert len(inv.split("-")[-1]) == 4



