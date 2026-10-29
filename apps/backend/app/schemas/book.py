import uuid
from typing import List, Optional
from pydantic import BaseModel, Field


class BookBase(BaseModel):
    title: str
    author: str
    isbn: Optional[str] = None
    description: Optional[str] = None
    cover_url: Optional[str] = None
    download_url: Optional[str] = None
    format: str = "epub"
    language: str = "en"
    avg_rating: float = 0.0
    rating_count: int = 0


class BookResponse(BookBase):
    id: uuid.UUID
    gutenberg_id: Optional[int] = None

    model_config = {"from_attributes": True}


class BookListResponse(BaseModel):
    items: List[BookResponse]
    total: int
    page: int
    size: int
    pages: int


class SemanticSearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500, description="Natural language mood or theme description")
    limit: int = Field(default=10, ge=1, le=50)


class BookRecommendationResponse(BaseModel):
    book: BookResponse
    similarity_score: float
    recommendation_reason: Optional[str] = None


class BookContentPage(BaseModel):
    page: int
    title: str
    content: str


class BookContentResponse(BaseModel):
    book_id: str
    title: str
    author: str
    total_pages: int
    pages: List[BookContentPage]
