"""
Similarity computation utilities for the Song Recommendation API.
"""
import logging
from typing import Tuple

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from app.core.config import settings

logger = logging.getLogger(__name__)


def compute_similarities(
    features_scaled: np.ndarray,
    genre_encoded: np.ndarray,
    audio_weight: float,
    genre_weight: float,
) -> np.ndarray:
    """Compute combined similarity matrix."""
    logger.info("Computing similarity matrices")
    audio_sim = cosine_similarity(features_scaled, features_scaled)
    genre_sim = cosine_similarity(genre_encoded, genre_encoded)
    combined_sim = audio_weight * audio_sim + genre_weight * genre_sim
    logger.info(f"Combined similarity matrix shape: {combined_sim.shape}")
    return combined_sim


def compute_top_k_similarities(
    features_scaled: np.ndarray,
    genre_encoded: np.ndarray,
    k: int,
    chunk_size: int,
    audio_weight: float,
    genre_weight: float,
) -> Tuple[np.ndarray, np.ndarray]:
    """Compute top-K similar tracks for each track using chunking to save memory."""
    logger.info(f"Computing top-{k} similar tracks for each track")
    n_tracks = features_scaled.shape[0]
    n_chunks = (n_tracks + chunk_size - 1) // chunk_size

    # Arrays to store the top K similar tracks for each track
    top_k_indices = np.zeros((n_tracks, k), dtype=int)
    top_k_scores = np.zeros((n_tracks, k), dtype=float)

    logger.info(f"Computing top-{k} similarities in {n_chunks} chunks")

    for i in range(n_chunks):
        start = i * chunk_size
        end = min(start + chunk_size, n_tracks)

        logger.info(f"Processing chunk {i+1}/{n_chunks} (tracks {start} to {end-1})")

        # Compute similarity for tracks[start:end] to all tracks
        audio_sim = cosine_similarity(features_scaled[start:end], features_scaled)
        genre_sim = cosine_similarity(genre_encoded[start:end], genre_encoded)
        combined_sim_chunk = audio_weight * audio_sim + genre_weight * genre_sim

        # Set the diagonal to -inf for tracks that are in this chunk
        for j in range(start, end):
            idx_in_chunk = j - start
            combined_sim_chunk[idx_in_chunk, j] = -np.inf

        # For each track in the chunk, get the top K similar tracks
        for j in range(start, end):
            idx_in_chunk = j - start
            sim_row = combined_sim_chunk[idx_in_chunk]
            # Get the indices of the top K similar tracks
            top_k_idx = np.argpartition(sim_row, -k)[-k:]
            # Sort the top K indices by similarity in descending order
            top_k_idx = top_k_idx[np.argsort(sim_row[top_k_idx])][::-1]
            top_k_score_vals = sim_row[top_k_idx]

            # Store in the arrays
            top_k_indices[j] = top_k_idx
            top_k_scores[j] = top_k_score_vals

        # Print progress
        if (i + 1) % 10 == 0 or i + 1 == n_chunks:
            logger.info(f"  Completed {i+1} chunks")

    logger.info("Top-K similarities computed")
    return top_k_indices, top_k_scores