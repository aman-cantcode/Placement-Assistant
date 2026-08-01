from fastapi import APIRouter, Depends
from app.schemas import ChatRequest, ChatResponse
from app.security import verify_internal_key
from app.chains.chat_chain import chat_chain

router = APIRouter(
    dependencies=[Depends(verify_internal_key)]
)

@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    result = chat_chain.invoke({
        "resume_text": request.resume_text,
        "jd_text": request.jd_text,
        "messages": request.messages,
        "new_message": request.new_message
    })
    return ChatResponse(reply=result)

