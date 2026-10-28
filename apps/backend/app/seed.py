"""
Database Seeding Script for PagePulse AI
Seeds the database with classical books containing valid Gutenberg EPUB download links and cover images.
"""

import asyncio
import json
import logging
from pathlib import Path
from typing import Any, Dict, List
import httpx
from sqlalchemy import select
from app.core.database import AsyncSessionLocal, engine
from app.models import Base, Book

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("pagepulse.seed")

FALLBACK_BOOKS: List[Dict[str, Any]] = [
    {
        "gutenberg_id": 84,
        "title": "Frankenstein; Or, The Modern Prometheus",
        "author": "Mary Wollstonecraft Shelley",
        "download_url": "https://www.gutenberg.org/ebooks/84.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/84/pg84.cover.medium.jpg",
        "format": "epub",
        "description": "Frankenstein tells the story of Victor Frankenstein, a young scientist who creates a sapient creature in an unorthodox scientific experiment.",
        "language": "en",
        "rating_count": 48200,
        "avg_rating": 4.85,
    },
    {
        "gutenberg_id": 1342,
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "download_url": "https://www.gutenberg.org/ebooks/1342.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg",
        "format": "epub",
        "description": "Pride and Prejudice follows the turbulent relationship between Elizabeth Bennet, the daughter of a country gentleman, and Fitzwilliam Darcy, a rich aristocratic landowner.",
        "language": "en",
        "rating_count": 52100,
        "avg_rating": 4.92,
    },
    {
        "gutenberg_id": 11,
        "title": "Alice's Adventures in Wonderland",
        "author": "Lewis Carroll",
        "download_url": "https://www.gutenberg.org/ebooks/11.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/11/pg11.cover.medium.jpg",
        "format": "epub",
        "description": "Alice's Adventures in Wonderland tells the story of a young girl named Alice who falls through a rabbit hole into a subterranean fantasy world.",
        "language": "en",
        "rating_count": 39400,
        "avg_rating": 4.78,
    },
    {
        "gutenberg_id": 1661,
        "title": "The Adventures of Sherlock Holmes",
        "author": "Arthur Conan Doyle",
        "download_url": "https://www.gutenberg.org/ebooks/1661.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/1661/pg1661.cover.medium.jpg",
        "format": "epub",
        "description": "A collection of twelve short stories featuring the master consulting detective Sherlock Holmes and Dr. John H. Watson.",
        "language": "en",
        "rating_count": 44300,
        "avg_rating": 4.88,
    },
    {
        "gutenberg_id": 345,
        "title": "Dracula",
        "author": "Bram Stoker",
        "download_url": "https://www.gutenberg.org/ebooks/345.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/345/pg345.cover.medium.jpg",
        "format": "epub",
        "description": "The novel tells the story of Count Dracula's attempt to move from Transylvania to England so that he may find new blood and spread the undead curse.",
        "language": "en",
        "rating_count": 36700,
        "avg_rating": 4.75,
    },
    {
        "gutenberg_id": 174,
        "title": "The Picture of Dorian Gray",
        "author": "Oscar Wilde",
        "download_url": "https://www.gutenberg.org/ebooks/174.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/174/pg174.cover.medium.jpg",
        "format": "epub",
        "description": "The story revolves around a portrait of Dorian Gray painted by Basil Hallward, which ages while Dorian stays forever young and hedonistic.",
        "language": "en",
        "rating_count": 31500,
        "avg_rating": 4.70,
    },
    {
        "gutenberg_id": 98,
        "title": "A Tale of Two Cities",
        "author": "Charles Dickens",
        "download_url": "https://www.gutenberg.org/ebooks/98.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/98/pg98.cover.medium.jpg",
        "format": "epub",
        "description": "Set in London and Paris before and during the French Revolution, the novel tells the story of the French Doctor Manette and his imprisonment.",
        "language": "en",
        "rating_count": 28900,
        "avg_rating": 4.65,
    },
    {
        "gutenberg_id": 2701,
        "title": "Moby Dick; Or, The Whale",
        "author": "Herman Melville",
        "download_url": "https://www.gutenberg.org/ebooks/2701.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/2701/pg2701.cover.medium.jpg",
        "format": "epub",
        "description": "The narrative of the sailor Ishmael and the obsessive quest of Ahab, captain of the whaling ship Pequod, for revenge against Moby Dick.",
        "language": "en",
        "rating_count": 26500,
        "avg_rating": 4.60,
    },
    {
        "gutenberg_id": 5200,
        "title": "The Metamorphosis",
        "author": "Franz Kafka",
        "download_url": "https://www.gutenberg.org/ebooks/5200.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/5200/pg5200.cover.medium.jpg",
        "format": "epub",
        "description": "Gregor Samsa, a traveling salesman, wakes up one morning to find himself inexplicably transformed into a monstrous insect.",
        "language": "en",
        "rating_count": 33100,
        "avg_rating": 4.72,
    },
    {
        "gutenberg_id": 64317,
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "download_url": "https://www.gutenberg.org/ebooks/64317.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/64317/pg64317.cover.medium.jpg",
        "format": "epub",
        "description": "The story primarily concerns the young and mysterious millionaire Jay Gatsby and his quixotic passion and obsession with Daisy Buchanan.",
        "language": "en",
        "rating_count": 41200,
        "avg_rating": 4.82,
    },
]


async def load_books() -> List[Dict[str, Any]]:
    # Check if raw JSON file exists
    raw_path = Path(__file__).resolve().parent.parent.parent.parent / "data-pipeline" / "raw" / "gutenberg_books.json"
    if raw_path.exists():
        try:
            with open(raw_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if data and isinstance(data, list):
                    logger.info(f"Loaded {len(data)} books from {raw_path}")
                    return data
        except Exception as e:
            logger.warning(f"Failed to read {raw_path}: {e}")

    # Try fetching online catalog from Gutendex
    try:
        logger.info("Fetching popular books live from Gutendex API...")
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get("https://gutendex.com/books?languages=en&sort=popular")
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                books: List[Dict[str, Any]] = []
                for item in results[:50]:
                    formats = item.get("formats", {})
                    epub_url = formats.get("application/epub+zip") or formats.get("application/x-mobipocket-ebook")
                    cover_url = formats.get("image/jpeg")
                    authors = item.get("authors", [])
                    author_name = authors[0].get("name", "Unknown Author") if authors else "Unknown Author"
                    if "," in author_name:
                        parts = [p.strip() for p in author_name.split(",", 1)]
                        author_name = f"{parts[1]} {parts[0]}"

                    summaries = item.get("summaries", [])
                    subjects = item.get("subjects", [])
                    description = summaries[0] if summaries else f"Classical work. Subjects: {', '.join(subjects[:3])}."

                    if epub_url:
                        books.append({
                            "gutenberg_id": item.get("id"),
                            "title": item.get("title", "Untitled").replace("\r\n", " "),
                            "author": author_name,
                            "download_url": epub_url,
                            "cover_url": cover_url,
                            "format": "epub",
                            "description": description,
                            "language": "en",
                            "rating_count": item.get("download_count", 0),
                            "avg_rating": round(min(5.0, 4.0 + (item.get("download_count", 0) / 50000.0)), 2),
                        })
                if books:
                    logger.info(f"Retrieved {len(books)} books from Gutendex API.")
                    return books
    except Exception as e:
        logger.warning(f"Could not connect to Gutendex API: {e}. Using bundled classical books.")

    return FALLBACK_BOOKS


async def seed_database():
    logger.info("Initializing database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Check existing count
        result = await session.execute(select(Book))
        existing_books = result.scalars().all()
        if existing_books:
            logger.info(f"Database already contains {len(existing_books)} books. Skipping seed.")
            return

        book_records = await load_books()
        added_count = 0
        for b in book_records:
            book = Book(
                gutenberg_id=b.get("gutenberg_id"),
                title=b["title"],
                author=b["author"],
                download_url=b.get("download_url"),
                cover_url=b.get("cover_url"),
                format=b.get("format", "epub"),
                description=b.get("description"),
                language=b.get("language", "en"),
                rating_count=b.get("rating_count", 0),
                avg_rating=b.get("avg_rating", 4.5),
            )
            session.add(book)
            added_count += 1

        await session.commit()
        logger.info(f"Database successfully seeded with {added_count} books in SQLite (pagepulse.db).")


if __name__ == "__main__":
    asyncio.run(seed_database())
