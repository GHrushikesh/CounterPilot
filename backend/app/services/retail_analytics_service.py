from datetime import datetime, timezone, timedelta, date
from decimal import Decimal
from typing import Dict, Any, List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.sale import Sale, SaleItem, SaleStatus


class RetailAnalyticsService:
    @staticmethod
    def get_inventory_summary(db: Session) -> Dict[str, Any]:
        """Calculates exact deterministic inventory statistics from database."""
        products = db.query(Product).filter(Product.is_active == True).all()
        total_products = len(products)

        zero_stock = [
            {
                "id": p.id,
                "name": p.name,
                "category": p.category,
                "unit": p.unit,
            }
            for p in products
            if p.current_stock <= 0
        ]

        low_stock = [
            {
                "id": p.id,
                "name": p.name,
                "category": p.category,
                "current_stock": float(p.current_stock),
                "minimum_stock": float(p.minimum_stock),
                "unit": p.unit,
                "deficit": float(p.minimum_stock - p.current_stock) if p.current_stock < p.minimum_stock else 0.0,
            }
            for p in products
            if p.current_stock <= p.minimum_stock
        ]

        catalog_details = [
            {
                "name": p.name,
                "category": p.category,
                "selling_price": float(p.selling_price),
                "purchase_price": float(p.purchase_price),
                "current_stock": float(p.current_stock),
                "minimum_stock": float(p.minimum_stock),
                "unit": p.unit,
                "is_low_stock": p.current_stock <= p.minimum_stock,
            }
            for p in products
        ]

        return {
            "total_products": total_products,
            "zero_stock_count": len(zero_stock),
            "zero_stock_items": zero_stock,
            "low_stock_count": len(low_stock),
            "low_stock_items": low_stock,
            "catalog": catalog_details,
        }

    @staticmethod
    def get_ist_reporting_boundaries(as_of: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Calculates Indian Standard Time (IST, Asia/Kolkata, UTC+05:30) reporting windows:
        - Daily reporting: 00:00:00 IST to next day 00:00:00 IST.
        - Yesterday: previous day 00:00:00 IST to today 00:00:00 IST.
        - Monthly reporting: 1st of Indian calendar month 00:00:00 IST to 1st of next month 00:00:00 IST.
        Converts all boundaries to UTC timestamps for database querying.
        """
        IST = timezone(timedelta(hours=5, minutes=30), name="Asia/Kolkata")
        if as_of is None:
            now_ist = datetime.now(IST)
        else:
            if as_of.tzinfo is None:
                # Assume naive datetime is in UTC
                now_ist = as_of.replace(tzinfo=timezone.utc).astimezone(IST)
            else:
                now_ist = as_of.astimezone(IST)

        today_start_ist = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end_ist = today_start_ist + timedelta(days=1)
        yesterday_start_ist = today_start_ist - timedelta(days=1)
        yesterday_end_ist = today_start_ist

        # Indian calendar month boundaries
        month_start_ist = today_start_ist.replace(day=1)
        if month_start_ist.month == 12:
            next_month_ist = month_start_ist.replace(year=month_start_ist.year + 1, month=1)
        else:
            next_month_ist = month_start_ist.replace(month=month_start_ist.month + 1)
        month_end_ist = next_month_ist

        return {
            "as_of_ist": now_ist,
            "today_start_utc": today_start_ist.astimezone(timezone.utc),
            "today_end_utc": today_end_ist.astimezone(timezone.utc),
            "yesterday_start_utc": yesterday_start_ist.astimezone(timezone.utc),
            "yesterday_end_utc": yesterday_end_ist.astimezone(timezone.utc),
            "month_start_utc": month_start_ist.astimezone(timezone.utc),
            "month_end_utc": month_end_ist.astimezone(timezone.utc),
            "today_start_ist": today_start_ist,
            "today_end_ist": today_end_ist,
            "month_start_ist": month_start_ist,
            "month_end_ist": month_end_ist,
        }

    @staticmethod
    def get_sales_for_date_range(
        db: Session,
        start_dt: datetime,
        end_dt: datetime,
    ) -> Dict[str, Any]:
        """Calculates deterministic sales metrics for a specified time range."""
        sales = (
            db.query(Sale)
            .filter(
                Sale.status == SaleStatus.COMPLETED.value,
                Sale.created_at >= start_dt,
                Sale.created_at < end_dt,
            )
            .all()
        )

        total_bills = len(sales)
        total_revenue = sum(s.total_amount for s in sales) if sales else Decimal("0.00")
        total_discount = sum(s.discount_amount for s in sales) if sales else Decimal("0.00")

        payment_breakdown: Dict[str, float] = {}
        for s in sales:
            mode = s.payment_method.upper()
            payment_breakdown[mode] = payment_breakdown.get(mode, 0.0) + float(s.total_amount)

        # Calculate exact gross profit using immutable purchase_price_snapshot
        gross_profit = Decimal("0.00")
        items_sold_count = Decimal("0.00")
        has_incomplete_profit_data = False
        untracked_cost_items_count = Decimal("0.00")

        if sales:
            sale_ids = [s.id for s in sales]
            sale_items = (
                db.query(SaleItem)
                .filter(SaleItem.sale_id.in_(sale_ids))
                .all()
            )
            for item in sale_items:
                items_sold_count += item.quantity
                if item.purchase_price_snapshot is not None:
                    line_profit = item.quantity * (item.unit_price - item.purchase_price_snapshot)
                    gross_profit += line_profit
                else:
                    # Legacy sale item without snapshot: do NOT guess with current Product price!
                    has_incomplete_profit_data = True
                    untracked_cost_items_count += item.quantity

            # Deduct discounts provided from gross profit
            gross_profit = max(Decimal("0.00"), gross_profit - total_discount)

        return {
            "bill_count": total_bills,
            "total_revenue": float(total_revenue),
            "total_discount": float(total_discount),
            "gross_profit": float(gross_profit),
            "has_incomplete_profit_data": has_incomplete_profit_data,
            "profit_status": "PARTIAL" if has_incomplete_profit_data else "COMPLETE",
            "untracked_items_count": float(untracked_cost_items_count),
            "items_sold_count": float(items_sold_count),
            "payment_breakdown": payment_breakdown,
        }

    @staticmethod
    def get_product_sales_ranking(db: Session) -> Dict[str, Any]:
        """Ranks products by total sales velocity and identifies slow-selling items."""
        # Aggregate completed sales per product
        records = (
            db.query(
                SaleItem.product_id,
                SaleItem.product_name,
                func.sum(SaleItem.quantity).label("total_qty"),
                func.sum(SaleItem.total_price).label("total_revenue"),
            )
            .join(Sale, SaleItem.sale_id == Sale.id)
            .filter(Sale.status == SaleStatus.COMPLETED.value)
            .group_by(SaleItem.product_id, SaleItem.product_name)
            .order_by(func.sum(SaleItem.quantity).desc())
            .all()
        )

        sold_product_ids = {r[0] for r in records}
        top_selling = [
            {
                "product_name": r[1],
                "quantity_sold": float(r[2]),
                "revenue_generated": float(r[3]),
            }
            for r in records
        ]

        # Slow / zero sales products among active catalog
        all_active_products = db.query(Product).filter(Product.is_active == True).all()
        unsold_products = [
            {"product_name": p.name, "current_stock": float(p.current_stock), "unit": p.unit}
            for p in all_active_products
            if p.id not in sold_product_ids
        ]

        return {
            "top_selling": top_selling,
            "unsold_or_slow_selling": unsold_products,
        }

    @classmethod
    def compile_ground_truth_context(cls, db: Session, as_of: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Gathers all verified factual metrics from SQLite to supply as grounded AI context.
        Uses Indian Standard Time (IST, UTC+5:30) for daily and monthly calendar boundaries.
        Ensures the AI model interprets real figures and never invents numbers.
        """
        bounds = cls.get_ist_reporting_boundaries(as_of)

        inventory = cls.get_inventory_summary(db)
        today_sales = cls.get_sales_for_date_range(db, bounds["today_start_utc"], bounds["today_end_utc"])
        yesterday_sales = cls.get_sales_for_date_range(db, bounds["yesterday_start_utc"], bounds["yesterday_end_utc"])
        month_sales = cls.get_sales_for_date_range(db, bounds["month_start_utc"], bounds["month_end_utc"])
        all_time_sales = cls.get_sales_for_date_range(db, datetime(2020, 1, 1, tzinfo=timezone.utc), bounds["today_end_utc"])
        rankings = cls.get_product_sales_ranking(db)

        # Transparency notes for AI regarding profit completeness
        if today_sales["has_incomplete_profit_data"]:
            profit_note = (
                f"PARTIAL: ₹{today_sales['gross_profit']:.2f}. "
                f"NOTICE: {today_sales['untracked_items_count']:.0f} line items in this period lack historical purchase cost snapshots "
                f"(legacy checkout records). Gross profit only counts items with verified cost snapshots."
            )
        else:
            profit_note = f"COMPLETE: ₹{today_sales['gross_profit']:.2f}. All items have verified purchase-price snapshots."

        return {
            "store_name": "Ujjam Computers",
            "reporting_timezone": "Asia/Kolkata (IST, UTC+05:30)",
            "current_time_ist": bounds["as_of_ist"].strftime("%Y-%m-%d %H:%M:%S IST"),
            "inventory": {
                "total_products": inventory["total_products"],
                "zero_stock_count": inventory["zero_stock_count"],
                "zero_stock_items": [item["name"] for item in inventory["zero_stock_items"]],
                "low_stock_count": inventory["low_stock_count"],
                "low_stock_items": [
                    f"{item['name']} ({item['current_stock']} {item['unit']} left, min threshold {item['minimum_stock']})"
                    for item in inventory["low_stock_items"]
                ],
                "catalog_overview": [
                    f"{p['name']} | Price: ₹{p['selling_price']} | Stock: {p['current_stock']} {p['unit']} | Min: {p['minimum_stock']}"
                    for p in inventory["catalog"]
                ],
            },
            "today_sales": today_sales,
            "today_sales_ist": today_sales,
            "yesterday_sales": yesterday_sales,
            "yesterday_sales_ist": yesterday_sales,
            "current_month_sales_ist": month_sales,
            "profit_accuracy_notice": profit_note,
            "all_time_sales_summary": {
                "total_bills": all_time_sales["bill_count"],
                "total_revenue": all_time_sales["total_revenue"],
                "gross_profit": all_time_sales["gross_profit"],
                "profit_status": all_time_sales["profit_status"],
            },
            "product_velocity": {
                "top_selling_items": rankings["top_selling"][:5],
                "slow_or_unsold_items": [p["product_name"] for p in rankings["unsold_or_slow_selling"][:5]],
            },
        }
