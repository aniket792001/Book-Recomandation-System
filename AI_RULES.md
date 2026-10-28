# 🤖 AI Coding Agent Rules & Behavioral Directives

> **File:** `AI_RULES.md`  
> **Applicable Agents:** Cursor, Claude Code, GitHub Copilot, ChatGPT, Gemini, Antigravity, Windsurf  
> **Precedence:** STRICT PRIORITY (These rules override default model heuristics).

---

## 🚨 MANDATORY PROTOCOLS (NON-NEGOTIABLE)

### Rule 1: Mandatory Pre-Edit Context Verification
> **BEFORE making ANY code modification or file change, the AI Agent MUST read and verify the project markdown files:**
1. `CONTEXT.md` (to understand architecture and domain context)
2. `TASKS.md` (to check active tasks, file ownership, and dependencies)
3. `BRANDING_GUIDELINES.md` (to maintain exact styling and color tokens)
4. `ARCHITECTURE.md` (to ensure changes follow the system design)
5. `AI_RULES.md` (to adhere to editing and token conservation rules)

*Never assume file structures, variable names, or design tokens without checking these files.*

---

### Rule 2: Surgical, Token-Conservative Code Edits
> **Save tokens and avoid unnecessary rewrites at all costs.**
- **NO Unnecessary Line Replacements**: If only a single word, keyword, parameter, or typo needs to be changed, target **only that exact keyword or slice**. Do NOT replace an entire 50-line block or full function just to alter one variable.
- **NO Entire File Rewrites**: Never use whole-file overwrites when a targeted contiguous or multi-chunk edit is possible.
- **Minimal Context in Diff**: Keep diffs minimal and precise. Avoid reformatting unchanged lines, altering whitespace, or re-ordering imports unnecessarily.

---

### Rule 3: Design & Branding Invariance
- The project primary color **MUST REMAIN CONSTANT**: `#E285C3` (Orchid Rose).
- The secondary accent **MUST REMAIN CONSTANT**: `#818CF8` (Soft Indigo).
- The ambient glow / container tint **MUST REMAIN**: `#E0E7FF`.
- The dark mode background **MUST REMAIN**: `#0F172A`.
- **Never substitute** arbitrary bootstrap/tailwind generic colors (e.g. `bg-blue-500`, `text-red-500`) unless explicitly configured with our design tokens.

---

### Rule 4: Security & Sensitive Information Isolation
- **NEVER hardcode secrets**: No database passwords, JWT secret keys, API keys (Gemini, OpenLibrary, AWS, etc.) in source code.
- Always read secrets from environment variables via Pydantic `BaseSettings` (FastAPI) or `expo-constants` (Expo).
- Passwords must be hashed using `bcrypt` (minimum 12 rounds) or Argon2. Never log or store raw passwords in sessions, cookies, or logs.

---

### Rule 5: Architecture & Decoupling Guardrails
- **Backend**: Python 3.11+ with **FastAPI** (Async, Pydantic v2 schemas, SQLAlchemy 2.0 async ORM). No legacy Flask or raw SQL in new services.
- **Frontend**: **Expo React Native (TypeScript)** with file-based routing (`expo-router`). No web-only HTML/CSS inside React Native components.
- **Data Access**: All database operations must go through repositories or service layers. No business logic inside API route handlers.
- **Database**: PostgreSQL 16 with `pgvector` for vector similarity. Redis 7.2 for caching and rate limiting.

---

### Rule 6: Dependency & Version Control
- Check `package.json` and `requirements.txt` before importing third-party libraries.
- Do not introduce redundant or heavyweight dependencies without explicit architectural justification.
- Legacy preservation: The original Flask prototype in `Book-Recomandation-System/` (or `legacy/`) must remain intact as historical reference until fully deprecated.

---

### Rule 7: Task Registry Synchronization
- Whenever a feature is implemented, tested, or modified, immediately update `TASKS.md` with:
  - The status change (`[x]` for completed, `[/]` for in-progress).
  - The exact file path(s) touched.
  - Brief note on what functionality was added or revised.

---

## ⚡ Summary Checklist for AI Agent Actions

```text
[ ] Did I read CONTEXT.md and ARCHITECTURE.md before planning changes?
[ ] Is my edit surgical and minimal, conserving token usage?
[ ] Did I avoid overwriting entire files for minor changes?
[ ] Does the UI strictly use #E285C3 and the defined design tokens?
[ ] Are all sensitive keys in .env files?
[ ] Did I update TASKS.md after completing the task?
```
