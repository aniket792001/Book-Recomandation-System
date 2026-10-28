from typing import Optional
from sqlalchemy import Float, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

try:
    from pgvector.sqlalchemy import Vector
    from sqlalchemy.ext.compiler import compiles

    @compiles(Vector, "sqlite")
    def compile_vector_sqlite(type_, compiler, **kw):
        return "TEXT"

    VectorType = Vector(768)
except ImportError:
    VectorType = JSON


class Book(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "books"

    title: Mapped[str] = mapped_column(String(512), index=True, nullable=False)
    author: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    isbn: Mapped[Optional[str]] = mapped_column(String(32), index=True, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cover_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    download_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    format: Mapped[str] = mapped_column(String(16), default="epub")  # epub, pdf
    
    # Ingestion tracking
    gutenberg_id: Mapped[Optional[int]] = mapped_column(Integer, unique=True, index=True, nullable=True)
    language: Mapped[str] = mapped_column(String(8), default="en")

    # Metrics
    rating_count: Mapped[int] = mapped_column(Integer, default=0)
    avg_rating: Mapped[float] = mapped_column(Float, default=0.0)

    # 768-dimensional dense vector embedding (Gemini / Sentence Transformers)
    embedding = mapped_column(VectorType, nullable=True)

    # Relationships
    ratings = relationship("Rating", back_populates="book", cascade="all, delete-orphan")
    reading_progress = relationship("ReadingProgress", back_populates="book", cascade="all, delete-orphan")
