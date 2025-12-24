from fastapi import APIRouter
from api.endpoints import auth, users, chat

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(chat.router)