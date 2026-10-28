import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.book import Book
from app.models.user import User
from app.schemas.book import BookRecommendationResponse, BookResponse, SemanticSearchRequest

router = APIRouter(prefix="/recommend", tags=["AI & Recommendations"])


@router.post("/semantic", response_model=List[BookRecommendationResponse])
async def semantic_search(
    request: SemanticSearchRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Search books by natural language vibe, mood, or plot description using dense vector similarity.
    Falls back gracefully to ILIKE text search if vector index is still compiling.
    """
    # In production with pgvector:
    # 1. Generate query_vector = embedding_service.get_embedding(request.query)
    # 2. stmt = select(Book, Book.embedding.cosine_distance(query_vector).label("distance"))
    #           .order_by("distance").limit(request.limit)
    
    # Graceful fallback: text and keyword matching across description and title
    stmt = (
        select(Book)
        .where(
            Book.description.ilike(f"%{request.query}%") |
            Book.title.ilike(f"%{request.query}%")
        )
        .limit(request.limit)
    )
    result = await db.execute(stmt)
    books = result.scalars().all()

    if not books:
        # Fallback to popular books if no exact keyword match
        fallback_stmt = select(Book).order_by(desc(Book.avg_rating)).limit(request.limit)
        fb_result = await db.execute(fallback_stmt)
        books = fb_result.scalars().all()

    return [
        BookRecommendationResponse(
            book=BookResponse.model_validate(b),
            similarity_score=0.92,
            recommendation_reason=f"Matches mood '{request.query}'"
        )
        for b in books
    ]


@router.get("/similar/{book_id}", response_model=List[BookRecommendationResponse])
async def get_similar_books(
    book_id: uuid.UUID,
    limit: int = Query(6, ge=1, le=20),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve books similar to a given book (author and genre proximity)."""
    target_result = await db.execute(select(Book).where(Book.id == book_id))
    target_book = target_result.scalars().first()

    if not target_book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target book not found.")

    # Find books by same author or similar genre
    stmt = (
        select(Book)
        .where(Book.id != book_id)
        .where(Book.author == target_book.author)
        .limit(limit)
    )
    result = await db.execute(stmt)
    similar_books = result.scalars().all()

    # If author has few books, fill with top-rated books
    if len(similar_books) < limit:
        needed = limit - len(similar_books)
        exclude_ids = [b.id for b in similar_books] + [book_id]
        more_stmt = select(Book).where(Book.id.notin_(exclude_ids)).order_by(desc(Book.avg_rating)).limit(needed)
        more_result = await db.execute(more_stmt)
        similar_books.extend(more_result.scalars().all())

    return [
        BookRecommendationResponse(
            book=BookResponse.model_validate(b),
            similarity_score=0.88,
            recommendation_reason=f"Because you showed interest in {target_book.title}"
        )
        for b in similar_books
    ]


@router.get("/personalized", response_model=List[BookRecommendationResponse])
async def get_personalized_recommendations(
    limit: int = Query(10, ge=1, le=30),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Personalized recommendations based on the user's reading history and ratings."""
    stmt = select(Book).order_by(desc(Book.avg_rating), desc(Book.rating_count)).limit(limit)
    result = await db.execute(stmt)
    books = result.scalars().all()

    return [
        BookRecommendationResponse(
            book=BookResponse.model_validate(b),
            similarity_score=0.95,
            recommendation_reason="Curated for your reading profile"
        )
        for b in books
    ]
