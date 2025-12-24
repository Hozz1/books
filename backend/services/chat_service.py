import httpx
import json
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from config.settings import settings
from services.book_service import search_books

async def process_chat_message(
    db: Session,
    user_message: str,
    chat_id: int,
    user_id: int
) -> Dict[str, Any]:
    """
    Обрабатывает сообщение пользователя и возвращает ответ с рекомендациями
    """
    
    # Здесь можно добавить логику анализа сообщения
    # Например, определить, хочет ли пользователь рекомендации книг
    
    # Простая логика: если в сообщении есть ключевые слова, ищем книги
    book_keywords = ["книг", "прочита", "рекоменд", "автор", "жанр", "литератур"]
    
    if any(keyword in user_message.lower() for keyword in book_keywords):
        # Ищем книги по запросу
        books = await search_books(user_message)
        
        # Генерируем ответ
        if books:
            response = f"Вот что я нашел по вашему запросу '{user_message}':\n"

            for i, book in enumerate(books[:3], 1):
                response += f"{i}. {book['title']} - {book.get('author', 'Неизвестный автор')}\n"
            
            response += "\nМогу рассказать подробнее о любой из этих книг!"
            return {
                "response": response,
                "recommendations": books[:5]
            }
        else:
            return {
                "response": f"К сожалению, я не нашел книг по запросу '{user_message}'. Попробуйте уточнить запрос.",
                "recommendations": []
            }
    
    # Если это не запрос о книгах, используем OpenAI OpenAI API
    if settings.OPENAI_API_KEY:
        return await generate_openai_response(user_message)
    
    # Запасной вариант
    return {
        "response": f"Я получил ваше сообщение: '{user_message}'. Как книжный помощник, я могу помочь вам с рекомендациями книг, поиском авторов или обсуждением литературы. Что вас интересует?",
        "recommendations": []
    }

async def generate_openai_response(message: str) -> Dict[str, Any]:
    """
    Генерирует ответ с помощью OpenAI API
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        {
                            "role": "system",
                            "content": "Ты книжный помощник. Помогаешь пользователям находить книги, рекомендовать литературу, обсуждать авторов и жанры. Будь дружелюбным и полезным."
                        },
                        {
                            "role": "user",
                            "content": message
                        }
                    ],
                    "temperature": 0.7,
                    "max_tokens": 500
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "response": data["choices"][0]["message"]["content"],
                    "recommendations": []
                }
            else:
                return {
                    "response": "Извините, возникла проблема с обработкой вашего запроса. Попробуйте еще раз.",
                    "recommendations": []
                }
    except Exception:
        return {
            "response": "Не удалось обработать запрос. Пожалуйста, попробуйте позже.",
            "recommendations": []
        }