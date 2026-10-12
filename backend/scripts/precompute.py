#!/usr/bin/env python
"""
Preprocessing script for the Song Recommendation System.

This script loads the dataset, computes similarities, and saves artifacts
for the FastAPI backend to serve recommendations.
"""
import logging
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings
from app.services.data_loader import (
    load_dataset,
    select_essential_columns,
    handle_missing_values,
    scale_audio_features,
    encode_genres,
    save_artifacts,
)
from app.services.similarity import compute_top_k_similarities

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def preprocess_data():
    """Main preprocessing pipeline."""
    logger.info("Starting preprocessing pipeline...")
    
    # Load the dataset
    df = load_dataset(settings.DATASET_PATH)
    
    # Select relevant columns
    audio_features = settings.AUDIO_FEATURES
    essential_cols = [
        "track_id",
        "track_name",
        "artists",
        "album_name",
        "track_genre",
    ] + audio_features
    
    df_essential = select_essential_columns(df, audio_features, essential_cols)
    
    # Handle missing values
    df_essential = handle_missing_values(df_essential)
    
    # Scale audio features
    features_scaled, scaler = scale_audio_features(df_essential, audio_features)
    
    # Encode genres
    genre_encoded, encoder = encode_genres(df_essential)
    
    # Compute top-K similarities
    top_k_indices, top_k_scores = compute_top_k_similarities(
        features_scaled=features_scaled,
        genre_encoded=genre_encoded,
        k=settings.TOP_K,
        chunk_size=settings.CHUNK_SIZE,
        audio_weight=settings.AUDIO_WEIGHT,
        genre_weight=settings.GENRE_WEIGHT,
    )
    
    # Save artifacts
    save_artifacts(
        top_k_indices=top_k_indices,
        top_k_scores=top_k_scores,
        scaler=scaler,
        encoder=encoder,
        df_essential=df_essential,
        track_ids=df_essential["track_id"].values,
        backend_dir=settings.BACKEND_DIR,
    )
    
    logger.info("Preprocessing complete!")
    return df_essential, audio_features, encoder.categories_[0]


if __name__ == "__main__":
    preprocess_data()