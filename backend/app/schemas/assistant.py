from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"] = Field(
        ...,
        description="Message author role: must be 'user' or 'assistant'",
    )
    content: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Message text content bounded to 2000 characters",
    )


class AssistantChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="User's query for the assistant")
    history: List[ChatMessage] = Field(
        default_factory=list,
        max_length=20,
        description="Bounded conversation history for conversational context (max 20 messages)",
    )
    conversation_id: Optional[str] = Field(
        None,
        max_length=100,
        description="Optional conversation tracking identifier",
    )


class AssistantChatResponse(BaseModel):
    reply: str
    conversation_id: str
    model: str
    ground_truth_context: Optional[Dict[str, Any]] = None
