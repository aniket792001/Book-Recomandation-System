"""
Book Content Engine for PagePulse AI
Fetches, cleans, segments, and caches authentic full-text books from Project Gutenberg.
"""

import json
import logging
import re
from pathlib import Path
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger("pagepulse.content")

# Directory for caching parsed book text on disk
CACHE_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)


def clean_gutenberg_text(raw_text: str) -> str:
    """Strip Gutenberg license headers and footers to keep only the pure novel text."""
    # Normalize Windows CRLF line endings
    raw_text = raw_text.replace("\r\n", "\n").replace("\r", "\n")

    # Find start marker
    start_patterns = [
        r"\*\*\* START OF THE PROJECT GUTENBERG[^\n]*\*\*\*",
        r"\*\*\* START OF THIS PROJECT GUTENBERG[^\n]*\*\*\*",
        r"START OF THE PROJECT GUTENBERG",
    ]
    start_pos = 0
    for p in start_patterns:
        match = re.search(p, raw_text, re.IGNORECASE)
        if match:
            start_pos = match.end()
            break

    # Find end marker
    end_patterns = [
        r"\*\*\* END OF THE PROJECT GUTENBERG[^\n]*\*\*\*",
        r"\*\*\* END OF THIS PROJECT GUTENBERG[^\n]*\*\*\*",
        r"End of the Project Gutenberg",
        r"End of Project Gutenberg",
    ]
    end_pos = len(raw_text)
    for p in end_patterns:
        match = re.search(p, raw_text, re.IGNORECASE)
        if match:
            end_pos = match.start()
            break

    novel_text = raw_text[start_pos:end_pos].strip()
    return novel_text


def split_into_chapters(novel_text: str, default_title: str) -> List[Dict[str, Any]]:
    """
    Intelligently splits a full novel into structured chapters.
    If no clear chapter pattern exists, segments into proportional reading pages.
    """
    # Regex to capture standard chapter headings: "CHAPTER I", "CHAPTER 1", "Chapter Twelve", etc.
    chapter_regex = re.compile(
        r"(?:^|\n\s*)\b(CHAPTER\s+[IVXLCDM\d]+[^\n]*|BOOK\s+[IVXLCDM\d]+[^\n]*|STAVE\s+[IVXLCDM\d]+[^\n]*|ACT\s+[IVXLCDM\d]+[^\n]*|[IVXLCDM]+\.\s+[A-Z\s]{4,}[^\n]*)\b",
        re.IGNORECASE,
    )

    matches = list(chapter_regex.finditer(novel_text))

    pages: List[Dict[str, Any]] = []

    if len(matches) >= 3:
        # Chapter-based splitting
        for i, match in enumerate(matches):
            chapter_title = match.group(1).strip()
            # Clean up trailing punctuation like "CHAPTER I.]"
            chapter_title = re.sub(r"[\]\.\:\-]+$", "", chapter_title).strip()

            content_start = match.end()
            content_end = matches[i + 1].start() if i + 1 < len(matches) else len(novel_text)

            body = novel_text[content_start:content_end].strip()
            # If body is substantial, create page
            if len(body) > 100:
                pages.append({
                    "page": len(pages) + 1,
                    "title": chapter_title,
                    "content": f"{chapter_title}\n\n{body}",
                })
    
    # If no chapters found or fewer than 3, split by ~2,500 characters on paragraph boundaries
    if not pages:
        paragraphs = novel_text.split("\n\n")
        current_chunk: List[str] = []
        current_len = 0
        page_num = 1

        for p in paragraphs:
            trimmed = p.strip()
            if not trimmed:
                continue
            current_chunk.append(trimmed)
            current_len += len(trimmed)

            if current_len >= 2500:
                pages.append({
                    "page": page_num,
                    "title": f"Section {page_num}",
                    "content": "\n\n".join(current_chunk),
                })
                page_num += 1
                current_chunk = []
                current_len = 0

        if current_chunk:
            pages.append({
                "page": page_num,
                "title": f"Section {page_num}",
                "content": "\n\n".join(current_chunk),
            })

    # Fallback guard
    if not pages:
        pages.append({
            "page": 1,
            "title": "Complete Text",
            "content": novel_text or "No text available.",
        })

    return pages


async def fetch_full_book_content(
    gutenberg_id: int,
    title: str = "Classic",
    author: str = "Author"
) -> List[Dict[str, Any]]:
    """
    Retrieves the full book text for a given Gutenberg ID.
    Caches parsed chapters on disk so subsequent reads take < 5ms.
    """
    cache_file = CACHE_DIR / f"{gutenberg_id}.json"

    # 1. Return from disk cache if exists
    if cache_file.exists():
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                logger.info(f"Loaded book {gutenberg_id} ({title}) from disk cache ({len(data)} chapters).")
                return data
        except Exception as e:
            logger.warning(f"Failed to read disk cache for book {gutenberg_id}: {e}")

    # 2. Download directly from Project Gutenberg CDN
    urls = [
        f"https://www.gutenberg.org/cache/epub/{gutenberg_id}/pg{gutenberg_id}.txt",
        f"https://www.gutenberg.org/files/{gutenberg_id}/{gutenberg_id}-0.txt",
        f"https://www.gutenberg.org/files/{gutenberg_id}/{gutenberg_id}.txt",
    ]

    raw_text: Optional[str] = None
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 PagePulse/1.0",
        "Accept": "text/plain,text/html,application/xhtml+xml",
    }
    async with httpx.AsyncClient(timeout=25.0, follow_redirects=True, headers=headers) as client:
        for url in urls:
            try:
                res = await client.get(url)
                if res.status_code == 200 and len(res.text) > 1000:
                    raw_text = res.text
                    break
            except Exception as e:
                logger.warning(f"Error fetching from {url}: {e}")

    if not raw_text:
        logger.error(f"Could not download full text for Gutenberg ID {gutenberg_id}")
        return []

    # 3. Clean and parse into chapters
    cleaned = clean_gutenberg_text(raw_text)
    pages = split_into_chapters(cleaned, title)

    # 4. Save to disk cache
    try:
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(pages, f, ensure_ascii=False, indent=2)
        logger.info(f"Successfully cached {len(pages)} chapters for {title} (ID: {gutenberg_id})")
    except Exception as e:
        logger.warning(f"Could not write cache file {cache_file}: {e}")

    return pages

