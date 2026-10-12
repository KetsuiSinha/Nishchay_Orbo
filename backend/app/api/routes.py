"""
API routes for the Song Recommendation API.
"""
import logging
import re
from collections import Counter
from datetime import date, datetime, timezone
from typing import List, Optional

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException, Query, Request

from app.schemas import (
    Track,
    TrackResponse,
    RecommendationRequest,
    RecommendationResponse,
    SearchResponse,
    GenresResponse,
    GenreCount,
    WrappedRequest,
    WrappedResponse,
    TopGenre,
    TopArtist,
    AudioProfile,
    Personality,
    Discovery,
)

router = APIRouter()
logger = logging.getLogger(__name__)

SUFFIX_RE = re.compile(r"\s*[-–(]\s*(remaster|remastered|acoustic|live|piano|radio edit|mix|version|edit)\b.*$", re.I)

AUDIO_FEATURES = [
    "danceability", "energy", "valence", "acousticness",
    "instrumentalness", "liveness", "speechiness", "tempo", "loudness",
]


def get_state(request: Request):
    return request.app.state


def _clean(value) -> Optional[str]:
    """NaN / empty → None so Optional[str] fields validate."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    s = str(value)
    return s if s and s.lower() != "nan" else None


def row_to_track(row, with_features: bool = False) -> dict:
    d = {
        "track_id": str(row.get("track_id", "")),
        "track_name": str(row.get("track_name", "")),
        "artists": str(row.get("artists", "")),
        "album_name": str(row.get("album_name", "")),
        "track_genre": str(row.get("track_genre", "")),
        "duration_ms": int(row.get("duration_ms", 0) or 0),
        "explicit": bool(row.get("explicit", False)),
        "popularity": int(row.get("popularity", 0) or 0),
        "artwork_url": _clean(row.get("artwork_url")),
        "artist_image_url": _clean(row.get("artist_image_url")),
    }
    if with_features:
        for f in AUDIO_FEATURES:
            v = row.get(f)
            d[f] = float(v) if v is not None and not pd.isna(v) else None
    return d


def dedup_and_diversify(df: pd.DataFrame) -> pd.DataFrame:
    """De-duplicate by (normalised name, primary artist), strip version suffixes,
    cap 2 tracks per artist and ~40% per genre."""
    if df.empty:
        return df

    df = df.copy()
    df["_name"] = (
        df["track_name"].astype(str).apply(lambda s: SUFFIX_RE.sub("", s).strip().lower())
    )
    df["_artist"] = df["artists"].astype(str).apply(
        lambda s: s.split(";")[0].strip().lower()
    )
    df = df.drop_duplicates(subset=["_name", "_artist"])

    # cap 2 per artist
    df = df.groupby("_artist", group_keys=False).head(2)

    # cap ~40% per genre
    if not df.empty:
        cap = max(2, int(len(df) * 0.4))
        df = df.groupby("track_genre", group_keys=False).head(cap)

    return df.drop(columns=["_name", "_artist"])


def score_tiers(scores: np.ndarray) -> tuple:
    """Rank-normalise scores into 0.55–1.0 and assign tiers + reasons."""
    if len(scores) == 0:
        return scores, [], []
    lo, hi = float(scores.min()), float(scores.max())
    if hi - lo < 1e-9:
        norm = np.full_like(scores, 0.85)
    else:
        norm = 0.55 + (scores - lo) / (hi - lo) * 0.45

    tiers, reasons = [], []
    for s in norm:
        if s >= 0.92:
            tiers.append("perfect")
            reasons.append("Top match for your taste")
        elif s >= 0.78:
            tiers.append("great")
            reasons.append("Great fit for your taste")
        else:
            tiers.append("good")
            reasons.append("Solid match for your taste")
    return norm, tiers, reasons


# ===== Core endpoints =====

@router.get("/genres", response_model=GenresResponse)
async def get_genres(request: Request, with_counts: bool = False):
    state = get_state(request)
    if not hasattr(state, "encoder"):
        raise HTTPException(status_code=503, detail="Artifacts not loaded")

    genres: List[str] = state.encoder.categories_[0].tolist()
    counts = None
    hot_counts = None
    if with_counts and hasattr(state, "track_lookup"):
        tl: pd.DataFrame = state.track_lookup
        vc = tl["track_genre"].value_counts()
        counts = [GenreCount(name=g, count=int(vc.get(g, 0))) for g in genres]
        if "popularity" in tl.columns:
            hot = tl[tl["popularity"] >= 80].groupby("track_genre").size()
            hot_counts = [GenreCount(name=g, count=int(hot.get(g, 0))) for g in genres]
    return {"genres": genres, "counts": counts, "hot_counts": hot_counts}


@router.get("/search", response_model=SearchResponse)
async def search_tracks(
    request: Request,
    q: str = Query(..., min_length=1),
    limit: int = Query(default=20, ge=1, le=50),
):
    state = get_state(request)
    if not hasattr(state, "track_lookup"):
        raise HTTPException(status_code=503, detail="Artifacts not loaded")

    tl: pd.DataFrame = state.track_lookup
    mask = tl["track_name"].str.contains(q, case=False, na=False) | tl["artists"].str.contains(
        q, case=False, na=False
    )
    results = tl[mask].sort_values("popularity", ascending=False).head(limit)
    tracks = [row_to_track(row) for _, row in results.iterrows()]
    return {"tracks": tracks, "total": len(tracks)}


@router.post("/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: Request, body: RecommendationRequest):
    state = get_state(request)
    if not hasattr(state, "top_k_indices"):
        raise HTTPException(status_code=503, detail="Artifacts not loaded")

    tl: pd.DataFrame = state.track_lookup
    mapping = state.track_id_to_index
    if body.track_id not in mapping:
        raise HTTPException(status_code=404, detail=f"Track ID {body.track_id} not found")

    idx = mapping[body.track_id]
    k = int(getattr(state, "top_k", 100))
    sim_idx = state.top_k_indices[idx][:k]
    sim_scores = state.top_k_scores[idx][:k]

    valid = sim_idx < len(tl)
    sim_idx, sim_scores = sim_idx[valid], sim_scores[valid]

    candidates = tl.iloc[sim_idx].copy()
    candidates["_sim"] = sim_scores
    candidates = dedup_and_diversify(candidates)
    candidates = candidates.sort_values("_sim", ascending=False).head(body.n_recommendations)

    norm, tiers, reasons = score_tiers(candidates["_sim"].to_numpy())

    recommendations = []
    for i, (_, row) in enumerate(candidates.iterrows()):
        rec = row_to_track(row, with_features=True)
        recommendations.append(TrackResponse(
            **rec,
            match_score=round(float(norm[i]), 3),
            match_tier=tiers[i],
            match_reasons=[reasons[i]],
        ))

    query_track = Track(**row_to_track(tl.iloc[idx], with_features=True))
    return {"recommendations": recommendations, "query_track": query_track}


@router.get("/genres/{slug}/tracks")
async def get_genre_tracks(request: Request, slug: str, limit: int = Query(default=20, ge=1, le=50)):
    state = get_state(request)
    if not hasattr(state, "track_lookup"):
        raise HTTPException(status_code=503, detail="Artifacts not loaded")

    tl: pd.DataFrame = state.track_lookup
    mask = tl["track_genre"].str.lower() == slug.lower()
    results = tl[mask].sort_values("popularity", ascending=False).head(limit)
    tracks = [row_to_track(row, with_features=True) for _, row in results.iterrows()]

    # Artists to know
    artist_counts = (
        results["artists"].astype(str).apply(lambda s: s.split(";")[0].strip()).value_counts().head(8)
    )
    artists = []
    for name, _ in artist_counts.items():
        sub = results[results["artists"].str.contains(re.escape(name), na=False)]
        artists.append({
            "name": name,
            "track_count": int(artist_counts[name]),
            "image_url": sub.iloc[0].get("artist_image_url") if len(sub) else None,
        })
    return {"tracks": tracks, "artists": artists, "total_count": int(mask.sum())}


@router.get("/artists/{name}")
async def get_artist(request: Request, name: str, limit: int = Query(default=12, ge=1, le=50)):
    state = get_state(request)
    if not hasattr(state, "track_lookup"):
        raise HTTPException(status_code=503, detail="Artifacts not loaded")

    tl: pd.DataFrame = state.track_lookup
    mask = tl["artists"].astype(str).str.contains(re.escape(name), case=False, na=False)
    results = tl[mask].sort_values("popularity", ascending=False).head(limit)
    tracks = [row_to_track(row, with_features=True) for _, row in results.iterrows()]

    genres = [g for g, _ in Counter(results["track_genre"]).most_common(4)]
    image_url = tracks[0]["artist_image_url"] if tracks else None
    return {"artist": {"name": name, "image_url": image_url, "genres": genres}, "tracks": tracks}


# ===== Wrapped =====

def _personality(features: dict) -> Personality:
    v = features
    if v.get("acousticness", 0) > 0.5 and v.get("energy", 1) < 0.5:
        return Personality(id="daydreamer", name="The Daydreamer",
                           description="You drift through gentle, acoustic soundscapes.",
                           traits=["High acousticness", "Low energy", "Reflective"], color="#5038A0")
    if v.get("energy", 0) > 0.6 and v.get("danceability", 0) > 0.6:
        return Personality(id="hype-machine", name="The Hype Machine",
                           description="You live for the drop. Maximum energy, zero chill.",
                           traits=["High energy", "High danceability", "Driving tempo"], color="#FF6437")
    if v.get("valence", 0) > 0.6:
        return Personality(id="optimist", name="The Optimist",
                           description="Your soundtrack is sunshine and feel-good moments.",
                           traits=["High valence", "Positive", "Uplifting"], color="#CDF564")
    if v.get("instrumentalness", 0) > 0.4:
        return Personality(id="deep-diver", name="The Deep Diver",
                           description="You go beneath the surface into instrumental worlds.",
                           traits=["High instrumentalness", "Exploratory", "Complex"], color="#1E3264")
    if v.get("danceability", 0) > 0.6:
        return Personality(id="rhythm-seeker", name="The Rhythm Seeker",
                           description="Groove is everything. Your body leads, your mind follows.",
                           traits=["High danceability", "Strong groove", "Rhythmic"], color="#FF6437")
    return Personality(id="explorer", name="The Explorer",
                       description="Genre boundaries don't exist for you. Always searching.",
                       traits=["Curious", "Eclectic", "Adventurous"], color="#CDF564")


def _mood_label(valence: float, energy: float) -> str:
    if valence >= 0.5 and energy >= 0.5:
        return "Golden Hour"
    if valence >= 0.5 and energy < 0.5:
        return "Sweet Calm"
    if valence < 0.5 and energy >= 0.5:
        return "Dark Drive"
    return "Blue Hour"


@router.post("/wrapped", response_model=WrappedResponse)
async def generate_wrapped(request: Request, body: WrappedRequest):
    state = get_state(request)
    if not hasattr(state, "track_lookup"):
        raise HTTPException(status_code=503, detail="Artifacts not loaded")

    tl: pd.DataFrame = state.track_lookup
    mapping = state.track_id_to_index

    seed_tracks = tl[tl["track_id"].isin(body.track_ids)] if body.track_ids else tl.iloc[0:0]
    seed_genres = [g.lower() for g in body.genres]

    pool_parts = []
    for _, row in seed_tracks.iterrows():
        tid = row["track_id"]
        if tid in mapping:
            idx = mapping[tid]
            pool_parts.append(tl.iloc[state.top_k_indices[idx][:50]])
    for g in seed_genres:
        genre_rows = tl[tl["track_genre"].str.lower() == g]
        pool_parts.append(genre_rows.sort_values("popularity", ascending=False).head(30))

    if not pool_parts:
        raise HTTPException(status_code=400, detail="Provide seed track_ids and/or genres")

    pool = pd.concat(pool_parts).drop_duplicates(subset="track_id")
    seed_ids = set(seed_tracks["track_id"])
    pool = pool[~pool["track_id"].isin(seed_ids)]
    pool = dedup_and_diversify(pool)
    if pool.empty:
        raise HTTPException(status_code=400, detail="No recommendations found for seeds")

    # Genre counts
    genre_counts = Counter(pool["track_genre"])
    top_genres = [TopGenre(name=g, track_count=int(c)) for g, c in genre_counts.most_common(5)]
    top_genre = top_genres[0]

    # Artists
    artist_counts = Counter(pool["artists"].astype(str).apply(lambda s: s.split(";")[0].strip()))
    top_artists = []
    for name, c in artist_counts.most_common(5):
        sub = pool[pool["artists"].astype(str).str.startswith(name)]
        img = sub.iloc[0].get("artist_image_url") if len(sub) else None
        top_artists.append(TopArtist(name=name, track_count=int(c), image_url=img))

    # Tracks by popularity as proxy for match strength
    top_pool = pool.sort_values("popularity", ascending=False).head(20)
    scores = np.linspace(0.98, 0.62, len(top_pool))
    norm, tiers, reasons = score_tiers(scores)
    top_tracks = []
    for i, (_, row) in enumerate(top_pool.iterrows()):
        rec = row_to_track(row, with_features=True)
        top_tracks.append(TrackResponse(**rec, match_score=round(float(norm[i]), 3),
                                        match_tier=tiers[i], match_reasons=[reasons[i]]))

    # Audio profile + baseline
    feat_vals = {f: float(pool[f].mean()) for f in AUDIO_FEATURES if f in pool.columns}
    baseline = {f: float(tl[f].mean()) for f in AUDIO_FEATURES if f in tl.columns}

    # Minutes + playlist
    playlist_pool = pool.sort_values("popularity", ascending=False).head(10)
    minutes = int(playlist_pool["duration_ms"].sum() / 60000) if "duration_ms" in playlist_pool.columns else 0
    playlist = [Track(**row_to_track(r, with_features=True)) for _, r in playlist_pool.iterrows()]

    # Discovery
    new_genres = len(set(g.lower() for g in genre_counts) - set(seed_genres))
    seed_artists = set(seed_tracks["artists"].astype(str).apply(lambda s: s.split(";")[0].strip().lower()))
    new_artists = len(set(a.lower() for a in artist_counts) - seed_artists)

    return WrappedResponse(
        top_genre=top_genre,
        top_genres=top_genres,
        top_artists=top_artists,
        top_tracks=top_tracks,
        minutes_estimate=minutes,
        audio_profile=AudioProfile(features=feat_vals, baseline=baseline),
        personality=_personality(feat_vals),
        mood_label=_mood_label(feat_vals.get("valence", 0.5), feat_vals.get("energy", 0.5)),
        discovery=Discovery(new_genres_count=new_genres, new_artists_count=new_artists),
        generated_at=datetime.now(timezone.utc).isoformat(),
        playlist=playlist,
    )
