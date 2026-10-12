"""
Main application entry point for the Song Recommendation API.
"""
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(routes.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)