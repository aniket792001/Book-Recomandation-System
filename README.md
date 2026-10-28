# 📚 PagePulse AI — Next-Generation Book Discovery & Digital Reading Ecosystem

> **Architecture Blueprint & Production Modernization Specification**  
> *Transforming a Prototype Recommendation Script into a High-Availability, Cloud-Native Mobile & Backend Platform.*

---

## 🎨 1. Brand Identity & Design System

The visual identity preserves the original application's warm, welcoming aesthetic while upgrading it to a sleek, modern UI/UX standard with glassmorphism, responsive elevation, and accessible contrast.

| Element | Hex Code | Purpose & Usage |
| :--- | :--- | :--- |
| **Primary Brand** | `#E285C3` | Accent highlights, active tabs, buttons, progress rings, hero badges |
| **Secondary Accent** | `#818CF8` | Secondary action buttons, AI chips, tags, gradient transitions |
| **Ambient Glow** | `#E0E7FF` | Soft gradient overlays, card container tints, hover fills |
| **Background (Light)**| `#F5F6FA` | Main screen background for daylight reading |
| **Background (Dark)** | `#0F172A` | Deep midnight blue for comfortable night-time reading |
| **Surface (Light)** | `#FFFFFF` | Elevated cards, bottom sheets, navigation bars |
| **Surface (Dark)** | `#1E293B` | Dark mode elevated containers, modals, and input fields |
| **Typography Dark** | `#222222` | Primary text in light mode |
| **Typography Light**| `#F8FAFC` | Primary text in dark mode |

---

## 🔍 2. Forensic Codebase Audit (Current State Review)

A deep-dive analysis into the existing codebase revealed several architectural bottlenecks, security vulnerabilities, and functional limitations:

```
Legacy Architecture (Prototype)
┌────────────────────────────────────────────────────────┐
│                      Flask App                         │
│  ┌──────────────────┐            ┌──────────────────┐  │
│  │   pickle.load    │            │  Raw MySQL Query │  │
│  │  (80MB in RAM)   │            │   (Hardcoded)    │  │
│  └────────┬─────────┘            └────────┬─────────┘  │
│           │                               │            │
│   In-Memory Cosine               Plaintext Password    │
│   Similarity (pt.pkl)             in session dict      │
└────────────────────────────────────────────────────────┘
```

### Critical Findings:
1. **Synchronous Memory Bloat**:
   - `app.py` loads `books.pkl` (71.7 MB), `pt.pkl` (4.6 MB), `similarity_scores.pkl` (4.0 MB), and `popular.pkl` at boot time into global memory.
   - As concurrent users increase or datasets expand, memory usage skyrockets, leading to worker Out-Of-Memory (OOM) crashes in production.
2. **Security Vulnerabilities**:
   - Database credentials (`root` / `Aniket@123`) and a placeholder `secret_key` are hardcoded directly in `app.py`.
   - Line 134: `session['password'] = password` stores the user's password directly in the client session cookie.
   - Raw SQL queries (`cursor.execute(...)`) are used without an ORM, lacking transaction safety, connection pooling, and schema migration tracking.
3. **Static Model Limitations**:
   - The collaborative filtering matrix only includes ~706 popular books (due to threshold filtering: books with $\ge 50$ ratings and users with $> 200$ ratings).
   - There is no dynamic feedback loop: when a new user registers or rates a book, the matrix cannot update in real-time without re-running the entire offline Jupyter Notebook.
4. **Coupled Presentation Layer**:
   - Server-side HTML rendering (`render_template`) mixes business logic with presentation, making mobile app integration impossible without a decoupled REST/GraphQL API.

---

## 📖 3. Digital Book Download & Reading Integration Strategy

To allow users to not only view book covers but actually **download and read books in-app**, we integrate legal, open-access, and public-domain book platforms:

### 3.1. Legal Open-Access Platforms & APIs
1. **Gutendex API (Project Gutenberg)**:
   - **Catalog**: 70,000+ public domain classics (Shakespeare, Austen, Conan Doyle, Tolstoy, etc.).
   - **Formats**: Direct links to `.epub`, `.mobi`, `.pdf`, and `.txt` files.
   - **Cost & Access**: 100% Free, open-source, no API keys required.
2. **Open Library & Internet Archive API**:
   - **Catalog**: 20+ million book records, bibliographic data, and full-text downloads for public-domain works.
   - **Covers API**: High-resolution cover images via `https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg`.
   - **Borrow/Read API**: Embedded web reader tokens via Internet Archive BookReader.
3. **Standard Ebooks**:
   - **Catalog**: Beautifully typeset, modern, curated public domain ebooks formatted to contemporary typographic standards.
   - **Format**: High-quality `.epub`, `.azw3`, and `.kepub` files.
4. **Google Books API**:
   - **Catalog**: Extensive metadata, synopsis, categories, page counts, preview links, and download links when the book is public domain.
   - **Commercial Books**: For copyrighted titles, users receive reading samples, affiliate purchase links, or public library finders (WorldCat).

---

## 🏗️ 4. Target Enterprise Architecture

```
                                  ┌────────────────────────┐
                                  │   Expo React Native    │
                                  │  (iOS / Android / Web) │
                                  └───────────┬────────────┘
                                              │ HTTPS / WSS
                                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                FastAPI Gateway & API                                   │
│  ┌───────────────────────┬───────────────────────┬──────────────────────────────────┐  │
│  │   Auth & Accounts     │   Catalog & Reader    │      Recommendation Engine       │  │
│  │ (JWT, OAuth2, Bcrypt) │ (Gutendex, S3/R2 CDN) │ (pgvector + Hybrid Collaborative)│  │
│  └───────────────────────┴───────────────────────┴──────────────────────────────────┘  │
└──────────────────┬──────────────────────┬──────────────────────┬───────────────────────┘
                   │                      │                      │
                   ▼                      ▼                      ▼
        ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
        │  PostgreSQL 16 DB  │ │   Redis Cache      │ │  LLM & AI Engine   │
        │    + pgvector      │ │ (Sessions, Ratelim)│ │ (Gemini 2.5/Embed) │
        └────────────────────┘ └────────────────────┘ └────────────────────┘
```

### 4.1. The AI Recommendation Engine Evolution
- **Phase 1: Hybrid Vector Search (Semantic Retrieval)**:
  - Generate 768-dimensional dense vector embeddings for book synopses, genres, and reader vibes using Google Gemini Embeddings / Sentence Transformers.
  - Store vectors in PostgreSQL using `pgvector`.
  - Enables natural language discovery: *"Cozy murder mystery set in an English village with eccentric characters."*
- **Phase 2: Real-time Neural Collaborative Filtering (NCF)**:
  - As users read, bookmark, and rate books, an asynchronous worker updates user-item interaction scores in real-time.
- **Phase 3: Conversational AI Librarian**:
  - In-app chatbot powered by Google Gemini that discusses plot points without spoilers, summarizes chapters, and provides tailored reading lists.

---

## 📁 5. Proposed Project Directory Structure

```text
Book-Recommendation-System/
├── apps/
│   ├── mobile/                        # Expo React Native Mobile Client
│   │   ├── app/                       # Expo Router (file-based routing)
│   │   │   ├── (auth)/                # Login, Register, Forgot Password
│   │   │   ├── (tabs)/                # Home, Discover, My Library, Profile
│   │   │   ├── reader/[bookId].tsx    # Native EPUB/PDF Reader
│   │   │   └── ai-librarian.tsx       # AI Conversational Assistant
│   │   ├── src/
│   │   │   ├── components/            # Reusable UI (BookCard, Button, Header)
│   │   │   ├── hooks/                 # Custom React Hooks (useReader, useAuth)
│   │   │   ├── services/              # API Client (Axios / TanStack Query)
│   │   │   ├── store/                 # Zustand Global State
│   │   │   └── constants/             # Theme tokens (#E285C3, #818CF8, etc.)
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── backend/                       # Python FastAPI Microservice
│       ├── app/
│       │   ├── api/v1/                # Versioned REST Endpoints
│       │   │   ├── auth.py            # Authentication & JWT tokens
│       │   │   ├── books.py           # Catalog, Details, and Downloads
│       │   │   ├── recommendations.py # ML & Vector Search endpoints
│       │   │   └── ai_chat.py         # LLM Librarian API
│       │   ├── core/                  # App Configuration, Security, DB session
│       │   ├── models/                # SQLAlchemy 2.0 ORM Entities
│       │   ├── schemas/               # Pydantic v2 Request/Response Models
│       │   ├── services/              # Business Logic & Recommendation Pipeline
│       │   │   ├── recommender.py     # Hybrid Recommendation Service
│       │   │   ├── embedding.py       # Vector Embedding Generation
│       │   │   └── gutenberg.py       # Public Domain Ingestion Client
│       │   └── main.py                # FastAPI Application Entrypoint
│       ├── alembic/                   # Database Migrations
│       ├── requirements.txt
│       └── Dockerfile
│
├── data-pipeline/                     # Offline ML Training & ETL
│   ├── notebooks/                     # Exploratory Data Analysis & Model Training
│   ├── scripts/                       # Ingestion & Vector Indexing Scripts
│   └── raw/                           # Dataset storage (excluded from Git)
│
├── docs/                              # Architecture Decisions & API Specs
├── legacy/                            # Original Flask Prototype Archive
│   └── Book-Recomandation-System/
├── docker-compose.yml                 # Local Dev Environment (Postgres, Redis, API)
└── README.md                          # Root Project Documentation
```

---

## 🚀 6. Step-by-Step Implementation Roadmap

1. **Step 1: Environment & Data Modernization**:
   - Set up PostgreSQL with the `pgvector` extension.
   - Migrate raw CSV data into normalized database tables (`books`, `users`, `ratings`, `downloads`).
   - Extract book metadata and compute initial vector embeddings.
2. **Step 2: FastAPI Core Development**:
   - Implement production authentication (JWT + bcrypt).
   - Expose endpoints for `/api/v1/books/popular`, `/api/v1/books/recommend`, `/api/v1/books/{id}/download`.
   - Integrate Gutendex/OpenLibrary APIs to fetch full text and legal download links.
3. **Step 3: Expo Mobile App Construction**:
   - Initialize Expo project with TypeScript and file-based routing.
   - Build custom theme engine adhering strictly to `#E285C3` and complementary colors.
   - Integrate native in-app reader (`epubjs-rn` / `react-native-pdf`).
4. **Step 4: AI Librarian & Semantic Search Integration**:
   - Implement natural language book search using vector cosine similarity.
   - Add the interactive AI Reading Companion powered by Gemini.
5. **Step 5: Production Deployment & Observability**:
   - Containerize services with Docker.
   - Set up CI/CD pipelines, rate limiting, and structured logging.
