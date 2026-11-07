import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from app.models.product import Product
from app.models.inventory_transaction import InventoryTransaction


# ==============================================================================
# 1. SQL INJECTION (SQLi) RESISTANCE TESTS
# ==============================================================================

def test_sqli_in_product_search(client: TestClient, seeded_db):
    """
    Test that malicious SQL injection payloads in search queries do not alter SQL syntax
    or leak unauthorized data.
    """
    malicious_searches = [
        "' OR '1'='1",
        "'; DROP TABLE products; --",
        "admin' --",
        "' UNION SELECT 1, 'injected', 'cat', 'sku', 10, 10, 10, 10, 'pcs', 1, datetime('now'), datetime('now') --",
        "1; WAITFOR DELAY '0:0:5'--",
    ]

    for payload in malicious_searches:
        res = client.get("/api/products", params={"search": payload})
        assert res.status_code == 200, f"Failed on payload: {payload}"
        data = res.json()
        assert "items" in data
        assert isinstance(data["items"], list)

    # Verify table integrity: products table must NOT be dropped or damaged
    res_clean = client.get("/api/products")
    assert res_clean.status_code == 200
    assert res_clean.json()["total"] >= 10


def test_sqli_in_category_filter(client: TestClient, seeded_db):
    """Test that SQL injection in category parameter is safely treated as a literal."""
    payload = "' OR 1=1 --"
    res = client.get("/api/products", params={"category": payload})
    assert res.status_code == 200
    # Should safely return 0 items because no category has this literal string
    assert len(res.json()["items"]) == 0


def test_sqli_in_product_id_parameter(client: TestClient, seeded_db):
    """Test that non-integer SQL injection in route ID is rejected by FastAPI validation."""
    malicious_id = "1 OR 1=1"
    res = client.get(f"/api/products/{malicious_id}")
    assert res.status_code == 422
    assert res.json()["status"] == "error"
    assert res.json()["error_code"] == "VALIDATION_ERROR"


# ==============================================================================
# 2. CROSS-SITE SCRIPTING (XSS) INPUT SAFETY
# ==============================================================================

def test_xss_payload_in_product_creation(client: TestClient, db_session):
    """
    Test that HTML/JavaScript injection in product fields is stored literally
    without executing or crashing the backend.
    """
    xss_payload = {
        "name": "<script>alert('XSS_ATTACK')</script>",
        "category": "<img src=x onerror=alert(1)>",
        "sku": "XSS-SKU-001",
        "selling_price": 50.00,
        "purchase_price": 30.00,
        "current_stock": 20.00,
        "minimum_stock": 5.00,
        "unit": "pcs",
    }

    res = client.post("/api/products", json=xss_payload)
    assert res.status_code == 201
    data = res.json()
    # It must be safely stored as literal text, not executed
    assert data["name"] == "<script>alert('XSS_ATTACK')</script>"
    assert data["category"] == "<img src=x onerror=alert(1)>"


# ==============================================================================
# 3. FINANCIAL INTEGRITY & PRICE MANIPULATION ATTACKS
# ==============================================================================

def test_negative_price_attack_rejected(client: TestClient, db_session):
    """Test that attempting to create a product with negative prices is strictly rejected."""
    payload = {
        "name": "Negative Price Exploit",
        "category": "Exploit",
        "selling_price": -100.00,
        "purchase_price": 50.00,
        "current_stock": 10.00,
        "minimum_stock": 2.00,
        "unit": "pcs",
    }
    res = client.post("/api/products", json=payload)
    assert res.status_code == 422
    assert res.json()["status"] == "error"


def test_negative_stock_attack_rejected(client: TestClient, db_session):
    """Test that attempting to create a product with negative initial stock is rejected."""
    payload = {
        "name": "Negative Stock Exploit",
        "category": "Exploit",
        "selling_price": 100.00,
        "purchase_price": 50.00,
        "current_stock": -50.00,
        "minimum_stock": 2.00,
        "unit": "pcs",
    }
    res = client.post("/api/products", json=payload)
    assert res.status_code == 422


def test_negative_restock_quantity_rejected(client: TestClient, seeded_db):
    """Test that attempting to restock with a negative or zero quantity is rejected."""
    # Product 1 exists in seeded_db
    res_neg = client.post("/api/products/1/restock", json={"quantity": -25.00})
    assert res_neg.status_code == 422

    res_zero = client.post("/api/products/1/restock", json={"quantity": 0.00})
    assert res_zero.status_code == 422


def test_negative_discount_attack_in_sales(client: TestClient, seeded_db):
    """Test that attempting to provide a negative discount (to manipulate total) is rejected."""
    payload = {
        "items": [{"product_id": 1, "quantity": 1}],
        "discount_amount": -50.00,
        "payment_method": "CASH",
    }
    res = client.post("/api/sales", json=payload)
    assert res.status_code == 422


# ==============================================================================
# 4. INVENTORY DEPLETION & RACE CONDITION DEFENSE
# ==============================================================================

def test_insufficient_stock_atomic_rollback(client: TestClient, seeded_db):
    """Test that attempting to purchase more stock than available triggers 400 rollback."""
    # Attempting to purchase 99999 units of product 1
    payload = {
        "items": [{"product_id": 1, "quantity": 99999}],
        "payment_method": "CASH",
    }
    res = client.post("/api/sales", json=payload)
    assert res.status_code == 400
    assert "insufficient" in res.json()["message"].lower()

    # Verify that product 1 stock was not touched
    prod_res = client.get("/api/products/1")
    assert prod_res.status_code == 200
    assert float(prod_res.json()["current_stock"]) > 0


def test_idempotency_key_replay_prevents_double_billing(client: TestClient, seeded_db):
    """Test that replaying an identical request with the same idempotency key returns cached sale."""
    payload = {
        "items": [{"product_id": 1, "quantity": 1}],
        "payment_method": "CASH",
        "idempotency_key": "sec-idem-test-9999",
    }

    # First request
    res1 = client.post("/api/sales", json=payload)
    assert res1.status_code == 201
    sale1_id = res1.json()["id"]

    # Replay request
    res2 = client.post("/api/sales", json=payload)
    assert res2.status_code in (200, 201)
    assert res2.json()["id"] == sale1_id

    # Verify inventory was only deducted ONCE
    tx_res = client.get(f"/api/transactions?product_id=1")
    assert tx_res.status_code == 200
    # There should only be 1 sale transaction for product 1
    sale_txs = [t for t in tx_res.json()["items"] if t["transaction_type"] == "SALE"]
    assert len(sale_txs) == 1


def test_idempotency_key_conflict_detection(client: TestClient, seeded_db):
    """Test that reusing an idempotency key with a DIFFERENT payload returns 409 Conflict."""
    payload1 = {
        "items": [{"product_id": 1, "quantity": 1}],
        "payment_method": "CASH",
        "idempotency_key": "sec-conflict-key-8888",
    }
    res1 = client.post("/api/sales", json=payload1)
    assert res1.status_code == 201

    payload2 = {
        "items": [{"product_id": 1, "quantity": 2}],  # Changed quantity
        "payment_method": "UPI",
        "idempotency_key": "sec-conflict-key-8888",  # Same key
    }
    res2 = client.post("/api/sales", json=payload2)
    assert res2.status_code == 409
    assert res2.json()["error_code"] == "CONFLICT"


# ==============================================================================
# 5. SECURITY HEADERS VERIFICATION
# ==============================================================================

def test_security_headers_present_on_responses(client: TestClient):
    """Test that all required security headers are injected on HTTP responses."""
    res = client.get("/api/health")
    assert res.status_code == 200

    headers = res.headers
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-XSS-Protection") == "1; mode=block"
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "geolocation=()" in headers.get("Permissions-Policy", "")
    assert headers.get("Server") == "CounterPilot-Secure"


# ==============================================================================
# 6. SENSITIVE DATA EXPOSURE PROTECTION
# ==============================================================================

def test_api_keys_never_leaked_in_settings(client: TestClient, seeded_db):
    """Test that GET /api/settings does not expose any internal API keys or secret credentials."""
    res = client.get("/api/settings")
    assert res.status_code == 200
    data = res.json()
    # Verify no secret fields exist in the response
    assert "api_key" not in data
    assert "bharatcode_api_key" not in data
    assert "secret" not in data


def test_internal_server_trace_not_leaked_on_404(client: TestClient):
    """Test that 404 responses return clean JSON without server file paths."""
    res = client.get("/api/non_existent_endpoint_xyz")
    assert res.status_code == 404
    data = res.json()
    assert "status" in data
    assert data["status"] == "error"
    # Ensure no local file paths (e.g. C:\ or /home/) are leaked
    msg = str(data)
    assert "C:\\" not in msg
    assert "Traceback" not in msg
