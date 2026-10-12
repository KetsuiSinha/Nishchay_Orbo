import os
from pathlib import Path
from config import settings
from data_loader import (
    load_dataset,
    select_essential_columns,
    handle_missing_values,
    scale_audio_features,
    encode_genres
)
from similarity import compute_similarities, compute_top_k_similarities

# Configure logging
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def preprocess_data():
    # Load the dataset
    df = load_dataset(settings.DATASET_PATH)
    
    # Select relevant columns
    audio_features = settings.AUDIO_FEATURES
    essential_cols = ['track_id', 'track_name', 'artists', 'album_name', 'track_genre'] + audio_features
    df_essential = select_essential_columns(df, audio_features, essential_cols)
    
    # Handle missing values if any
    df_essential = handle_missing_values(df_essential)
    
    # Normalize audio features
    features_scaled, scaler = scale_audio_features(df_essential, audio_features)
    
    # One-hot encode genres
    genre_encoded, encoder = encode_genres(df_essential)
    
    # Compute similarities
    combined_sim = compute_similarities(
        features_scaled,
        genre_encoded,
        settings.AUDIO_WEIGHT,
        settings.GENRE_WEIGHT
    )
    
    # Compute top-K similarities
    top_k_indices, top_k_scores = compute_top_k_similarities(
        combined_sim,
        settings.TOP_K,
        settings.CHUNK_SIZE
    )
    
    # Save artifacts
    from data_loader import save_artifacts
    save_artifacts(
        top_k_indices,
        top_k_scores,
        scaler,
        encoder,
        df_essential,
        df_essential['track_id'].values,
        settings.BACKEND_DIR
    )
    
    logger.info('Preprocessing complete!')
    return df_essential, audio_features, encoder.categories_[0]

if __name__ == '__main__':
    preprocess_data()
