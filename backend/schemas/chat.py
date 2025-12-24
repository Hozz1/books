from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any

class MessageBase(BaseModel):
    content: str
    role: str

class MessageCreate(BaseModel):
    content: str
    role: str
    metadata: Optional[Dict[str, Any]] = Field(default=None, alias="meta")

    class Config:
        populate_by_name = True

class MessageResponse(BaseModel):
    id: int
    chat_id: int
    content: str
    role: str
    metadata: Optional[Dict[str, Any]] = Field(default=None, alias="meta")

    class Config:
        from_attributes = True
        populate_by_name = True

class ChatBase(BaseModel):
    title: str

class ChatCreate(ChatBase):
    pass

class ChatResponse(ChatBase):
    id: int
    user_id: int
    messages: List[MessageResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str
    chat_id: Optional[int] = None

class ChatResponseData(BaseModel):
    response: str
    recommendations: Optional[List[Dict[str, Any]]] = None
    chat_id: Optional[int] = None