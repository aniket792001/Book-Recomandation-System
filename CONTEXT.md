# 📖 PagePulse AI — Project Context & Master Specification

> **File:** `CONTEXT.md`  
> **Status:** Active Reference Document  
> **Target Audience:** Core Developers, AI Coding Assistants, Tech Leads, Reviewers  
> **Last Updated:** October 2026  

---

## 1. Executive Summary & Vision

**PagePulse AI** is an end-to-end, AI-powered book discovery, recommendation, and digital reading platform. 

The project originated as an academic final-year machine learning project—a basic monolithic Flask web application capable only of displaying book covers and titles based on a static in-memory collaborative filtering matrix.

### The Transformation Vision:
The vision is to evolve this prototype into a **production-grade, commercial digital library and smart reading companion**. 
Users will not merely view book titles; they will:
1. **Search intelligently** using natural language and semantic mood queries (*"A rainy-day mystery with clever plot twists"*).
2. **Receive real-time, hybrid recommendations** blending collaborative filtering with dense vector embeddings.
3. **Download and read full books in-app** via legal public-domain and open-access APIs (Project Gutenberg, Open Library, Standard Ebooks).
4. **Interact with an AI Reading Companion** (powered by Google Gemini) for non-spoiler chapter summaries, character explanations, and personalized reading plans.

---

## 2. Problem Statement & Market Opportunity

### Current Market Gaps:
- **Goodreads**: Clunky, legacy UI, no integrated reader, outdated recommendation algorithm heavily biased toward legacy popularity.
- **Amazon Kindle / Apple Books**: Locked ecosystems, closed DRM, lack interactive conversational AI for text analysis and comprehension.
- **Academic Recommender Systems**: Rarely offer actual book downloads or usable mobile reading interfaces; limited to static offline rating datasets.

### PagePulse AI Solution:
A cross-platform mobile application (iOS/Android/Web) connected to a high-throughput, async Python backend. It couples legal digital book acquisition (EPUB/PDF download and offline rendering) with bleeding-edge generative AI comprehension tools.

---

## 3. Heritage & Technical Evolution

```
┌────────────────────────────────────────────────────────┐
│ Phase 1: Prototype (Legacy Flask Monolith)             │
│ - Tech: Flask, MySQL (raw queries), HTML templates     │
│ - Storage: 80MB+ raw .pkl files loaded into RAM        │
│ - Recommender: Static cosine similarity on 706 books   │
│ - Deficiencies: In-memory bloat, plaintext passwords   │
└──────────────────────────┬─────────────────────────────┘
                           │ EVOLUTION
                           ▼
┌────────────────────────────────────────────────────────┐
│ Phase 2: Production Scale (PagePulse AI Cloud-Native)   │
│ - Mobile Frontend: React Native + Expo (TypeScript)    │
│ - Backend API: FastAPI (Python 3.11+, ASGI, Async)     │
│ - Database: PostgreSQL 16 + pgvector                   │
│ - Cache & Queues: Redis 7.2 (Sessions, Rate limits)    │
│ - Book Ingestion: Gutendex & Open Library APIs         │
│ - In-App Reader: Native EPUB & PDF rendering engine    │
│ - AI Intelligence: Gemini 2.5 + Dense Vector Embeddings│
└────────────────────────────────────────────────────────┘
```

---

## 4. Target User Personas

1. **The Voracious Classic Reader**:
   Wants free, legal access to high-quality public domain books with custom fonts, night mode, and offline reading capability.
2. **The Mood-Driven Explorer**:
   Doesn't know exact book titles; searches by vibe, emotional tone, or abstract themes (*"Fast-paced sci-fi like Interstellar but in a medieval setting"*).
3. **The Literature Student**:
   Needs intelligent comprehension assistance—asking the AI Companion to summarize complex classical chapters or clarify character connections without spoiling the ending.

---

## 5. Core Architectural Pillars

- **Decoupled Architecture**: Strictly headless REST/WebSocket APIs separating mobile presentation from compute logic.
- **Security & Privacy First**: Zero plaintext credential storage; OAuth2 with short-lived JWTs and hashed tokens via bcrypt.
- **High-Performance Vector Search**: pgvector-indexed similarity queries executing under 25ms over hundreds of thousands of books.
- **Offline-First Mobile UX**: Reading progress, bookmarks, and downloaded EPUBs remain 100% accessible offline via local storage.

---

## 6. Project Glossary & Acronyms

- **CF**: Collaborative Filtering (User-Item rating correlation).
- **NCF**: Neural Collaborative Filtering.
- **pgvector**: PostgreSQL vector similarity search extension (HNSW / IVFFlat indexes).
- **OPDS**: Open Publication Distribution System (standard protocol for electronic publications).
- **Gutendex**: Modern JSON REST API for the 70,000+ Project Gutenberg books catalog.
- **JWT**: JSON Web Token (used for stateless API authorization).
- **ASGI**: Asynchronous Server Gateway Interface (underpins FastAPI/Uvicorn).
