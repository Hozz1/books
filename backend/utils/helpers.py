import re
from typing import List, Dict, Any

def extract_keywords(text: str) -> List[str]:
    """
    Извлекает ключевые слова из текста для поиска книг
    """
    # Удаляем стоп-слова
    stop_words = {"хочу", "мне", "бы", "не", "по", "на", "с", "и", "или", "но", "а", "о", "у", "за", "к", "до", "из"}
    
    # Извлекаем слова
    words = re.findall(r'\b[а-яА-ЯёЁa-zA-Z]{3,}\b', text.lower())
    
    # Фильтруем стоп-слова
    keywords = [word for word in words if word not in stop_words]
    
    return keywords[:5]  # Возвращаем до 5 ключевых слов

def format_book_recommendations(books: List[Dict[str, Any]]) -> str:
    """
    Форматирует список книг для отображения
    """
    if not books:
        return "К сожалению, я не нашел подходящих книг."
    
    formatted = "Вот что я нашел:\n"
    
    for i, book in enumerate(books, 1):
        formatted += f"{i}. **{book['title']}**\n"
        if book.get('author'):
            formatted += f"   Автор: {book['author']}\n"
        if book.get('genre'):
            formatted += f"   Жанр: {book['genre']}\n"
        if book.get('rating'):
            formatted += f"   Рейтинг: {book['rating']}/5"
        if book.get('description'):
            # Обрезаем длинное описание
            desc = book['description'][:150] + "..." if len(book['description']) > 150 else book['description']
            formatted += f"   Описание: {desc}\n"
        formatted += "\n"
    
    return formatted

def validate_email(email: str) -> bool:
    """
    Проверяет валидность email
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def sanitize_input(text: str) -> str:
    """
    Очищает пользовательский ввод от потенциально опасных символов
    """
    # Удаляем HTML теги
    text = re.sub(r'<[^>]*>', '', text)
    # Удаляем специальные символы, оставляя только буквы, цифры и основные знаки препинания
    text = re.sub(r'[^\w\s.,!?-]', '', text)
    return text.strip()