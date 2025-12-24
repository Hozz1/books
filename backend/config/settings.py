from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Настройки приложения
    APP_NAME: str = "Book Chat Bot"
    DEBUG: bool = False
    
    # Настройки безопасности
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Настройки базы данных
    DATABASE_URL: str
    
    # Настройки Redis
    REDIS_URL: Optional[str] = None
    
    # API ключи
    OPENAI_API_KEY: Optional[str] = None
    GOOGLE_BOOKS_API_KEY: Optional[str] = None
    
    # Настройки CORS
    ALLOWED_ORIGINS: list = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    class Config:
        env_file = ".env"

settings = Settings()