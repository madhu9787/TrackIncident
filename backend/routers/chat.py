from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from services.ai_service import chat_with_ai

router = APIRouter(prefix="/chat", tags=["chat"])

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

@router.post("")
async def chat_endpoint(req: ChatRequest):
    """
    Handle chat conversation.
    """
    messages_dict = [{"role": m.role, "content": m.content} for m in req.messages]
    response_text = await chat_with_ai(messages_dict)
    return {"reply": response_text}
