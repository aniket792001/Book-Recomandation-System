import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.book import Book
from app.models.reading_progress import Bookmark, ReadingProgress
from app.models.user import User
from app.schemas.library import BookmarkCreate, BookmarkResponse, ReadingProgressResponse, ReadingProgressUpdate

router = APIRouter(prefix="/library", tags=["User Library & Reader"])


@router.get("/progress", response_model=List[ReadingProgressResponse])
async def get_reading_shelf(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all books currently in the user's reading shelf with their reading percentage and CFI."""
    stmt = (
        select(ReadingProgress)
        .where(ReadingProgress.user_id == current_user.id)
        .options(selectinload(ReadingProgress.book))
        .order_by(desc(ReadingProgress.updated_at))
    )
    result = await db.execute(stmt)
    records = result.scalars().all()
    return [ReadingProgressResponse.model_validate(r) for r in records]


@router.post("/progress", response_model=ReadingProgressResponse)
async def update_reading_progress(
    progress_in: ReadingProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Sync reading position (CFI locator) and percentage from the mobile reader."""
    # Check book exists
    book_result = await db.execute(select(Book).where(Book.id == progress_in.book_id))
    book = book_result.scalars().first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")

    # Find existing progress or create new
    stmt = select(ReadingProgress).where(
        ReadingProgress.user_id == current_user.id,
        ReadingProgress.book_id == progress_in.book_id
    )
    result = await db.execute(stmt)
    progress = result.scalars().first()

    if progress:
        progress.current_cfi = progress_in.current_cfi
        progress.percentage = progress_in.percentage
    else:
        progress = ReadingProgress(
            user_id=current_user.id,
            book_id=progress_in.book_id,
            current_cfi=progress_in.current_cfi,
            percentage=progress_in.percentage
        )
        db.add(progress)

    await db.commit()
    await db.refresh(progress)

    # Reload with book relation
    reload_stmt = (
        select(ReadingProgress)
        .where(ReadingProgress.id == progress.id)
        .options(selectinload(ReadingProgress.book))
    )
    reloaded = await db.execute(reload_stmt)
    final_record = reloaded.scalars().first()

    return ReadingProgressResponse.model_validate(final_record)


@router.get("/bookmarks/{book_id}", response_model=List[BookmarkResponse])
async def get_book_bookmarks(
    book_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Bookmark)
        .where(Bookmark.user_id == current_user.id, Bookmark.book_id == book_id)
        .order_by(desc(Bookmark.created_at))
    )
    result = await db.execute(stmt)
    bookmarks = result.scalars().all()
    return [BookmarkResponse.model_validate(b) for b in bookmarks]


@router.post("/bookmarks", response_model=BookmarkResponse, status_code=status.HTTP_201_CREATED)
async def create_bookmark(
    bookmark_in: BookmarkCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    bookmark = Bookmark(
        user_id=current_user.id,
        book_id=bookmark_in.book_id,
        cfi=bookmark_in.cfi,
        note=bookmark_in.note
    )
    db.add(bookmark)
    await db.commit()
    await db.refresh(bookmark)
    return BookmarkResponse.model_validate(bookmark)
