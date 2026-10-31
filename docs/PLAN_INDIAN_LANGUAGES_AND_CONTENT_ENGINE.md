# Implementation Plan — Root-Cause Fix for Modern Books & Multilingual Indian Language Engine

**Author:** Senior Staff Research & Systems Engineer  
**Date:** October 31, 2026  
**Status:** Awaiting User Review & Approval  

---

## 1. Goal Description

This implementation plan directly resolves the two critical discoveries reported by the user:

### Problem A: The "Rich Dad Poor Dad" 1-Page Reader Flaw
In the user's screenshots:
1. On the **Explore Screen**, *Rich Dad, Poor Dad* displayed a green **`FULL NOVEL`** badge.
2. When opened in the **Reader**, it showed only 1 page (`1 / 1`) with placeholder text:
   *"Masterpiece edition of Rich Dad, Poor Dad... Page 1 of 1"*.

#### Root Cause:
* *Rich Dad, Poor Dad* is a 1997 copyrighted book by Robert T. Kiyosaki. It is **not** in the public domain and does **not** exist in Project Gutenberg.
* In [BookCard.tsx](file:///e:/Book-Recommendation-System/apps/mobile/src/components/BookCard.tsx), the badge logic was:
  ```typescript
  const hasFullNovel = !!book.gutenberg_id || book.format === 'epub'; // BUG!
  ```
  Because our backend federation defaulted `format="epub"` for newly found OpenLibrary/Google Books volumes, the card falsely claimed `FULL NOVEL`. When opened, the reader had no Gutenberg chapters to download and fell back to a 1-page stub.

#### Solution:
1. **Truthful Badge System**:
   - 🟢 **`FULL NOVEL`**: Only shown if verified public domain text exists (`!!book.gutenberg_id`).
   - 🟣 **`AI SUMMARY & INSIGHTS`**: Shown for copyrighted/modern books.
2. **AI Executive Summary Reader Engine**:
   - For modern books without public domain text, instead of a 1-page dummy text, the reader dynamically generates and presents a structured **Blinkist-style Executive Summary with Chapter Key Lessons** powered by Gemini AI.

---

### Problem B: Multilingual Indian Language Catalog (Hindi, Marathi, Indian Literature)
The user requested adding books in **Hindi (हिन्दी)** and **Marathi (मराठी)** using open APIs.

#### Research on the 3 Proposed APIs:
1. **StoryWeaver (Pratham Books)**:
   - *Status*: Open-source platform (CC-BY 4.0), but has **no public API key/developer portal** for live external search queries.
   - *Strategy*: Curate and seed a permanent collection of top Hindi & Marathi StoryWeaver and National Book Trust classics directly into the catalog.
2. **Open Library Search API**:
   - *Status*: Supports language field queries: `language:hin` (Hindi) and `language:mar` (Marathi). 100% free with covers!
3. **Google Books API**:
   - *Status*: High-speed, high-resolution covers with `&langRestrict=hi` (Hindi) and `&langRestrict=mr` (Marathi). 100% free!
4. **Internet Archive API (`archive.org`)**:
   - *Status*: Millions of scanned public domain Indian texts with `language:(hindi)` and `language:(marathi)`.

---

## 2. User Review Required

> [!IMPORTANT]
> **Copyright vs Public Domain Differentiation**:
> Under international copyright law, modern books (published after 1928, like *Rich Dad Poor Dad*, *Atomic Habits*, *Harry Potter*) cannot legally be redistributed in full text for free.
> Our solution provides **Executive Summaries, Key Takeaways, and Chapter Breakdowns** for modern books, and **Full Unabridged Text** for public domain classics and open-licensed Indian literature.

---

## 3. Proposed Changes

### Component: Backend Federation & Language Engine (`apps/backend`)

#### [MODIFY] `apps/backend/app/api/v1/books.py`
* Add `language: Optional[str] = Query(None)` to `list_books`.
* Filter database records by `Book.language == language`.
* When querying Open Library, append `language:hin` for Hindi and `language:mar` for Marathi.
* When querying Google Books API, append `&langRestrict=hi` or `&langRestrict=mr`.
* For copyrighted books, set `gutenberg_id=None` and `format="overview"` so the client never mistakes them for full novels.
* Enhance `/books/{id}/content`: if `gutenberg_id` is null, generate a rich, multi-page **Executive Summary & Key Takeaways** using Gemini AI.

#### [MODIFY] `apps/backend/app/seed.py`
* Seed verified, beloved Hindi & Marathi public domain classics:
  - **Hindi**: *Godan (गोदान)* by Munshi Premchand, *Madhushala (मधुशाला)* by Harivansh Rai Bachchan, *Karmabhoomi (कर्मभूमि)*, *Gitanjali (गीतांजलि)*.
  - **Marathi**: *Mrutyunjay (मृत्युंजय)* by Shivaji Sawant, *Shyamchi Aai (श्यामची आई)* by Sane Guruji, *Yayati (ययाति)* by V.S. Khandekar, *Chhava (छावा)*.

---

### Component: Mobile UI & Badges (`apps/mobile`)

#### [MODIFY] `apps/mobile/src/components/BookCard.tsx`
* Fix badge logic:
  ```typescript
  // Truthful badge definition:
  const isFullNovel = !!book.gutenberg_id;
  ```
  - If `isFullNovel`: Render green 🟢 **`FULL NOVEL`**.
  - If not: Render purple 🟣 **`AI SUMMARY`** (so the user is never misled).

#### [MODIFY] `apps/mobile/app/(tabs)/explore.tsx`
* Add **Language Filter Bar**:
  - 🌐 *All Languages*
  - 🇬🇧 *English*
  - 🇮🇳 *हिन्दी (Hindi)*
  - 🚩 *मराठी (Marathi)*
* When a user taps *मराठी*, it instantly loads Marathi literature and searches with `language=mr`.

#### [MODIFY] `apps/mobile/app/reader/[bookId].tsx`
* Clean up reader UI:
  - Reposition the floating blue settings gear so it doesn't overlap reading text.
  - For books without Gutenberg full text, render an attractive **Executive Summary & Core Takeaways** canvas (5–8 pages of core concepts, chapter breakdown, and action steps) instead of a 1-page stub!

---

## 4. Verification Plan

### Automated Tests
1. **Backend Tests**:
   ```bash
   cd apps/backend && pytest tests/test_books.py -v
   ```
2. **TypeScript Compilation**:
   ```bash
   cd apps/mobile && npx tsc --noEmit
   ```

### Manual Verification
1. **Search "Rich Dad Poor Dad"**:
   - Verify card displays 🟣 **`AI SUMMARY`** instead of the misleading green `FULL NOVEL`.
   - Open in Reader: Verify it presents a structured, multi-page executive summary and key insights instead of a 1-page stub.
2. **Language Filter**:
   - Switch language filter to **मराठी (Marathi)** $\rightarrow$ verify books like *श्यामची आई (Shyamchi Aai)* and *मृत्युंजय (Mrutyunjay)* appear with Marathi titles and covers.
   - Switch language filter to **हिन्दी (Hindi)** $\rightarrow$ verify books like *गोदान (Godan)* and *मधुशाला (Madhushala)* appear.
3. **Reader Layout Polish**:
   - Verify the settings button no longer covers the reader text.

