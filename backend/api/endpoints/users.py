from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from api.dependencies import get_current_user
from core.database import get_db
from crud.user import get_user, update_user
from crud.chat import get_favorite_books, add_favorite_book, remove_favorite_book
from schemas.user import UserResponse, UserUpdate
from models.user import User

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = update_user(db, current_user.id, user_update)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user

@router.get("/favorites")
def get_user_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_favorite_books(db, current_user.id)

@router.post("/favorites")
def add_to_favorites(
    book_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    return add_favorite_book(db, current_user.id, book_data)

@router.delete("/favorites/{book_id}")
def remove_from_favorites(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = remove_favorite_book(db, current_user.id, book_id)
    if not success:
        raise HTTPException(status_code=404, detail="Книга не найдена в избранном")
    return {"message": "Книга удалена из избранного"}