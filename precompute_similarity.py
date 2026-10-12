import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import os

def preprocess_data():
    # Load the dataset
    dataset_path = os.path.join('..', 'Nishchay_Orbo', 'dataset.csv')
    print('Loading dataset from ' + dataset_path)
    df = pd.read_csv(dataset_path)
    
    # Select relevant columns
    # We'll keep track_id, track_name, artists, album_name, track_genre, and audio features
    audio_features = ['danceability', 'energy', 'valence', 'acousticness', 
                     'instrumentalness', 'liveness', 'tempo', 'loudness', 'speechiness']
    
    # Create a dataframe with the essential information
    essential_cols = ['track_id', 'track_name', 'artists', 'album_name', 'track_genre'] + audio_features
    df_essential = df[essential_cols].copy()
    
    print('Dataset shape: ' + str(df_essential.shape))
    print('Unique genres: ' + str(df_essential['track_genre'].nunique()))
    
    # Handle missing values if any
    print('Missing values before handling: ' + str(df_essential.isnull().sum().sum()))
    df_essential = df_essential.fillna(df_essential.mean(numeric_only=True))
    print('Missing values after handling: ' + str(df_essential.isnull().sum().sum()))
    
    # Normalize audio features (scale 0-1, but we'll standardize for better cosine similarity)
    # Actually, the features are already in 0-1 range except tempo, loudness
    # Let's check the ranges
    print('Feature ranges before scaling:')
    for feature in audio_features:
        min_val = df_essential[feature].min()
        max_val = df_essential[feature].max()
        print(feature + ': [' + str(min_val) + ', ' + str(max_val) + ']')
    
    # Scale features to 0-1 range for consistency
    # For tempo, loudness we need to scale appropriately
    # But for simplicity, we'll use StandardScaler which gives zero mean, unit variance
    scaler = StandardScaler()
    features_scaled = scaler.fit_transform(df_essential[audio_features])
    
    # One-hot encode genres
    # Since each track has a single genre in this dataset
    encoder = OneHotEncoder(sparse_output=False)
    genre_encoded = encoder.fit_transform(df_essential[['track_genre']])
    
    print('Genre encoding shape: ' + str(genre_encoded.shape))
    print('Number of unique genres: ' + str(len(encoder.categories_[0])))
    
    # We will compute the top K similar tracks for each track
    K = 100  # Number of similar tracks to keep for each track
    chunk_size = 200  # Process in chunks to avoid memory issues
    n_tracks = len(df_essential)
    n_chunks = (n_tracks + chunk_size - 1) // chunk_size
    
    # Arrays to store the top K similar tracks for each track
    top_k_indices = np.zeros((n_tracks, K), dtype=int)
    top_k_scores = np.zeros((n_tracks, K), dtype=float)
    
    print('Computing top ' + str(K) + ' similar tracks for each track in ' + str(n_chunks) + ' chunks...')
    
    for i in range(n_chunks):
        start = i * chunk_size
        end = min(start + chunk_size, n_tracks)
        
        print('Processing chunk ' + str(i+1) + '/' + str(n_chunks) + ' (tracks ' + str(start) + ' to ' + str(end-1) + ')')
        
        # Compute similarity for tracks[start:end] to all tracks
        audio_sim = cosine_similarity(features_scaled[start:end], features_scaled)
        genre_sim = cosine_similarity(genre_encoded[start:end], genre_encoded)
        combined_sim = 0.6 * audio_sim + 0.4 * genre_sim
        
        # Set the diagonal to -inf for tracks that are in this chunk
        for j in range(start, end):
            idx_in_chunk = j - start
            combined_sim[idx_in_chunk, j] = -np.inf
        
        # For each track in the chunk, get the top K similar tracks
        for j in range(start, end):
            idx_in_chunk = j - start
            sim_row = combined_sim[idx_in_chunk]
            # Get the indices of the top K similar tracks
            # We use argpartition to get the top K indices efficiently
            top_k_idx = np.argpartition(sim_row, -K)[-K:]
            # Sort the top K indices by similarity in descending order
            top_k_idx = top_k_idx[np.argsort(sim_row[top_k_idx])][::-1]
            top_k_score_vals = sim_row[top_k_idx]
            
            # Store in the arrays
            top_k_indices[j] = top_k_idx
            top_k_scores[j] = top_k_score_vals
        
        # Print progress
        if (i+1) % 10 == 0 or i+1 == n_chunks:
            print('  Completed ' + str(i+1) + ' chunks')
    
    # Save artifacts
    # Create directories if they don't exist
    os.makedirs('.', exist_ok=True)
    
    # Save top K indices and scores
    indices_path = os.path.join('.', 'top_k_indices.npy')
    np.save(indices_path, top_k_indices)
    print('Saved top K indices to ' + indices_path)
    
    scores_path = os.path.join('.', 'top_k_scores.npy')
    np.save(scores_path, top_k_scores)
    print('Saved top K scores to ' + scores_path)
    
    # Save scaler
    scaler_path = os.path.join('.', 'feature_scaler.pkl')
    with open(scaler_path, 'wb') as f:
        pickle.dump(scaler, f)
    print('Saved feature scaler to ' + scaler_path)
    
    # Save genre encoder
    encoder_path = os.path.join('.', 'genre_encoder.pkl')
    with open(encoder_path, 'wb') as f:
        pickle.dump(encoder, f)
    print('Saved genre encoder to ' + encoder_path)
    
    # Save the essential dataframe for lookup (without the encoded features)
    # We'll save it as a pickle for fast loading
    df_lookup_path = os.path.join('.', 'track_lookup.pkl')
    df_essential.to_pickle(df_lookup_path)
    print('Saved track lookup dataframe to ' + df_lookup_path)
    
    # Also save the track_ids as a separate array for easy mapping
    track_ids_path = os.path.join('.', 'track_ids.npy')
    np.save(track_ids_path, df_essential['track_id'].values)
    print('Saved track_ids to ' + track_ids_path)
    
    print('Preprocessing complete!')
    return df_essential, audio_features, encoder.categories_[0]

if __name__ == '__main__':
    preprocess_data()