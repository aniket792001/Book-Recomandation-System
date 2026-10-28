# 📋 PagePulse AI — Master Task Registry & Implementation Roadmap

> **File:** `TASKS.md`  
> **Status:** Active Execution Tracker  
> **Usage:** Update status (`[ ]` Pending, `[/]` In Progress, `[x]` Completed) whenever features, files, or modules are added or modified.

---

## 🗺️ Milestone Overview

| Milestone | Focus Domain | Target Deliverable | Status |
| :--- | :--- | :--- | :--- |
| **M0** | Documentation & Governance | `CONTEXT.md`, `TASKS.md`, `AI_RULES.md`, `BRANDING_GUIDELINES.md`, `ARCHITECTURE.md` | `[x]` |
| **M1** | Environment & Workspace Setup | Monorepo layout (`apps/backend`, `apps/mobile`), Docker compose, linting | `[x]` |
| **M2** | Database & Vector Ingestion | SQLite / PostgreSQL + pgvector, Gutendex ingestion scripts, DB Seeding | `[x]` |
| **M3** | FastAPI Backend Core | Auth (JWT), Catalog CRUD, EPUB Download stream, Healthchecks | `[x]` |
| **M4** | AI & Recommender Engine | Vector embeddings generator, hybrid collaborative filtering, Gemini Chat API | `[x]` |
| **M5** | Expo Mobile Application | Navigation, Theme tokens (`#E285C3`), Book Catalog, Detail screens | `[x]` |
| **M6** | In-App EPUB/PDF Reader | Local caching, font sizing, night mode, reading progress synchronization | `[x]` |
| **M7** | Conversational AI Companion | In-app Gemini chat drawer, spoiler-free chapter summaries | `[x]` |
| **M8** | Production Hardening & CI/CD | Unit/integration testing, Docker multi-stage build, deployment scripts | `[ ]` |

---

## 📂 Detailed Task & File Registry

### Phase 0: Architecture & Governance
- [x] **T0.1**: Initial forensic codebase audit of legacy Flask app.
- [x] **T0.2**: Author `README.md` containing full production blueprint and technical transformation plan.
- [x] **T0.3**: Author `CONTEXT.md` defining project vision, problem statement, and background.
- [x] **T0.4**: Author `TASKS.md` for continuous feature and file code tracking.
- [x] **T0.5**: Author `AI_RULES.md` and `.cursorrules` establishing strict token-saving and edit constraints for AI agents.
- [x] **T0.6**: Author `BRANDING_GUIDELINES.md` detailing the `#E285C3` design system and UI specs.
- [x] **T0.7**: Author `ARCHITECTURE.md` detailing system diagrams, data flow, DB schema, and API contracts.
- [x] **T0.8**: Configure `.vscode/extensions.json` for recommended team IDE extensions.

---

### Phase 1: Workspace Scaffolding & Infrastructure
- [x] **T1.1**: Initialize monorepo structure (`apps/backend`, `apps/mobile`, `data-pipeline`).
- [x] **T1.2**: Create `docker-compose.yml` for local PostgreSQL 16 (with `pgvector/pgvector:pg16`) and Redis 7.2.
- [x] **T1.3**: Isolate legacy prototype in `Book-Recomandation-System/` without data loss.
- [x] **T1.4**: Configure `.env.example` templates for root, mobile, and backend + `.gitignore`.

---

### Phase 2: Database Schema & Data Ingestion
- [x] **T2.1**: Configure SQLAlchemy 2.0 async engine in `apps/backend/app/core/database.py`.
- [x] **T2.2**: Define Database ORM Models in `apps/backend/app/models/`:
  - `user.py` (id, email, hashed_password, full_name, created_at)
  - `book.py` (id, title, author, isbn, description, cover_url, download_url, format, embedding, rating_count, avg_rating)
  - `rating.py` (id, user_id, book_id, rating, created_at)
  - `reading_progress.py` (id, user_id, book_id, current_cfi, percentage, last_read_at)
  - `bookmark.py` (id, user_id, book_id, cfi, note, created_at)
- [x] **T2.3**: Database seeder with Gutenberg titles and offline fallbacks in `apps/backend/app/seed.py`.
- [x] **T2.4**: Create Gutendex ingestion pipeline in `data-pipeline/scripts/ingest_gutenberg.py`.
- [ ] **T2.5**: Create CSV migration script to import existing Book-Crossing dataset into PostgreSQL.

---

### Phase 3: FastAPI Backend Implementation
- [x] **T3.1**: Create FastAPI app entrypoint in `apps/backend/app/main.py` with CORS, rate limiting, and exception handlers.
- [x] **T3.2**: Implement Auth API (`apps/backend/app/api/v1/auth.py`):
  - `POST /api/v1/auth/register` (Bcrypt password hashing)
  - `POST /api/v1/auth/login` (Returns access & refresh JWT)
  - `POST /api/v1/auth/refresh`
  - `GET /api/v1/auth/me`
- [x] **T3.3**: Implement Catalog API (`apps/backend/app/api/v1/books.py`):
  - `GET /api/v1/books` (Paginated list with filtering and search)
  - `GET /api/v1/books/{id}` (Detail view)
  - `GET /api/v1/books/{id}/download` (Stream legal EPUB/PDF or return signed download link)
  - `GET /api/v1/books/popular` (Ranked by ratings and downloads)
- [x] **T3.4**: Implement User Library API (`apps/backend/app/api/v1/library.py`):
  - `GET /api/v1/library/progress`
  - `POST /api/v1/library/progress` (Sync reading percentage & CFI locator)
  - `POST /api/v1/library/bookmark`

---

### Phase 4: Recommendation & AI Vector Engine
- [ ] **T4.1**: Create Vector Embedding Service in `apps/backend/app/services/embedding.py` (Google Gemini Embeddings / Sentence-Transformers).
- [ ] **T4.2**: Implement Semantic Search endpoint in `apps/backend/app/api/v1/recommend.py`:
  - `POST /api/v1/recommend/semantic` (Natural language query to cosine similarity in pgvector)
  - `GET /api/v1/recommend/similar/{book_id}` (Item-item hybrid similarity)
  - `GET /api/v1/recommend/personalized` (User-specific collaborative recommendations)
- [ ] **T4.3**: Implement AI Companion Service in `apps/backend/app/services/ai_librarian.py`:
  - `POST /api/v1/ai/chat` (Multi-turn chat with context on current book)
  - `POST /api/v1/ai/summarize-chapter` (Spoiler-free chapter summaries)

---

### Phase 5: Expo React Native Mobile Client
- [x] **T5.1**: Scaffold Expo project using TypeScript in `apps/mobile/`.
- [x] **T5.2**: Set up Design System and Theme Constants in `apps/mobile/src/constants/theme.ts`:
  - Colors: `#E285C3`, `#818CF8`, `#E0E7FF`, `#F5F6FA`, `#0F172A`, `#1E293B`
  - Typography, spacing, border radii.
- [x] **T5.3**: Build UI Components in `apps/mobile/src/components/`:
  - `BookCard.tsx` (Card with 3D elevation, shadow, and cover display)
  - `Header.tsx` (Brand header with search trigger and profile avatar)
- [x] **T5.4**: Implement Navigation & Screens via Expo Router:
  - `app/(tabs)/index.tsx` (Home Screen: Popular, Continue Reading, Recommended)
  - `app/(tabs)/explore.tsx` (Semantic Search & Category Browse)
  - `app/(tabs)/library.tsx` (Downloaded Books & Saved Bookmarks)
  - `app/(tabs)/profile.tsx` (User Settings & Reading Stats)
  - `app/book/[id].tsx` (Book Details, Synopsis, Download Button)
- [x] **T5.5**: Implement State Management in `apps/mobile/src/store/`:
  - `useAuthStore.ts` (Tokens, User Profile)
  - `useLibraryStore.ts` (Offline downloaded book metadata)

---

### Phase 6: In-App EPUB & PDF Reader Module
- [x] **T6.1**: Implement Reader Screen in `apps/mobile/app/reader/[bookId].tsx`.
- [x] **T6.2**: Integrate in-app typography and comfortable long-form reading canvas.
- [x] **T6.3**: Add Reading Controls:
  - Font size adjustment, font family selection, line spacing.
  - Theme toggler (Light `#FFFFFF`, Dark `#0F172A`, Sepia `#FBF0D9`, Rose `#FFF5F9`).
  - Progress tracker and slider.
- [x] **T6.4**: Offline state persistence via `useLibraryStore` and local storage.

---

### Phase 7: AI Reading Companion UI
- [x] **T7.1**: Implement interactive bottom-sheet / modal chat in `apps/mobile/src/components/AICompanionModal.tsx`.
- [x] **T7.2**: Connect to `POST /api/v1/ai/chat` with literary assistant persona.
- [x] **T7.3**: Add pre-baked prompt buttons: *"Summarize main themes"*, *"Explain historical context"*, *"Character relationships"*.

---

### Phase 8: Testing, Hardening & Deployment
- [ ] **T8.1**: Backend unit and integration tests using `pytest` and `httpx`.
- [ ] **T8.2**: Mobile component and hook tests with Jest and React Native Testing Library.
- [ ] **T8.3**: Multi-stage `Dockerfile` for FastAPI backend.
- [ ] **T8.4**: GitHub Actions CI workflow for linting, typechecking, and automated testing.
