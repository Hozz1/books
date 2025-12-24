from sqlalchemy.orm import Session
from typing import List, Optional
from models.chat import Chat, Message, FavoriteBook
from schemas.chat import ChatCreate, MessageCreate

def get_chat(db: Session, chat_id: int, user_id: int) -> Optional[Chat]:
    return db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user_id).first()

def get_user_chats(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Chat]:
    return db.query(Chat).filter(Chat.user_id == user_id).order_by(Chat.updated_at.desc()).offset(skip).limit(limit).all()

def create_chat(db: Session, chat: ChatCreate, user_id: int) -> Chat:
    db_chat = Chat(**chat.dict(), user_id=user_id)
    db.add(db_chat)
    db.commit()
    db.refresh(db_chat)
    return db_chat

def update_chat(db: Session, chat_id: int, user_id: int, title: str) -> Optional[Chat]:
    db_chat = get_chat(db, chat_id, user_id)
    if not db_chat:
        return None
    
    db_chat.title = title
    db.commit()
    db.refresh(db_chat)
    return db_chat

def delete_chat(db: Session, chat_id: int, user_id: int) -> bool:
    db_chat = get_chat(db, chat_id, user_id)
    if not db_chat:
        return False
    
    db.delete(db_chat)
    db.commit()
    return True

def create_message(db: Session, message: MessageCreate, chat_id: int) -> Message:
    db_message = Message(
        chat_id=chat_id,
        content=message.content,
        role=message.role,
        meta=message.metadata
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def get_chat_messages(db: Session, chat_id: int, user_id: int) -> List[Message]:
    chat = get_chat(db, chat_id, user_id)
    if not chat:
        return []
    return chat.messages

def get_favorite_books(db: Session, user_id: int) -> List[FavoriteBook]:
    return db.query(FavoriteBook).filter(FavoriteBook.user_id == user_id).all()

def add_favorite_book(db: Session, user_id: int, book_data: dict) -> FavoriteBook:
    db_book = FavoriteBook(
        user_id=user_id,
        book_id=book_data["id"],
        title=book_data["title"],
        author=book_data.get("author"),
        cover_url=book_data.get("cover_url")
    )
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book

def remove_favorite_book(db: Session, user_id: int, book_id: str) -> bool:
    db_book = db.query(FavoriteBook).filter(
        FavoriteBook.user_id == user_id,
        FavoriteBook.book_id == book_id
    ).first()
    
    if not db_book:
        return False
    
    db.delete(db_book)
    db.commit()
    return True