from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse
from app.services.assistant_service import AssistantService
from app.services.bharatcode_client import BharatCodeClient

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])


def get_ai_client() -> BharatCodeClient:
    return BharatCodeClient()


@router.post("/chat", response_model=AssistantChatResponse)
def chat_with_assistant(
    payload: AssistantChatRequest,
    db: Session = Depends(get_db),
    ai_client: BharatCodeClient = Depends(get_ai_client),
) -> AssistantChatResponse:
    """
    Real conversational AI assistant endpoint powered by BharatCode Model API (qwen-3.8-27b).
    Strictly read-only: interprets shop data and explains results using ground-truth database facts.
    """
    return AssistantService.handle_chat(db=db, request=payload, client=ai_client)

