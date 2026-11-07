import json
import logging
import uuid
from typing import Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse
from app.services.retail_analytics_service import RetailAnalyticsService
from app.services.bharatcode_client import BharatCodeClient
from app.services.store_setting_service import StoreSettingService

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_TEMPLATE = """You are CounterPilot, an intelligent, trusted business co-pilot designed for small Indian retail shopkeepers (Kirana stores, electronics, and general retail).
You are currently assisting the owner of "{shop_name}".

CRITICAL ACCURACY & COMPLIANCE RULES:
1. STRICT READ-ONLY MODE: You cannot create products, deduct stock, execute sales, or modify records in this phase. Explain what the data shows clearly.
2. ABSOLUTE TRUTHFULNESS: Base all answers strictly on the verified GROUND-TRUTH DATABASE CONTEXT provided below. NEVER invent sales numbers, fake products, or imaginary stock figures.
3. REVENUE VS PROFIT DISTINCTION:
   - Revenue is the total customer money received from completed sales bills.
   - Profit is strictly gross profit: (Selling Price - Purchase Cost) * Quantity Sold. Never confuse revenue with profit. If purchase price data is missing, state so clearly.
4. LANGUAGE & TONE:
   - Understand English, Hindi, and Hinglish queries seamlessly (e.g. "Aaj ki sale kitni hui?", "Maggi ka stock kitna hai?").
   - Respond in professional, warm, concise, and clear language. Respect the shopkeeper's busy counter schedule.
5. GROUND-TRUTH BUSINESS DATA FROM LIVE SQLITE DATABASE:
{ground_truth_json}

Use the verified data above to answer the shopkeeper's questions accurately."""


class AssistantService:
    @classmethod
    def handle_chat(
        cls,
        db: Session,
        request: AssistantChatRequest,
        client: Optional[BharatCodeClient] = None,
    ) -> AssistantChatResponse:
        """
        Orchestrates conversational assistant queries:
        1. Compiles real ground-truth facts from SQLite database.
        2. Formats bounded context & conversation history.
        3. Invokes official BharatCode Model API (qwen-3.8-27b).
        4. Returns strictly verified, grounded response.
        """
        # Ensure client instance
        ai_client = client or BharatCodeClient()

        # Generate or preserve conversation identifier
        conversation_id = request.conversation_id or str(uuid.uuid4())

        # 1. Deterministic database facts extraction (READ-ONLY)
        ground_truth_data = RetailAnalyticsService.compile_ground_truth_context(db)
        ground_truth_json = json.dumps(ground_truth_data, indent=2, default=str)
        shop_name = StoreSettingService.get_shop_name(db)

        system_message = {
            "role": "system",
            "content": SYSTEM_PROMPT_TEMPLATE.format(shop_name=shop_name, ground_truth_json=ground_truth_json),
        }

        # 2. Build bounded conversation history (keep last 10 messages for context)
        bounded_history = request.history[-10:] if request.history else []
        messages = [system_message]
        for msg in bounded_history:
            messages.append({"role": msg.role, "content": msg.content})

        # Append current user prompt
        messages.append({"role": "user", "content": request.message.strip()})

        # 3. Call Model API (BharatCode or Gemini fallback)
        reply_content = ai_client.generate_chat_completion(messages=messages)
        active_model = getattr(ai_client, "active_model", settings.BHARATCODE_MODEL)

        return AssistantChatResponse(
            reply=reply_content,
            conversation_id=conversation_id,
            model=active_model,
            ground_truth_context={
                "total_products": ground_truth_data["inventory"]["total_products"],
                "zero_stock_count": ground_truth_data["inventory"]["zero_stock_count"],
                "low_stock_count": ground_truth_data["inventory"]["low_stock_count"],
                "today_revenue": ground_truth_data["today_sales"]["total_revenue"],
                "today_bills": ground_truth_data["today_sales"]["bill_count"],
                "today_profit": ground_truth_data["today_sales"]["gross_profit"],
                "profit_status": ground_truth_data["today_sales"]["profit_status"],
                "reporting_timezone": ground_truth_data["reporting_timezone"],
            },
        )
