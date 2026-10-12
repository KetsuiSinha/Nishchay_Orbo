import numpy as np
import pandas as pd
import pickle
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import uvicorn

app = FastAPI(title='Song Recommendation API')

# Load the precomputed data
print('Loading precomputed data...')
top_k_indices = np.load('top_k_indices.npy', allow_pickle=True)
top_k_scores = np.load('top_k_scores.npy', allow_pickle=True)
track_lookup = pd.read_pickle('track_lookup.pkl')
track_ids = np.load('track_ids.npy', allow_pickle=True)
with open('feature_scaler.pkl', 'rb') as f:
    scaler = pickle.load(f)
with open('genre_encoder.pkl', 'rb') as f:
    encoder = pickle.load(f)

print('Data loaded successfully!')

# Create a mapping from track_id to index in the arrays
track_id_to_index = {track_id: idx for idx, track_id in enumerate(track_ids)}

class RecommendationRequest(BaseModel):
    track_id: str
    n_recommendations: int = 10

class TrackResponse(BaseModel):
    track_id: str
    track_name: str
    artists: str
    album_name: str
    track_genre: str
    similarity_score: float

@app.get('/health')
async def health():
    return {'status': 'ok'}

@app.get('/genres')
async def get_genres():
    genres = encoder.categories_[0].tolist()
    return {'genres': genres}

@app.get('/search')
async def search_tracks(q: str, limit: int = 10):
    # Simple search in track_name and artists
    mask = track_lookup['track_name'].str.contains(q, case=False) | track_lookup['artists'].str.contains(q, case=False)
    results = track_lookup[mask].head(limit)
    return results.to_dict(orient='records')

@app.post('/recommend', response_model=List[TrackResponse])
async def get_recommendations(request: RecommendationRequest):
    track_id = request.track_id
    n = request.n_recommendations
    
    if track_id not in track_id_to_index:
        raise HTTPException(status_code=404, detail=f'Track ID {track_id} not found')
    
    idx = track_id_to_index[track_id]
    # Get the top K indices and scores for this track
    similar_indices = top_k_indices[idx]
    similar_scores = top_k_scores[idx]
    
    # Filter out any invalid indices (shouldn't happen, but just in case)
    valid_mask = similar_indices < len(track_lookup)
    similar_indices = similar_indices[valid_mask]
    similar_scores = similar_scores[valid_mask]
    
    # Take top n
    if n < len(similar_indices):
        similar_indices = similar_indices[:n]
        similar_scores = similar_scores[:n]
    
    # Get the track details for the similar tracks
    recommended_tracks = track_lookup.iloc[similar_indices]
    
    # Build the response
    recommendations = []
    for i, (_, track) in enumerate(recommended_tracks.iterrows()):
        recommendations.append(TrackResponse(
            track_id=track['track_id'],
            track_name=track['track_name'],
            artists=track['artists'],
            album_name=track['album_name'],
            track_genre=track['track_genre'],
            similarity_score=float(similar_scores[i])
        ))
    
    return recommendations

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8000)
