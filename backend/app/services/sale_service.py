import hashlib
import json
import logging
from datetime import datetime, timezone
from decimal import Decimal
from math import ceil
from typing import List, Tuple, Optional
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.inventory_transaction import InventoryTransaction, TransactionType
from app.models.sale import Sale, SaleItem, PaymentMethod, SaleStatus
from app.models.idempotency import IdempotencyRecord
from app.models.invoice_sequence import DailyInvoiceSequence
from app.schemas.sale import SaleCreate
from app.core.exceptions import NotFoundException, BadRequestException, ConflictException

logger = logging.getLogger(__name__)


def compute_payload_hash(data: SaleCreate) -> str:
    """Computes a deterministic SHA-256 hash of the checkout payload."""
    payload_dict = {
        "items": sorted(
            [{"product_id": item.product_id, "quantity": str(item.quantity)} for item in data.items],
            key=lambda x: x["product_id"],
        ),
        "discount_amount": str(data.discount_amount),
        "payment_method": data.payment_method.upper(),
        "customer_name": (data.customer_name or "").strip(),
        "customer_phone": (data.customer_phone or "").strip(),
    }
    payload_json = json.dumps(payload_dict, sort_keys=True)
    return hashlib.sha256(payload_json.encode("utf-8")).hexdigest()


class SaleService:
    @staticmethod
    def allocate_next_invoice_number(db: Session) -> str:
        """
        Concurrency-safe sequential daily invoice numbering strategy.
        Uses atomic UPSERT and sequence progression compatible with SQLite.
        Format: INV-YYYYMMDD-XXXX
        """
        now = datetime.now(timezone.utc)
        date_str = now.strftime("%Y%m%d")
        prefix = f"INV-{date_str}-"

        # Check if baseline row exists for today
        existing_seq = db.execute(
            text("SELECT last_sequence FROM daily_invoice_sequences WHERE date_str = :date_str"),
            {"date_str": date_str},
        ).fetchone()

        if existing_seq is None:
            # Baseline from max existing sale invoice for today if any
            max_sale = (
                db.query(Sale)
                .filter(Sale.invoice_number.like(f"{prefix}%"))
                .order_by(Sale.id.desc())
                .first()
            )
            baseline = 0
            if max_sale:
                try:
                    baseline = int(max_sale.invoice_number.split("-")[-1])
                except (ValueError, IndexError):
                    baseline = 0

            # Atomic insert with baseline if not already inserted
            db.execute(
                text(
                    "INSERT OR IGNORE INTO daily_invoice_sequences (date_str, last_sequence) "
                    "VALUES (:date_str, :baseline)"
                ),
                {"date_str": date_str, "baseline": baseline},
            )
            db.flush()

        # Atomic increment with RETURNING
        res = db.execute(
            text(
                "UPDATE daily_invoice_sequences "
                "SET last_sequence = last_sequence + 1 "
                "WHERE date_str = :date_str "
                "RETURNING last_sequence"
            ),
            {"date_str": date_str},
        ).fetchone()

        seq_num = res[0]
        return f"{prefix}{seq_num:04d}"

    @classmethod
    def create_sale(cls, db: Session, data: SaleCreate) -> Sale:
        if not data.items:
            raise BadRequestException("A sale must contain at least one product item.")

        valid_methods = [m.value for m in PaymentMethod]
        if data.payment_method.upper() not in valid_methods:
            raise BadRequestException(f"Invalid payment method. Allowed: {valid_methods}")

        # 1. Idempotency Check
        clean_key: Optional[str] = data.idempotency_key.strip() if data.idempotency_key else None
        payload_hash = compute_payload_hash(data)

        if clean_key:
            existing_record = (
                db.query(IdempotencyRecord)
                .filter(IdempotencyRecord.key == clean_key)
                .first()
            )
            if existing_record:
                # Same key and same payload: Return original sale (no duplicate stock deduction)
                if existing_record.request_hash == payload_hash:
                    return existing_record.sale
                # Reusing same key with different payload: HTTP 409 Conflict
                raise ConflictException("Idempotency key has already been used with a different checkout payload.")

        # 2. Concurrency-Safe Checkout Execution with Sequence Retry Defense
        max_attempts = 3
        for attempt in range(max_attempts):
            invoice_number = cls.allocate_next_invoice_number(db)
            subtotal = Decimal("0.00")
            sale_items: List[SaleItem] = []

            try:
                # Validate all products and stock availability before mutating
                for item_in in data.items:
                    product = db.query(Product).filter(Product.id == item_in.product_id).first()
                    if not product or not product.is_active:
                        raise NotFoundException(f"Product with ID {item_in.product_id} does not exist or is inactive.")

                    if product.current_stock < item_in.quantity:
                        raise BadRequestException(
                            f"Insufficient stock for '{product.name}'. Available: {product.current_stock} {product.unit}, Requested: {item_in.quantity} {product.unit}."
                        )

                    item_total = (product.selling_price * item_in.quantity).quantize(Decimal("0.01"))
                    subtotal += item_total

                    # Deduct stock and audit transaction
                    previous_stock = product.current_stock
                    new_stock = previous_stock - item_in.quantity
                    product.current_stock = new_stock

                    tx = InventoryTransaction(
                        product_id=product.id,
                        transaction_type=TransactionType.SALE.value,
                        quantity=item_in.quantity,
                        previous_stock=previous_stock,
                        new_stock=new_stock,
                        note=f"Counter sale invoice #{invoice_number}",
                    )
                    db.add(tx)

                    sale_item = SaleItem(
                        product_id=product.id,
                        product_name=product.name,
                        unit_price=product.selling_price,
                        quantity=item_in.quantity,
                        total_price=item_total,
                    )
                    sale_items.append(sale_item)

                discount = data.discount_amount.quantize(Decimal("0.01"))
                if discount > subtotal:
                    discount = subtotal

                total_amount = subtotal - discount

                sale = Sale(
                    invoice_number=invoice_number,
                    idempotency_key=clean_key,
                    subtotal=subtotal,
                    discount_amount=discount,
                    tax_amount=Decimal("0.00"),
                    total_amount=total_amount,
                    payment_method=data.payment_method.upper(),
                    customer_name=data.customer_name.strip() if data.customer_name else None,
                    customer_phone=data.customer_phone.strip() if data.customer_phone else None,
                    status=SaleStatus.COMPLETED.value,
                    items=sale_items,
                )
                db.add(sale)
                db.flush()

                # Atomically record idempotency tracking in same transaction
                if clean_key:
                    idempotency_rec = IdempotencyRecord(
                        key=clean_key,
                        request_hash=payload_hash,
                        sale_id=sale.id,
                    )
                    db.add(idempotency_rec)

                db.commit()
                db.refresh(sale)
                return sale

            except IntegrityError as e:
                db.rollback()
                err_str = str(e)
                # If concurrent request submitted identical idempotency key simultaneously:
                if clean_key and "idempotency_records" in err_str:
                    existing_rec = (
                        db.query(IdempotencyRecord)
                        .filter(IdempotencyRecord.key == clean_key)
                        .first()
                    )
                    if existing_rec:
                        if existing_rec.request_hash == payload_hash:
                            return existing_rec.sale
                        raise ConflictException("Idempotency key has already been used with a different checkout payload.")
                # If invoice number collided in rare race:
                if "invoice_number" in err_str and attempt < max_attempts - 1:
                    logger.warning(f"Invoice number collision on {invoice_number}, retrying sequence allocation...")
                    continue
                # Unhandled constraint violation
                raise BadRequestException(f"Database integrity constraint violated: {err_str}")

            except Exception:
                db.rollback()
                raise

        raise BadRequestException("Unable to assign a unique invoice number due to high concurrency. Please retry.")

    @staticmethod
    def get_sales(
        db: Session,
        page: int = 1,
        page_size: int = 10,
    ) -> Tuple[List[Sale], int, int]:
        query = db.query(Sale).order_by(Sale.created_at.desc())
        total = query.count()
        total_pages = ceil(total / page_size) if total > 0 else 1
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        return items, total, total_pages

    @staticmethod
    def get_sale_by_id(db: Session, sale_id: int) -> Sale:
        sale = db.query(Sale).filter(Sale.id == sale_id).first()
        if not sale:
            raise NotFoundException(f"Sale invoice with ID {sale_id} not found.")
        return sale

    @staticmethod
    def get_inventory_transactions(
        db: Session,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[dict], int, int]:
        query = (
            db.query(
                InventoryTransaction,
                Product.name.label("product_name"),
                Product.unit.label("product_unit"),
            )
            .join(Product, InventoryTransaction.product_id == Product.id)
            .order_by(InventoryTransaction.created_at.desc())
        )
        total = query.count()
        total_pages = ceil(total / page_size) if total > 0 else 1
        offset = (page - 1) * page_size
        results = query.offset(offset).limit(page_size).all()

        items = []
        for tx, name, unit in results:
            items.append({
                "id": tx.id,
                "product_id": tx.product_id,
                "product_name": name,
                "product_unit": unit,
                "transaction_type": tx.transaction_type,
                "quantity": tx.quantity,
                "previous_stock": tx.previous_stock,
                "new_stock": tx.new_stock,
                "note": tx.note,
                "created_at": tx.created_at,
            })
        return items, total, total_pages
