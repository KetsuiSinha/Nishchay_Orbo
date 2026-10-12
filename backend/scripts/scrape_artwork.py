#!/usr/bin/env python
"""
Artwork scraper: album covers + artist images for the dataset.

Sources (free, no API keys):
  1. Deezer public search API  -> album.cover_big + artist.picture_xl
  2. iTunes Search API (fallback) -> artworkUrl100 upscaled to 600x600

Results are cached incrementally to backend/artwork_cache.json so re-runs
only fetch missing tracks. Popular tracks are scraped first so a --limit
run covers everything the UI surfaces most.

Usage:
  python scripts/scrape_artwork.py --limit 500
  python scripts/scrape_artwork.py --genre pop --limit 200
  python scripts/scrape_artwork.py --all   (long!)
"""
import argparse
import json
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

BACKEND_DIR = Path(__file__).parent.parent
CACHE_PATH = BACKEND_DIR / "artwork_cache.json"
UA = {"User-Agent": "WrappedRecommendations/1.0 (educational project)"}


def http_json(url: str, timeout: int = 8) -> dict:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def deezer_lookup(track_name: str, artist: str) -> dict | None:
    try:
        q = urllib.parse.quote(f"{artist} {track_name}")
        data = http_json(f"https://api.deezer.com/search?q={q}&limit=1")
        if data.get("total"):
            t = data["data"][0]
            return {
                "artwork_url": t.get("album", {}).get("cover_big") or t.get("album", {}).get("cover_medium"),
                "artist_image_url": t.get("artist", {}).get("picture_xl")
                or t.get("artist", {}).get("picture_big"),
                "source": "deezer",
            }
    except Exception:
        pass
    return None


def itunes_lookup(track_name: str, artist: str) -> dict | None:
    try:
        q = urllib.parse.quote(f"{track_name} {artist}")
        data = http_json(f"https://itunes.apple.com/search?term={q}&entity=song&limit=1")
        if data.get("resultCount"):
            t = data["results"][0]
            url = t.get("artworkUrl100")
            if url:
                url = url.replace("100x100", "600x600")
            return {"artwork_url": url, "artist_image_url": None, "source": "itunes"}
    except Exception:
        pass
    return None


def lookup(track_name: str, artists: str) -> dict | None:
    primary = (artists or "").split(";")[0].strip()
    return deezer_lookup(track_name, primary) or itunes_lookup(track_name, primary)


def load_cache() -> dict:
    if CACHE_PATH.exists():
        try:
            return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}


def save_cache(cache: dict) -> None:
    CACHE_PATH.write_text(json.dumps(cache, indent=1), encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(description="Scrape album/artist artwork")
    ap.add_argument("--limit", type=int, default=300, help="Max tracks to scrape this run")
    ap.add_argument("--genre", type=str, default=None, help="Only scrape one genre")
    ap.add_argument("--all", action="store_true", help="Scrape everything (very slow)")
    ap.add_argument("--delay", type=float, default=0.12, help="Seconds between requests")
    args = ap.parse_args()

    from app.core.config import settings

    import pandas as pd

    df = pd.read_csv(settings.DATASET_PATH)
    if args.genre:
        df = df[df["track_genre"].str.lower() == args.genre.lower()]

    # Prioritise popular tracks so limited runs cover what the UI shows first
    df = df.sort_values("popularity", ascending=False).head(114000)

    cache = load_cache()
    todo = [row for _, row in df.iterrows() if row["track_id"] not in cache]
    if not args.all:
        todo = todo[: args.limit]

    print(f"Scraping {len(todo)} tracks ({len(cache)} already cached)...")
    ok = miss = 0
    for i, row in enumerate(todo):
        result = lookup(str(row["track_name"]), str(row["artists"]))
        if result and result.get("artwork_url"):
            cache[row["track_id"]] = result
            ok += 1
        else:
            cache[row["track_id"]] = {"artwork_url": None, "artist_image_url": None, "source": "none"}
            miss += 1

        if (i + 1) % 25 == 0:
            save_cache(cache)
            print(f"  {i + 1}/{len(todo)}  ok={ok} miss={miss}")
        time.sleep(args.delay)

    save_cache(cache)
    print(f"Done. ok={ok} miss={miss} total_cached={len(cache)} -> {CACHE_PATH}")


if __name__ == "__main__":
    main()
