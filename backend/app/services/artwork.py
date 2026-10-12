"""
Artwork cache service: merges scraped artwork into the track lookup.
"""
import json
import logging
from pathlib import Path

import pandas as pd

logger = logging.getLogger(__name__)


def load_artwork_cache(artifacts_dir: Path) -> dict:
    """Load artwork_cache.json if present."""
    cache_path = artifacts_dir / "artwork_cache.json"
    if cache_path.exists():
        try:
            cache = json.loads(cache_path.read_text(encoding="utf-8"))
            logger.info(f"Loaded artwork cache with {len(cache)} entries")
            return cache
        except Exception as e:
            logger.warning(f"Failed to read artwork cache: {e}")
    return {}


def apply_artwork(track_lookup: pd.DataFrame, cache: dict) -> pd.DataFrame:
    """Add artwork_url / artist_image_url columns from the cache."""
    if not cache:
        track_lookup["artwork_url"] = None
        track_lookup["artist_image_url"] = None
        return track_lookup

    art_map = {tid: v.get("artwork_url") for tid, v in cache.items()}
    img_map = {tid: v.get("artist_image_url") for tid, v in cache.items()}
    # Map missing keys to NaN → normalise to None so Pydantic accepts them
    track_lookup["artwork_url"] = (
        track_lookup["track_id"].map(art_map).astype(object).where(pd.notna, None)
    )
    track_lookup["artist_image_url"] = (
        track_lookup["track_id"].map(img_map).astype(object).where(pd.notna, None)
    )
    logger.info(
        f"Artwork applied: {track_lookup['artwork_url'].notna().sum()} covers, "
        f"{track_lookup['artist_image_url'].notna().sum()} artist images"
    )
    return track_lookup


def apply_supplement_fields(track_lookup: pd.DataFrame, dataset_path: str) -> pd.DataFrame:
    """Merge duration_ms / popularity / explicit from the raw dataset CSV."""
    try:
        supplement = pd.read_csv(
            dataset_path,
            usecols=["track_id", "duration_ms", "popularity", "explicit"],
        ).drop_duplicates(subset="track_id")
        track_lookup = track_lookup.merge(supplement, on="track_id", how="left")
        track_lookup["duration_ms"] = track_lookup["duration_ms"].fillna(210000)
        track_lookup["popularity"] = track_lookup["popularity"].fillna(0)
        track_lookup["explicit"] = track_lookup["explicit"].fillna(False).astype(bool)
        logger.info("Supplement fields (duration/popularity/explicit) merged")
    except Exception as e:
        logger.warning(f"Could not merge supplement fields: {e}")
        for col, default in (("duration_ms", 210000), ("popularity", 0), ("explicit", False)):
            if col not in track_lookup.columns:
                track_lookup[col] = default
    return track_lookup
