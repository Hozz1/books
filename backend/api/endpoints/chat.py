from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from api.dependencies import get_current_user
from core.database import get_db
from crud.chat import (
    get_user_chats, create_chat, update_chat, delete_chat,
    get_chat, create_message, get_chat_messages
)
from schemas.chat import (
    ChatCreate, ChatResponse, MessageCreate, MessageResponse,
    ChatRequest, ChatResponseData
)
from models.user import User
from services.chat_service import process_chat_message

router = APIRouter(prefix="/chat", tags=["chat"])

@router.get("/chats", response_model=List[ChatResponse])
def get_chats(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chats = get_user_chats(db, current_user.id, skip=skip, limit=limit)
    return chats

@router.post("/chats", response_model=ChatResponse)
def create_new_chat(
    chat: ChatCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return create_chat(db, chat, current_user.id)

@router.get("/chats/{chat_id}", response_model=ChatResponse)
def get_chat_by_id(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chat = get_chat(db, chat_id, current_user.id)
    if not chat:
        raise HTTPException(status_code=404, detail="Чат не найден")
    return chat

@router.put("/chats/{chat_id}", response_model=ChatResponse)
def update_chat_title(
    chat_id: int,
    title: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chat = update_chat(db, chat_id, current_user.id, title)
    if not chat:
        raise HTTPException(status_code=404, detail="Чат не найден")
    return chat

@router.delete("/chats/{chat_id}")
def delete_chat_by_id(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = delete_chat(db, chat_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Чат не найден")
    return {"message": "Чат удален"}

@router.get("/chats/{chat_id}/messages", response_model=List[MessageResponse])
def get_messages(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    messages = get_chat_messages(db, chat_id=chat_id, user_id=current_user.id)
    return messages

@router.post("/", response_model=ChatResponseData)
async def send_message(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Если chat_id не указан, создаем новый чат
    if not request.chat_id:
        chat = create_chat(db, ChatCreate(title="Новый чат"), current_user.id)
        chat_id = chat.id
    else:
        chat_id = request.chat_id
        # Проверяем, что чат принадлежит пользователю
        chat = get_chat(db, chat_id, current_user.id)
        if not chat:
            raise HTTPException(status_code=404, detail="Чат не найден")
    
    # Сохраняем сообщение пользователя
    user_message = create_message(
        db,
        MessageCreate(content=request.message, role="user"),
        chat_id
    )
    
    # Обрабатываем сообщение через сервис
    response_data = await process_chat_message(
        db=db,
        user_message=request.message,
        chat_id=chat_id,
        user_id=current_user.id
    )
    
    # Сохраняем ответ бота
    bot_message = create_message(
        db,
        MessageCreate(
            content=response_data["response"],
            role="assistant",
            meta={"recommendations": response_data.get("recommendations")}
        ),
        chat_id
    )
    
    # Обновляем заголовок чата, если это первое сообщение
    if len(chat.messages) <= 2:  # Только что созданный чат
        update_chat(db, chat_id, current_user.id, request.message[:50] + "...")
    
    return ChatResponseData(
        response=response_data["response"],
        recommendations=response_data.get("recommendations"),
        chat_id=chat_id
    )