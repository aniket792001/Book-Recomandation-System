import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.book import BookResponse


class ReadingProgressUpdate(BaseModel):
    book_id: uuid.UUID
    current_cfi: str = Field(..., max_length=512)
    percentage: float = Field(..., ge=0.0, le=100.0)


class ReadingProgressResponse(BaseModel):
    id: uuid.UUID
    book_id: uuid.UUID
    current_cfi: str
    percentage: float
    updated_at: datetime
    book: Optional[BookResponse] = None

    model_config = {"from_attributes": True}


class BookmarkCreate(BaseModel):
    book_id: uuid.UUID
    cfi: str
    note: Optional[str] = None


class BookmarkResponse(BaseModel):
    id: uuid.UUID
    book_id: uuid.UUID
    cfi: str
    note: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
