"""
Pydantic schemas for the Song Recommendation API.
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class Track(BaseModel):
    track_id: str
    track_name: str
    artists: str
    album_name: str = ""
    track_genre: str = ""
    duration_ms: int = 0
    explicit: bool = False
    popularity: int = 0
    artwork_url: Optional[str] = None
    artist_image_url: Optional[str] = None
    # Audio features (optional on light responses)
    danceability: Optional[float] = None
    energy: Optional[float] = None
    valence: Optional[float] = None
    acousticness: Optional[float] = None
    instrumentalness: Optional[float] = None
    liveness: Optional[float] = None
    speechiness: Optional[float] = None
    tempo: Optional[float] = None
    loudness: Optional[float] = None


class TrackResponse(Track):
    match_score: float = 0.0
    match_tier: str = "good"
    match_reasons: List[str] = Field(default_factory=list)


class RecommendationRequest(BaseModel):
    track_id: str
    n_recommendations: int = Field(default=20, ge=1, le=50)


class RecommendationResponse(BaseModel):
    recommendations: List[TrackResponse]
    query_track: Optional[Track] = None


class SearchResponse(BaseModel):
    tracks: List[Track]
    total: int


class GenreCount(BaseModel):
    name: str
    count: int


class GenresResponse(BaseModel):
    genres: List[str]
    counts: Optional[List[GenreCount]] = None
    hot_counts: Optional[List[GenreCount]] = None


class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"


# ===== Wrapped =====

class WrappedRequest(BaseModel):
    track_ids: List[str] = Field(default_factory=list, max_length=20)
    genres: List[str] = Field(default_factory=list, max_length=10)


class TopGenre(BaseModel):
    name: str
    track_count: int


class TopArtist(BaseModel):
    name: str
    track_count: int
    image_url: Optional[str] = None


class AudioProfile(BaseModel):
    features: dict
    baseline: dict


class Personality(BaseModel):
    id: str
    name: str
    description: str
    traits: List[str]
    color: str


class Discovery(BaseModel):
    new_genres_count: int
    new_artists_count: int


class WrappedResponse(BaseModel):
    top_genre: TopGenre
    top_genres: List[TopGenre]
    top_artists: List[TopArtist]
    top_tracks: List[TrackResponse]
    minutes_estimate: int
    audio_profile: AudioProfile
    personality: Personality
    mood_label: str
    discovery: Discovery
    generated_at: str
    playlist: List[Track]