import math
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.book import Book
from app.schemas.book import BookListResponse, BookResponse

router = APIRouter(prefix="/books", tags=["Books & Digital Library"])


@router.get("", response_model=BookListResponse)
async def list_books(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Fuzzy search title or author")
):
    offset = (page - 1) * size
    query = select(Book)

    if search:
        search_filter = or_(
            Book.title.ilike(f"%{search}%"),
            Book.author.ilike(f"%{search}%")
        )
        query = query.where(search_filter)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Fetch items
    paginated_query = query.order_by(desc(Book.avg_rating), desc(Book.rating_count)).offset(offset).limit(size)
    result = await db.execute(paginated_query)
    items = result.scalars().all()

    pages = math.ceil(total / size) if total > 0 else 1

    return BookListResponse(
        items=[BookResponse.model_validate(b) for b in items],
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/popular", response_model=list[BookResponse])
async def get_popular_books(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(12, ge=1, le=50)
):
    """Retrieve top trending books based on average rating and rating volume."""
    query = select(Book).order_by(desc(Book.avg_rating), desc(Book.rating_count)).limit(limit)
    result = await db.execute(query)
    books = result.scalars().all()
    return [BookResponse.model_validate(b) for b in books]


@router.get("/{book_id}", response_model=BookResponse)
async def get_book_detail(book_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    query = select(Book).where(Book.id == book_id)
    result = await db.execute(query)
    book = result.scalars().first()

    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found in library.")

    return BookResponse.model_validate(book)


@router.get("/{book_id}/download")
async def download_book(book_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Retrieve verified legal download link for the full-text book (EPUB/PDF)."""
    query = select(Book).where(Book.id == book_id)
    result = await db.execute(query)
    book = result.scalars().first()

    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")

    if not book.download_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Digital download format is not available for this title yet."
        )

    # Redirect client directly to the legal CDN / Gutenberg EPUB repository
    return RedirectResponse(url=book.download_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)
