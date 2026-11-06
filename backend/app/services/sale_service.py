from datetime import datetime, timezone
from decimal import Decimal
from math import ceil
from typing import List, Tuple, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.inventory_transaction import InventoryTransaction, TransactionType
from app.models.sale import Sale, SaleItem, PaymentMethod, SaleStatus
from app.schemas.sale import SaleCreate
from app.core.exceptions import NotFoundException, BadRequestException


class SaleService:
    @staticmethod
    def generate_invoice_number(db: Session) -> str:
        """Generates sequential daily invoice number, e.g. INV-20261106-0001"""
        now = datetime.now(timezone.utc)
        date_prefix = now.strftime("%Y%m%d")
        prefix = f"INV-{date_prefix}-"

        # Count sales created today
        count = db.query(Sale).filter(Sale.invoice_number.like(f"{prefix}%")).count()
        sequence = count + 1
        return f"{prefix}{sequence:04d}"

    @classmethod
    def create_sale(cls, db: Session, data: SaleCreate) -> Sale:
        if not data.items:
            raise BadRequestException("A sale must contain at least one product item.")

        valid_methods = [m.value for m in PaymentMethod]
        if data.payment_method.upper() not in valid_methods:
            raise BadRequestException(f"Invalid payment method. Allowed: {valid_methods}")

        invoice_number = cls.generate_invoice_number(db)
        subtotal = Decimal("0.00")
        sale_items: List[SaleItem] = []

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
        db.commit()
        db.refresh(sale)
        return sale

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
