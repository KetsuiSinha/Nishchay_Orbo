# ---------- Stage 1: build the frontend ----------
FROM node:20-alpine AS frontend
WORKDIR /fe
COPY spotify-frontend/package*.json ./
RUN npm install
COPY spotify-frontend/ ./
RUN npm run build

# ---------- Stage 2: backend + built frontend ----------
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code + precomputed artifacts + dataset (must be committed to git)
COPY backend/ /app/
COPY dataset.csv /app/dataset.csv

# Built SPA served by FastAPI at the same origin
COPY --from=frontend /fe/dist /app/static

ENV DATASET_PATH=/app/dataset.csv \
    FRONTEND_DIST=/app/static \
    PYTHONDONTWRITEBYTECODE=1

RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/health', timeout=5)" || exit 1

# $PORT lets Render/HF inject their port; defaults to 8000 locally
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
