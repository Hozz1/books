import httpx
from typing import List, Dict, Any
from config.settings import settings

async def search_books(query: str, max_results: int = 10) -> List[Dict[str, Any]]:
    """
    Ищет книги через Google Books API
    """
    if not settings.GOOGLE_BOOKS_API_KEY:
        # Если нет API ключа, возвращаем тестовые данные
        return get_sample_books()
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/books/v1/volumes",
                params={
                    "q": query,
                    "maxResults": max_results,
                    "key": settings.GOOGLE_BOOKS_API_KEY,
                    "langRestrict": "ru"
                },
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                books = []
                
                for item in data.get("items", []):
                    volume_info = item.get("volumeInfo", {})
                    book = {
                        "id": item.get("id"),
                        "title": volume_info.get("title", "Без названия"),
                        "author": ", ".join(volume_info.get("authors", ["Неизвестный автор"])),
                        "description": volume_info.get("description", ""),
                        "genre": ", ".join(volume_info.get("categories", [])),
                        "rating": volume_info.get("averageRating", 0),
                        "page_count": volume_info.get("pageCount"),
                        "cover_url": volume_info.get("imageLinks", {}).get("thumbnail", ""),
                        "preview_link": volume_info.get("previewLink", "")
                    }
                    books.append(book)
                
                return books
            else:
                return get_sample_books()
    
    except Exception:
        return get_sample_books()

def get_sample_books() -> List[Dict[str, Any]]:
    """
    Возвращает тестовые данные книг
    """
    return [
        {
            "id": "1",
            "title": "Мастер и Маргарита",
            "author": "Михаил Булгаков",
            "description": "Роман о дьяволе, посетившем Москву 1930-х годов.",
            "genre": "Классика, Фантастика",
            "rating": 4.8,
            "page_count": 384,
            "cover_url": "https://example.com/cover1.jpg"
        },
        {
            "id": "2",
            "title": "Преступление и наказание",
            "author": "Фёдор Достоевский",
            "description": "Роман о студенте Раскольникове, совершившем убийство.",
            "genre": "Классика, Психологический роман",
            "rating": 4.7,
            "page_count": 430,
            "cover_url": "https://example.com/cover2.jpg"
        },
        {
            "id": "3",
            "title": "1984",
            "author": "Джордж Оруэлл",
            "description": "Антиутопия о тоталитарном обществе под контролем Большого Брата.",
            "genre": "Антиутопия, Политическая фантастика",
            "rating": 4.6,
            "page_count": 328,
            "cover_url": "https://example.com/cover3.jpg"
        }
    ]

async def get_book_details(book_id: str) -> Dict[str, Any]:
    """
    Получает детальную информацию о книге
    """
    if not settings.GOOGLE_BOOKS_API_KEY:
        # Возвращаем тестовые данные
        for book in get_sample_books():
            if book["id"] == book_id:
                return book
        return {}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://www.googleapis.com/books/v1/volumes/{book_id}",
                params={"key": settings.GOOGLE_BOOKS_API_KEY},
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                volume_info = data.get("volumeInfo", {})
                
                return {
                    "id": data.get("id"),
                    "title": volume_info.get("title", "Без названия"),
                    "author": ", ".join(volume_info.get("authors", ["Неизвестный автор"])),
                    "description": volume_info.get("description", ""),
                    "genre": ", ".join(volume_info.get("categories", [])),
                    "rating": volume_info.get("averageRating", 0),
                    "rating_count": volume_info.get("ratingsCount", 0),
                    "page_count": volume_info.get("pageCount"),
                    "language": volume_info.get("language", "ru"),
                    "published_date": volume_info.get("publishedDate", ""),
                    "publisher": volume_info.get("publisher", ""),
                    "isbn": volume_info.get("industryIdentifiers", [{}])[0].get("identifier", ""),
                    "cover_url": volume_info.get("imageLinks", {}).get("thumbnail", ""),
                    "preview_link": volume_info.get("previewLink", ""),
                    "buy_link": volume_info.get("saleInfo", {}).get("buyLink", "")
                }
            else:
                return {}
    
    except Exception:
        return {}