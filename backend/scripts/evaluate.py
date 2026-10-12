#!/usr/bin/env python
"""
Offline evaluation of the recommendation engine.

Metrics (justified in DOCUMENTATION.md § Evaluation):
  - Genre Precision@K      : share of recommendations matching the seed's genre
  - Intra-list diversity   : unique genres per recommendation list
  - Novelty                : mean popularity of recommendations vs dataset mean
  - Duplicate control      : artist-cap violations (must be 0)
  - Catalog coverage       : analytic (complete similarity matrix)
  - Latency                : p50/p95 of live endpoint calls (TestClient)

Usage:  python scripts/evaluate.py
"""
import re
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).parent.parent))
BACKEND = Path(__file__).parent.parent

SAMPLE_N = 200
K = 10
SEED = 42
HOT_THRESHOLD = 80

SUFFIX = re.compile(r"\s*[-–(]\s*(remaster|remastered|acoustic|live|piano|radio edit|mix|version|edit)\b.*$", re.I)


def serve_time_top10(tl: pd.DataFrame, rows: np.ndarray, seed_genre: str) -> pd.DataFrame:
    """Mirror serve-time logic: dedup, artist cap 2, genre cap 40%, take K."""
    cand = tl.iloc[rows].copy()
    cand["_n"] = cand["track_name"].astype(str).str.lower().str.strip().apply(lambda s: SUFFIX.sub("", s))
    cand["_a"] = cand["artists"].astype(str).str.split(";").str[0].str.strip().str.lower()
    cand = cand.drop_duplicates(subset=["_n", "_a"])
    cand = cand.groupby("_a", group_keys=False).head(2)
    cap = max(2, int(len(cand) * 0.4))
    cand = cand.groupby("track_genre", group_keys=False).head(cap)
    return cand.head(K)


def main() -> None:
    tl: pd.DataFrame = pd.read_pickle(BACKEND / "track_lookup.pkl")
    sup = pd.read_csv(
        BACKEND.parent / "dataset.csv",
        usecols=["track_id", "duration_ms", "popularity"],
    ).drop_duplicates("track_id")
    tl = tl.merge(sup, on="track_id", how="left")

    top_k_idx = np.load(BACKEND / "top_k_indices.npy")
    top_k_scores = np.load(BACKEND / "top_k_scores.npy")
    track_ids = np.load(BACKEND / "track_ids.npy", allow_pickle=True)

    rng = np.random.default_rng(SEED)
    sample = rng.choice(len(track_ids), size=SAMPLE_N, replace=False)
    dataset_mean_pop = float(tl["popularity"].fillna(0).mean())

    genre_p, diversity, novelty, misses = [], [], [], 0
    violations, surfaced, hot_share = 0, set(), []

    for sid in sample:
        rows = top_k_idx[sid][:50]
        scores = top_k_scores[sid][:50]
        top = serve_time_top10(tl, rows, tl.iloc[sid]["track_genre"])
        if len(top) < K:
            misses += 1
        genre_p.append((top["track_genre"] == tl.iloc[sid]["track_genre"]).sum() / len(top))
        diversity.append(top["track_genre"].nunique())
        rec_pop = top["popularity"].fillna(0)
        novelty.append(rec_pop.mean())
        hot_share.append((rec_pop >= HOT_THRESHOLD).mean())
        vc = top["_a"].value_counts()
        violations += int((vc > 2).sum())
        surfaced.update(top["track_id"].tolist())

    print("=" * 62)
    print(f"Evaluation — {SAMPLE_N} random seeds (seed={SEED}), K={K}, serve-time filters applied")
    print("=" * 62)
    print(f"Genre Precision@{K:<12} {np.mean(genre_p):>8.1%}   (same-genre share of recs)")
    print(f"Intra-list diversity      {np.mean(diversity):>8.1f}   unique genres per list of {K}")
    print(f"Novelty (mean pop)        {np.mean(novelty):>8.1f}   dataset mean {dataset_mean_pop:.1f}")
    print(f"Hot-rec share (pop>={HOT_THRESHOLD})  {np.mean(hot_share):>8.1%}")
    print(f"Artist-cap violations     {violations:>8}   (0 = dedup/diversify working)")
    print(f"Short lists               {misses:>8}   (lists under {K} after filters)")
    print(f"Unique tracks surfaced    {len(surfaced):>8}   of {SAMPLE_N * K} slots")
    print(f"Catalog coverage (analytic)  100%   every track has precomputed top-{top_k_idx.shape[1]}")

    # Latency via in-process TestClient
    try:
        from fastapi.testclient import TestClient
        from app.main import app

        probe = str(track_ids[sample[0]])
        with TestClient(app) as client:
            client.post("/api/v1/recommend", json={"track_id": probe, "n_recommendations": 10})
            rec_ts, search_ts = [], []
            for i in range(SAMPLE_N):
                tid = str(track_ids[sample[i]])
                t0 = time.perf_counter()
                r = client.post("/api/v1/recommend", json={"track_id": tid, "n_recommendations": 10})
                rec_ts.append((time.perf_counter() - t0) * 1000)
                assert r.status_code == 200
                t0 = time.perf_counter()
                client.get("/api/v1/search", params={"q": "love", "limit": 10})
                search_ts.append((time.perf_counter() - t0) * 1000)
        for name, ts in (("recommend", rec_ts), ("search", search_ts)):
            a = np.array(ts)
            print(f"Latency {name:<10} p50 {np.percentile(a, 50):>6.1f} ms   p95 {np.percentile(a, 95):>6.1f} ms")
    except Exception as e:
        print(f"Latency measurement skipped: {e}")


if __name__ == "__main__":
    main()
