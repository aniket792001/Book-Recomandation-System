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
    {
        "gutenberg_id": 1184,
        "title": "The Count of Monte Cristo",
        "author": "Alexandre Dumas",
        "download_url": "https://www.gutenberg.org/ebooks/1184.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/1184/pg1184.cover.medium.jpg",
        "format": "epub",
        "description": "Edmond Dantès is falsely accused of treason, arrested, and imprisoned without trial, leading to an extraordinary epic of escape and retribution.",
        "language": "en",
        "rating_count": 55400,
        "avg_rating": 4.90,
    },
    {
        "gutenberg_id": 2554,
        "title": "Crime and Punishment",
        "author": "Fyodor Dostoevsky",
        "download_url": "https://www.gutenberg.org/ebooks/2554.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/2554/pg2554.cover.medium.jpg",
        "format": "epub",
        "description": "Raskolnikov, a destitute former student in Saint Petersburg, commits a murder believing himself an extraordinary man beyond ordinary moral laws.",
        "language": "en",
        "rating_count": 46800,
        "avg_rating": 4.86,
    },
    {
        "gutenberg_id": 244,
        "title": "A Study in Scarlet",
        "author": "Arthur Conan Doyle",
        "download_url": "https://www.gutenberg.org/ebooks/244.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/244/pg244.cover.medium.jpg",
        "format": "epub",
        "description": "The landmark mystery marking the very first appearance of Sherlock Holmes and Dr. John H. Watson.",
        "language": "en",
        "rating_count": 38900,
        "avg_rating": 4.80,
    },
    {
        "gutenberg_id": 1727,
        "title": "The Odyssey",
        "author": "Homer",
        "download_url": "https://www.gutenberg.org/ebooks/1727.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/1727/pg1727.cover.medium.jpg",
        "format": "epub",
        "description": "The epic tale of Odysseus's ten-year journey home to Ithaca after the fall of Troy, confronting mythical beasts and wrathful gods.",
        "language": "en",
        "rating_count": 43200,
        "avg_rating": 4.78,
    },
    {
        "gutenberg_id": 6130,
        "title": "The Iliad",
        "author": "Homer",
        "download_url": "https://www.gutenberg.org/ebooks/6130.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/6130/pg6130.cover.medium.jpg",
        "format": "epub",
        "description": "Set during the Trojan War, chronicling the wrath of Achilles and the fierce battles outside the walls of Troy.",
        "language": "en",
        "rating_count": 39800,
        "avg_rating": 4.74,
    },
    {
        "gutenberg_id": 2600,
        "title": "War and Peace",
        "author": "Leo Tolstoy",
        "download_url": "https://www.gutenberg.org/ebooks/2600.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/2600/pg2600.cover.medium.jpg",
        "format": "epub",
        "description": "Tolstoy's monumental chronicle of Russian society during the Napoleonic era, tracing the interconnected fortunes of five aristocratic families.",
        "language": "en",
        "rating_count": 47900,
        "avg_rating": 4.84,
    },
    {
        "gutenberg_id": 1399,
        "title": "Anna Karenina",
        "author": "Leo Tolstoy",
        "download_url": "https://www.gutenberg.org/ebooks/1399.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/1399/pg1399.cover.medium.jpg",
        "format": "epub",
        "description": "The tragic romantic story of Countess Anna Karenina and her scandalous affair with the affluent Count Vronsky.",
        "language": "en",
        "rating_count": 42100,
        "avg_rating": 4.82,
    },
    {
        "gutenberg_id": 28054,
        "title": "The Brothers Karamazov",
        "author": "Fyodor Dostoevsky",
        "download_url": "https://www.gutenberg.org/ebooks/28054.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/28054/pg28054.cover.medium.jpg",
        "format": "epub",
        "description": "A passionate philosophical drama exploring faith, doubt, morality, and patricide through three Russian brothers.",
        "language": "en",
        "rating_count": 45300,
        "avg_rating": 4.88,
    },
    {
        "gutenberg_id": 768,
        "title": "Wuthering Heights",
        "author": "Emily Brontë",
        "download_url": "https://www.gutenberg.org/ebooks/768.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/768/pg768.cover.medium.jpg",
        "format": "epub",
        "description": "A turbulent gothic story of passion and vengeance on the bleak Yorkshire moors between Heathcliff and Catherine Earnshaw.",
        "language": "en",
        "rating_count": 46500,
        "avg_rating": 4.79,
    },
    {
        "gutenberg_id": 1260,
        "title": "Jane Eyre",
        "author": "Charlotte Brontë",
        "download_url": "https://www.gutenberg.org/ebooks/1260.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/1260/pg1260.cover.medium.jpg",
        "format": "epub",
        "description": "An orphaned governess falls in love with the brooding Mr. Rochester, discovering dark secrets hidden within Thornfield Hall.",
        "language": "en",
        "rating_count": 49800,
        "avg_rating": 4.87,
    },
    {
        "gutenberg_id": 1400,
        "title": "Great Expectations",
        "author": "Charles Dickens",
        "download_url": "https://www.gutenberg.org/ebooks/1400.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/1400/pg1400.cover.medium.jpg",
        "format": "epub",
        "description": "The coming-of-age journey of the orphan Pip as an unknown benefactor transforms his fortunes in Victorian England.",
        "language": "en",
        "rating_count": 41500,
        "avg_rating": 4.76,
    },
    {
        "gutenberg_id": 35,
        "title": "The Time Machine",
        "author": "H.G. Wells",
        "download_url": "https://www.gutenberg.org/ebooks/35.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/35/pg35.cover.medium.jpg",
        "format": "epub",
        "description": "A Victorian scientist invents a machine that transports him into the distant future to discover the gentle Eloi and monstrous Morlocks.",
        "language": "en",
        "rating_count": 37800,
        "avg_rating": 4.75,
    },
    {
        "gutenberg_id": 36,
        "title": "The War of the Worlds",
        "author": "H.G. Wells",
        "download_url": "https://www.gutenberg.org/ebooks/36.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/36/pg36.cover.medium.jpg",
        "format": "epub",
        "description": "The terrifying invasion of Earth by Martian tripod fighting machines equipped with heat-rays and poisonous black smoke.",
        "language": "en",
        "rating_count": 43100,
        "avg_rating": 4.81,
    },
    {
        "gutenberg_id": 120,
        "title": "Treasure Island",
        "author": "Robert Louis Stevenson",
        "download_url": "https://www.gutenberg.org/ebooks/120.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/120/pg120.cover.medium.jpg",
        "format": "epub",
        "description": "Young Jim Hawkins embarks on a dangerous sea voyage seeking buried pirate treasure, matched against Long John Silver.",
        "language": "en",
        "rating_count": 44900,
        "avg_rating": 4.83,
    },
    {
        "gutenberg_id": 43,
        "title": "The Strange Case of Dr. Jekyll and Mr. Hyde",
        "author": "Robert Louis Stevenson",
        "download_url": "https://www.gutenberg.org/ebooks/43.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/43/pg43.cover.medium.jpg",
        "format": "epub",
        "description": "A respected London physician concocts a potion that physically separates his civilized personality from his depraved impulses.",
        "language": "en",
        "rating_count": 45200,
        "avg_rating": 4.82,
    },
    {
        "gutenberg_id": 164,
        "title": "Twenty Thousand Leagues Under the Sea",
        "author": "Jules Verne",
        "download_url": "https://www.gutenberg.org/ebooks/164.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/164/pg164.cover.medium.jpg",
        "format": "epub",
        "description": "Professor Aronnax is held captive aboard the futuristic submarine Nautilus, captained by the mysterious Captain Nemo.",
        "language": "en",
        "rating_count": 46100,
        "avg_rating": 4.85,
    },
    {
        "gutenberg_id": 103,
        "title": "Around the World in Eighty Days",
        "author": "Jules Verne",
        "download_url": "https://www.gutenberg.org/ebooks/103.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/103/pg103.cover.medium.jpg",
        "format": "epub",
        "description": "Phileas Fogg and his French valet Passepartout attempt to circumnavigate the globe in 80 days on a 20,000-pound wager.",
        "language": "en",
        "rating_count": 42700,
        "avg_rating": 4.79,
    },
    {
        "gutenberg_id": 215,
        "title": "The Call of the Wild",
        "author": "Jack London",
        "download_url": "https://www.gutenberg.org/ebooks/215.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/215/pg215.cover.medium.jpg",
        "format": "epub",
        "description": "Buck, a domesticated St. Bernard mix, is stolen from his California home and forced into brutal service as a Yukon sled dog.",
        "language": "en",
        "rating_count": 39500,
        "avg_rating": 4.78,
    },
    {
        "gutenberg_id": 1232,
        "title": "The Prince",
        "author": "Niccolò Machiavelli",
        "download_url": "https://www.gutenberg.org/ebooks/1232.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/1232/pg1232.cover.medium.jpg",
        "format": "epub",
        "description": "The fundamental Renaissance treatise on political statecraft, power dynamics, pragmatic leadership, and ruler sovereignty.",
        "language": "en",
        "rating_count": 48200,
        "avg_rating": 4.73,
    },
    {
        "gutenberg_id": 2680,
        "title": "Meditations",
        "author": "Marcus Aurelius",
        "download_url": "https://www.gutenberg.org/ebooks/2680.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/2680/pg2680.cover.medium.jpg",
        "format": "epub",
        "description": "Personal stoic philosophical reflections of the Roman Emperor on resilience, duty, wisdom, and inner peace.",
        "language": "en",
        "rating_count": 56700,
        "avg_rating": 4.93,
    },
    {
        "gutenberg_id": 132,
        "title": "The Art of War",
        "author": "Sun Tzu",
        "download_url": "https://www.gutenberg.org/ebooks/132.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/132/pg132.cover.medium.jpg",
        "format": "epub",
        "description": "The timeless ancient Chinese military strategy treatise on tactical positioning, psychology, and victory without battle.",
        "language": "en",
        "rating_count": 61200,
        "avg_rating": 4.91,
    },
    {
        "gutenberg_id": 2852,
        "title": "The Hound of the Baskervilles",
        "author": "Arthur Conan Doyle",
        "download_url": "https://www.gutenberg.org/ebooks/2852.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/2852/pg2852.cover.medium.jpg",
        "format": "epub",
        "description": "Sherlock Holmes and Dr. Watson investigate the legendary curse of a demonic, spectral hound haunting the Devon moors.",
        "language": "en",
        "rating_count": 51900,
        "avg_rating": 4.91,
    },
    {
        "gutenberg_id": 135,
        "title": "Les Misérables",
        "author": "Victor Hugo",
        "download_url": "https://www.gutenberg.org/ebooks/135.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/135/pg135.cover.medium.jpg",
        "format": "epub",
        "description": "The epic tale of ex-convict Jean Valjean's struggle for redemption amidst the social turmoil of 19th-century France.",
        "language": "en",
        "rating_count": 53200,
        "avg_rating": 4.92,
    },
    {
        "gutenberg_id": 55,
        "title": "The Wonderful Wizard of Oz",
        "author": "L. Frank Baum",
        "download_url": "https://www.gutenberg.org/ebooks/55.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/55/pg55.cover.medium.jpg",
        "format": "epub",
        "description": "Dorothy and her dog Toto are whisked away by a Kansas cyclone to the magical Land of Oz.",
        "language": "en",
        "rating_count": 42900,
        "avg_rating": 4.80,
    },
    {
        "gutenberg_id": 996,
        "title": "Don Quixote",
        "author": "Miguel de Cervantes",
        "download_url": "https://www.gutenberg.org/ebooks/996.epub3.images",
        "cover_url": "https://www.gutenberg.org/cache/epub/996/pg996.cover.medium.jpg",
        "format": "epub",
        "description": "An eccentric Spanish hidalgo loses his wits reading chivalric romances and sets out with his squire Sancho Panza to revive chivalry.",
        "language": "en",
        "rating_count": 48900,
        "avg_rating": 4.83,
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
        # Check existing books by gutenberg_id and title to avoid duplicates
        result = await session.execute(select(Book))
        existing_books = result.scalars().all()
        existing_gutenberg_ids = {b.gutenberg_id for b in existing_books if b.gutenberg_id}
        existing_titles = {b.title.lower() for b in existing_books}

        book_records = await load_books()
        added_count = 0
        for b in book_records:
            gid = b.get("gutenberg_id")
            title = b["title"]
            if gid in existing_gutenberg_ids or title.lower() in existing_titles:
                continue

            book = Book(
                gutenberg_id=gid,
                title=title,
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

        if added_count > 0:
            await session.commit()
            logger.info(f"Database seeded with {added_count} new books! Total catalog: {len(existing_books) + added_count} books.")
        else:
            logger.info(f"Catalog is up-to-date with {len(existing_books)} books. No new books needed.")


if __name__ == "__main__":
    asyncio.run(seed_database())
