"""
Main application entry point for the Song Recommendation API.
"""
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.api import routes

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up Song Recommendation API...")
    artifacts_dir = settings.ARTIFACTS_DIR
    
    logger.info(f"ARTIFACTS_DIR: {artifacts_dir}")
    logger.info(f"ARTIFACTS_DIR exists: {artifacts_dir.exists()}")
    
    if not artifacts_dir.exists():
        logger.warning(f"Artifacts directory not found: {artifacts_dir}")
        logger.warning("Run the preprocessing script to generate artifacts.")
        yield
        return
    
    try:
        from app.services.data_loader import load_artifacts
        logger.info("Loading artifacts...")
        artifacts = load_artifacts(artifacts_dir)
        
        # Store artifacts in app.state (FastAPI's built-in state management)
        app.state.top_k_indices = artifacts["top_k_indices"]
        app.state.top_k_scores = artifacts["top_k_scores"]
        app.state.track_lookup = artifacts["track_lookup"]
        app.state.track_ids = artifacts["track_ids"]
        app.state.scaler = artifacts["scaler"]
        app.state.encoder = artifacts["encoder"]
        app.state.top_k = int(artifacts["top_k_scores"].shape[1])
        
        # Create track_id to index mapping
        app.state.track_id_to_index = {
            track_id: idx for idx, track_id in enumerate(artifacts["track_ids"])
        }
        
        logger.info("API startup complete!")
        logger.info(f"app.state keys: {list(app.state.__dict__.keys())}")
    except Exception as e:
        logger.error(f"Failed to load artifacts: {e}", exc_info=True)
    
    logger.info("Lifespan startup complete, yielding to app")
    yield
    
    # Shutdown
    logger.info("Shutting down Song Recommendation API...")
    # Clear app state
    if hasattr(app.state, '_state'):
        app.state._state.clear()


app = FastAPI(
    title="Song Recommendation API",
    description="API for song recommendations based on genre and audio feature similarity",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware — flexible parsing in settings (JSON array, CSV list, or "*")
_origins = settings.cors_origins
_wildcard = "*" in _origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=not _wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(routes.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


# ---------------------------------------------------------------------------
# Optional: serve the built frontend (single-service deploys).
# Activates automatically when spotify-frontend/dist exists. Registered LAST
# so /api, /docs, /health etc. always win.
# ---------------------------------------------------------------------------
FRONTEND_DIST: Path | None = settings.FRONTEND_DIST if settings.FRONTEND_DIST.is_dir() else None

if FRONTEND_DIST and (FRONTEND_DIST / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="spa-assets")
    logger.info(f"Serving frontend from {FRONTEND_DIST}")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        """SPA fallback: serve real files, route everything else to index.html."""
        if full_path.startswith(("api/", "docs", "openapi.json", "redoc")):
            raise HTTPException(status_code=404)
        candidate = (FRONTEND_DIST / full_path).resolve()
        if (
            full_path
            and candidate.is_file()
            and str(candidate).startswith(str(FRONTEND_DIST.resolve()))
        ):
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIST / "index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)