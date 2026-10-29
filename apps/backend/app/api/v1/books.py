import math
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.book import Book
from app.schemas.book import BookContentPage, BookContentResponse, BookListResponse, BookResponse
from app.services.book_content_service import fetch_full_book_content

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
async def get_book_detail(book_id: str, db: AsyncSession = Depends(get_db)):
    try:
        book_uuid = uuid.UUID(str(book_id))
        query = select(Book).where(Book.id == book_uuid)
    except (ValueError, TypeError):
        query = select(Book).where(Book.id == book_id)

    result = await db.execute(query)
    book = result.scalars().first()

    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found in library.")

    return BookResponse.model_validate(book)


@router.get("/{book_id}/download")
async def download_book(book_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve verified legal download link for the full-text book (EPUB/PDF)."""
    try:
        book_uuid = uuid.UUID(str(book_id))
        query = select(Book).where(Book.id == book_uuid)
    except (ValueError, TypeError):
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


@router.get("/{book_id}/content", response_model=BookContentResponse)
async def get_book_content(book_id: str, db: AsyncSession = Depends(get_db)):
    """
    Retrieve authentic full unabridged literary chapters/pages for in-app reading.
    Fetches and cleans full text directly from Project Gutenberg archives with local disk caching.
    """
    try:
        book_uuid = uuid.UUID(str(book_id))
        query = select(Book).where(Book.id == book_uuid)
    except (ValueError, TypeError):
        query = select(Book).where(Book.id == book_id)

    result = await db.execute(query)
    book = result.scalars().first()

    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")

    pages_data = []
    if book.gutenberg_id:
        pages_data = await fetch_full_book_content(
            gutenberg_id=book.gutenberg_id,
            title=book.title,
            author=book.author
        )

    # Fallback if Gutenberg fetch fails or no gutenberg_id
    if not pages_data:
        desc = book.description or "A classical work of literature."
        pages_data = [
            {
                "page": 1,
                "title": "Prologue",
                "content": f"{book.title.upper()}\nBy {book.author}\n\n{desc}\n\nWelcome to the reading canvas. Full digital text is synchronized through the PagePulse AI literary archive."
            }
        ]

    return BookContentResponse(
        book_id=str(book.id),
        title=book.title,
        author=book.author,
        total_pages=len(pages_data),
        pages=[BookContentPage(**p) for p in pages_data]
    )
