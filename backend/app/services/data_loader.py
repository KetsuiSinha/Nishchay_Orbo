"""
Data loading utilities for the Song Recommendation API.
"""
import logging
from pathlib import Path
from typing import Tuple

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, OneHotEncoder

from app.core.config import settings

logger = logging.getLogger(__name__)


def load_dataset(dataset_path: str | None = None) -> pd.DataFrame:
    """Load the dataset from CSV."""
    path = dataset_path or settings.DATASET_PATH
    logger.info(f"Loading dataset from {path}")
    df = pd.read_csv(path)
    logger.info(f"Dataset loaded with shape {df.shape}")
    return df


def select_essential_columns(
    df: pd.DataFrame,
    audio_features: list[str],
    essential_cols: list[str],
) -> pd.DataFrame:
    """Select essential columns from the dataset."""
    logger.info("Selecting essential columns")
    df_essential = df[essential_cols].copy()
    logger.info(f"Essential columns shape: {df_essential.shape}")
    return df_essential


def handle_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    """Handle missing values by filling with column means for numeric columns."""
    logger.info("Handling missing values")
    missing_before = df.isnull().sum().sum()
    logger.info(f"Missing values before handling: {missing_before}")

    # Fill numeric columns with their mean
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())

    missing_after = df.isnull().sum().sum()
    logger.info(f"Missing values after handling: {missing_after}")
    return df


def scale_audio_features(
    df: pd.DataFrame, audio_features: list[str]
) -> Tuple[np.ndarray, StandardScaler]:
    """Scale audio features using StandardScaler."""
    logger.info("Scaling audio features")
    scaler = StandardScaler()
    features_scaled = scaler.fit_transform(df[audio_features])
    logger.info(f"Audio features scaled to shape: {features_scaled.shape}")
    return features_scaled, scaler


def encode_genres(df: pd.DataFrame) -> Tuple[np.ndarray, OneHotEncoder]:
    """One-hot encode genres."""
    logger.info("Encoding genres")
    encoder = OneHotEncoder(sparse_output=False)
    genre_encoded = encoder.fit_transform(df[["track_genre"]])
    logger.info(f"Genres encoded to shape: {genre_encoded.shape}")
    logger.info(f"Number of unique genres: {len(encoder.categories_[0])}")
    return genre_encoded, encoder


def save_artifacts(
    top_k_indices: np.ndarray,
    top_k_scores: np.ndarray,
    scaler: StandardScaler,
    encoder: OneHotEncoder,
    df_essential: pd.DataFrame,
    track_ids: np.ndarray,
    artifacts_dir: Path,
) -> None:
    """Save precomputed artifacts to disk."""
    logger.info("Saving artifacts")

    # Save top K indices and scores
    indices_path = artifacts_dir / "top_k_indices.npy"
    np.save(indices_path, top_k_indices)
    logger.info(f"Saved top K indices to {indices_path}")

    scores_path = artifacts_dir / "top_k_scores.npy"
    np.save(scores_path, top_k_scores)
    logger.info(f"Saved top K scores to {scores_path}")

    # Save scaler
    scaler_path = artifacts_dir / "feature_scaler.pkl"
    import pickle

    with open(scaler_path, "wb") as f:
        pickle.dump(scaler, f)
    logger.info(f"Saved feature scaler to {scaler_path}")

    # Save genre encoder
    encoder_path = artifacts_dir / "genre_encoder.pkl"
    with open(encoder_path, "wb") as f:
        pickle.dump(encoder, f)
    logger.info(f"Saved genre encoder to {encoder_path}")

    # Save the essential dataframe for lookup
    df_lookup_path = artifacts_dir / "track_lookup.pkl"
    df_essential.to_pickle(df_lookup_path)
    logger.info(f"Saved track lookup dataframe to {df_lookup_path}")

    # Save track IDs
    track_ids_path = artifacts_dir / "track_ids.npy"
    np.save(track_ids_path, track_ids)
    logger.info(f"Saved track IDs to {track_ids_path}")


def load_artifacts(artifacts_dir: Path) -> dict:
    """Load precomputed artifacts from disk."""
    logger.info("Loading artifacts")

    import pickle

    top_k_indices = np.load(artifacts_dir / "top_k_indices.npy", allow_pickle=True).astype(np.int32)
    top_k_scores = np.load(artifacts_dir / "top_k_scores.npy", allow_pickle=True).astype(np.float32)
    track_lookup = pd.read_pickle(artifacts_dir / "track_lookup.pkl")
    track_ids = np.load(artifacts_dir / "track_ids.npy", allow_pickle=True)

    with open(artifacts_dir / "feature_scaler.pkl", "rb") as f:
        scaler = pickle.load(f)

    with open(artifacts_dir / "genre_encoder.pkl", "rb") as f:
        encoder = pickle.load(f)

    # Enrich lookup with duration/popularity/explicit + scraped artwork
    try:
        from app.services.artwork import apply_artwork, apply_supplement_fields, load_artwork_cache

        track_lookup = apply_supplement_fields(track_lookup, settings.DATASET_PATH)
        track_lookup = apply_artwork(track_lookup, load_artwork_cache(artifacts_dir))
    except Exception as e:
        logger.warning(f"Lookup enrichment skipped: {e}")

    logger.info("Artifacts loaded successfully")
    return {
        "top_k_indices": top_k_indices,
        "top_k_scores": top_k_scores,
        "track_lookup": track_lookup,
        "track_ids": track_ids,
        "scaler": scaler,
        "encoder": encoder,
    }