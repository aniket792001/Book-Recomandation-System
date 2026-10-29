# Production Dockerfile for PagePulse AI FastAPI Backend
# Fully compatible with Hugging Face Spaces, Render, Railway, Fly.io & Docker
FROM python:3.11-slim

# Prevent Python from buffering stdout and writing bytecode
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=7860

WORKDIR /app

# Install system dependencies (curl for healthcheck, build-essential for C-extensions)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Create non-root user (required by Hugging Face Spaces security sandbox)
RUN useradd -m -u 1000 user && \
    mkdir -p /app/data/cache && \
    chown -R user:user /app

# Copy backend source code and pre-cached book files with proper ownership
COPY --chown=user:user app/ ./app/
COPY --chown=user:user data/ ./data/

USER user

# Healthcheck to verify the server is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-7860}/docs || exit 1

# Expose ports: 7860 (Hugging Face Spaces default) and 8000 (standard web default)
EXPOSE 7860 8000

# Run Uvicorn listening on dynamic PORT
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]


