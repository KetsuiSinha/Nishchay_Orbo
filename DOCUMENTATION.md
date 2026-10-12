# Documentation — Wrapped Recommendations

A Spotify-Wrapped-style music discovery system built on a hybrid content-based recommendation engine over 114,000 tracks.

- **Live app**: deployed frontend + API (see `DEPLOY_ONLINE.md`)
- **Reproduce locally**: see §14
- **Reproduce evaluation**: `cd backend && python scripts/evaluate.py`

---

## 1. Problem Statement

Music discovery platforms assume behavioural data — plays, skips, playlists — that a new or private user simply does not have. Given a static catalogue of 114,000 tracks with metadata but **zero user interaction history**, build a system that:

1. Generates relevant, personalised song recommendations from minimal user input (a handful of seed genres/tracks).
2. Explains *why* each recommendation was made.
3. Presents the result as an engaging, story-driven experience rather than a table of IDs.

## 2. Use Case & Motivation

**Use case:** a listener opens the app, picks 3–10 genres and a few tracks they like, and receives (a) a personalised 11-slide "Wrapped" story summarising their taste profile, and (b) continuously explorable recommendations through Home shelves, genre pages, artist pages and track pages.

**Motivation:**
- Cold-start discovery is the weakest point of most recommenders; seeds + content similarity solve it without any login or history.
- Explanation builds trust — every recommendation ships with a match tier and reasons, and every track exposes its audio-feature profile.
- The Wrapped story format (one idea per slide, flat saturated colour, animated stats) is a proven, shareable presentation of a taste profile.

## 3. Approach

**Content-based hybrid similarity, precomputed for O(1) serving.**

1. Standardise 9 audio features (StandardScaler) and one-hot encode the genre label.
2. Compute cosine similarity over each representation.
3. Blend: `sim = 0.6 × audio_sim + 0.4 × genre_sim`.
4. For every track, keep only the **top-100 neighbours** (argpartition per chunk) → two 114,000 × 100 matrices.
5. At request time: index lookup → serve-time de-duplication/diversification → rank-normalised scores → tiered match labels.

Because there is no interaction history, collaborative filtering is impossible; the "personalisation" signal is the **seed set** (user-chosen genres/tracks) which drives neighbourhood pooling for the Wrapped payload.

## 4. System Architecture

```
┌───────────────────────────┐         ┌──────────────────────────────────┐
│  React 18 + TypeScript    │  HTTPS  │  FastAPI (uvicorn)               │
│  Vite + Tailwind CSS      │────────▶│  /api/v1/genres  /search         │
│  Zustand (seeds, player)  │  JSON   │  /api/v1/recommend               │
│  framer-motion stories    │         │  /api/v1/wrapped                 │
│  html-to-image sharing    │         │  /api/v1/genres/{slug}/tracks    │
└───────────────────────────┘         │  /api/v1/artists/{name}          │
        localStorage                  └───────┬──────────────────────────┘
        (seeds, saved)                                │ in-memory, loaded at boot
                                              ┌───────▼──────────────────────────┐
                                              │  Artifact store (precomputed)    │
                                              │  top_k_indices.npy  (114k×100)   │
                                              │  top_k_scores.npy   (114k×100)   │
                                              │  track_lookup.pkl   (114k rows)  │
                                              │  scaler/encoder pickles          │
                                              │  artwork_cache.json (scraper)    │
                                              └───────┬──────────────────────────┘
                                              ┌───────▼──────────────────────────┐
                                              │  Offline scripts                 │
                                              │  precompute.py  (similarities)   │
                                              │  scrape_artwork.py (iTunes/Deezer)│
                                              │  evaluate.py    (metrics)        │
                                              └──────────────────────────────────┘
```

- **Stateless API** — all heavy math happens offline; the API only does lookups, filtering and aggregation. Boot loads artifacts into RAM once (~110 MB after int32/float32 downcast).
- **Thin frontend state** — seeds and saved tracks persist in `localStorage`; the server holds no user data.

## 5. Recommendation Methodology

### 5.1 Track → track similarity (offline, `scripts/precompute.py`)

| Step | Detail |
|---|---|
| Features | `danceability, energy, valence, acousticness, instrumentalness, liveness, speechiness, tempo, loudness` |
| Scaling | `StandardScaler` (z-scores) — tempo (BPM) and loudness (dB) are on different scales than the 0–1 features |
| Genre | One-hot over 114 genres |
| Similarity | Cosine similarity per representation |
| Blend | `0.6 × audio + 0.4 × genre` — audio drives sonic neighbourhoods; genre keeps results recognisable |
| Storage | Per track, top-100 neighbour indices + scores (`argpartition` per 200-track chunk, self excluded) |

### 5.2 Serving filters (`/api/v1/recommend`)

The raw top-100 is filtered to what a human should see:

1. **De-duplication** — drop repeated `(normalised title, primary artist)` pairs; strip suffixes like `- Remastered`, `(Live)` before comparing. This kills the "same song three times" defect.
2. **Artist cap** — max 2 tracks per artist.
3. **Genre cap** — max ~40% of the list from one genre.
4. **Rank-normalised scoring** — raw cosine values cluster at 0.97–0.99, which carries no information. Scores are min-max normalised within the returned list into `0.55–1.0` and bucketed:
   - `≥ 0.92` → **Perfect fit**
   - `≥ 0.78` → **Great fit**
   - else → **Good fit**
5. **Reasons** — each item ships human-readable reasons ("Top match for your taste"; on the track page, feature-overlap reasons like *Similar energy*, *Same acoustic space* computed against the user's seed tracks).

### 5.3 Wrapped payload (`POST /api/v1/wrapped`)

Input: up to 20 seed track IDs and/or 10 genres. Pipeline:

1. Pool the top-50 neighbours of every seed track + the 30 most popular tracks of each seed genre.
2. Remove the seeds themselves, de-duplicate, diversify (same filters as above).
3. Derive: top genre + top-5 genres with counts, top-5 artists (with scraped images), top tracks, **minutes of music** (Σ duration), **audio profile** (pool feature means vs whole-dataset baseline), **mood label** (valence/energy quadrant → e.g. *Golden Hour*), **discovery counts** (new genres/artists not in the seeds), **listening personality** (rule-based archetype, §5.4), and a **10-track playlist**.

### 5.4 Listening personality (rule-based)

Ordered rules on the mean audio profile, first match wins:

| Condition | Archetype |
|---|---|
| acousticness > 0.5 ∧ energy < 0.5 | The Daydreamer |
| energy > 0.6 ∧ danceability > 0.6 | The Hype Machine |
| valence > 0.6 | The Optimist |
| instrumentalness > 0.4 | The Deep Diver |
| danceability > 0.6 | The Rhythm Seeker |
| otherwise | The Explorer |

## 6. Dataset Selection

**Spotify Tracks Dataset — 114,000 rows × 21 columns, 114 genres × exactly 1,000 tracks per genre.**

Selection rationale:
- **Rich audio features** (the core of a content-based engine) supplied per track by Spotify's own analysis pipeline — danceability, energy, key, loudness, mode, speechiness, acousticness, instrumentalness, liveness, valence, tempo, time_signature.
- **Genre-labelled** — a categorical signal to blend with audio features.
- **Broad** — 114 genres from acoustic to techno gives genuine diversity and lets coverage be measured meaningfully.
- **Public** — widely available on Kaggle, so evaluators can reproduce everything.

Known quirk (handled deliberately): the balanced 1,000-per-genre construction makes raw per-genre counts useless as a display stat, so the UI surfaces **charting tracks per genre (popularity ≥ 80)** — a differentiated, honest number ranging 0–131.

We use 14 of 21 columns: identifiers (`track_id`, names, artists, album), `track_genre`, `popularity`, `duration_ms`, `explicit`, plus the 9 audio features. `key`, `mode`, `time_signature` are dropped (circular/low-signal for similarity).

## 7. Technologies Used

**Backend** — Python 3.12, FastAPI + Uvicorn, Pydantic v2 (+ pydantic-settings), pandas, NumPy, scikit-learn (StandardScaler, OneHotEncoder, cosine_similarity), pytest + httpx.
**Frontend** — React 18, TypeScript, Vite, Tailwind CSS, React Router, Zustand (persisted seed/saved state), Framer Motion (story choreography), Lucide icons, html-to-image (share export).
**Data tooling** — offline precompute pipeline; artwork scraper over the free iTunes Search + Deezer public APIs (no keys, rate-limited, incrementally cached).

## 8. Assumptions

1. **No user history exists** — explicit seed selection replaces behavioural data. Copy in the UI never claims "based on your listening history".
2. One genre label per track is authoritative (dataset limitation, not a modelling choice).
3. `popularity` (0–100, Spotify-computed) is a reasonable quality proxy where a tiebreaker is needed.
4. The dataset is static; freshness/new-release ranking is out of scope.
5. Audio playback is unavailable — the dataset carries no `preview_url`, so the MiniPlayer renders only if a preview exists and is otherwise hidden (never a dead "0:00" player).
6. Album/artist images come from public third-party search APIs; anything not found falls back to deterministic generated SVG covers.
7. English-language seed/search input.

## 9. Key Design Decisions

| Decision | Rationale | Rejected alternative |
|---|---|---|
| Precompute top-100 neighbours (91 MB × 2) | O(1) serving, p95 latency 8 ms; a full 114k×114k matrix would need ~93 GB | On-the-fly similarity (100 ms+ per request, CPU-bound), FAISS (extra infra for no benefit at this scale) |
| 0.6 audio / 0.4 genre weighting | Audio features capture *sound-alike* quality; genre keeps results recognisable and prevents cross-genre surprises | 50/50 (genre too dominant given one-hot scale), 100% audio (results drift across unrelated genres) |
| Tiered match labels over raw percentages | Raw cosine of scaled features compresses to 0.97–0.99 — meaningless to users. Rank-normalisation restores information | Showing raw % (all items read "98% match") |
| Serve-time de-dup + caps | The dataset contains many covers/remasters of the same song; unfiltered lists repeated "Party of One" three times | Post-hoc frontend filtering (duplicated work, inconsistent) |
| Seed-based personalisation | Only honest signal available without user accounts | Faking personalisation from popularity |
| Generated SVG covers as universal fallback | Third-party artwork APIs can miss/rate-limit; deterministic art seeded by `track_id` + shaped by audio features keeps every surface populated and thematically consistent | Empty boxes / placeholder greys |
| Story-player UX for Wrapped | Matches the Spotify Wrapped mental model: one idea per slide, tap-to-advance, shareable | Scrolling dashboard (original build — felt generic) |
| Top bar / tab bar shell instead of floating pill nav | The pill overlapped content on mobile; a standard Spotify-style shell never does | Floating pill navigation |

## 10. Evaluation Methodology

### 10.1 Why standard CF metrics don't apply directly

Precision@K, Recall@K, MAP and NDCG require **ground-truth relevance judgements** — held-out likes, plays or ratings per user. This dataset has none, and the system is content-based: there is no observed interaction matrix to split into train/test. Reporting NDCG against nothing would be fabrication.

Instead, we evaluate the properties a *content-based* recommender can be held to, all reproducible via `backend/scripts/evaluate.py` (200 random seeds, K = 10, serve-time filters applied, seed = 42):

| Metric | What it measures | Result |
|---|---|---|
| **Genre Precision@10** | Share of recommendations matching the seed track's genre — the system's primary relevance proxy | **100.0%** |
| **Intra-list diversity** | Unique genres per 10-item list | **1.0 / 10** (see limitations) |
| **Novelty** | Mean popularity of recommendations vs dataset mean (35.5 vs 33.2) — mildly popularity-leaning, not a hits-only engine | **+2.3** |
| **Hot-rec share** | % of recommendations with popularity ≥ 80 | **2.3%** |
| **Duplicate control** | Artist-cap violations (target: 0) | **0 across 200 lists** |
| **List integrity** | Lists degraded below K=10 by de-dup filters | **26 / 200** (13%) |
| **Unique tracks surfaced** | Distinct tracks across 2,000 recommendation slots | **1,892 (94.6%)** |
| **Catalog coverage** | Every track has a precomputed top-100 → every track is reachable as some seed's neighbour | **100%** (analytic) |
| **Latency — recommend** | p50 / p95, in-process | **5.6 ms / 8.1 ms** |
| **Latency — search** | p50 / p95 (substring scan over 114k rows dominates) | **74.9 ms / 92.4 ms** |

### 10.2 Interpreting the results

- **Relevance** (Genre Precision@10 = 100%) is high because genre carries 40% of the similarity weight — appropriate for a seed-driven discovery product, where a "jazz" seed producing techno would read as broken.
- **Diversity is the honest trade-off**: with 1,000 tracks per genre and a 0.4 genre weight, top-10 lists are single-genre. This is correct for "more like this" but a limitation for cross-genre exploration (§13, §14 — MMR re-ranking and a diversity slider are the planned fixes).
- **Novelty** ≈ dataset mean with only 2.3% charting tracks — the engine surfaces deep catalogue, not just hits.
- **Satisfaction** is measured qualitatively (story completion, share-card exports, seed re-edit rate in *Your Taste*) since no A/B infrastructure exists in scope.

## 11. Test Cases

### 11.1 Automated (pytest — `backend/tests/test_api.py`, all passing)

| Test | Asserts |
|---|---|
| `test_health_endpoint` | `GET /health` → 200, `{"status": "ok"}` |
| `test_genres_endpoint` | `GET /api/v1/genres` → 200 with genre list |
| `test_search_endpoint` | `GET /api/v1/search?q=love` → 200 with tracks |
| `test_recommend_endpoint_invalid_track` | Unknown `track_id` → 404 |
| `test_recommend_endpoint_validation` | Missing `track_id`, `n_recommendations` of 0 and 100 → 422 |
| `test_search_endpoint_validation` | Missing `q`, `limit` of 0 and 100 → 422 |

### 11.2 Manual — successful scenarios

| # | Scenario | Expected |
|---|---|---|
| S1 | Onboarding: pick 5 genres + 3 tracks → Generate | Loading copy rotates, Wrapped story opens on slide 1 |
| S2 | Search "blinding lights" | Results grouped into artists + songs, all with cover art |
| S3 | Click any search result | Recommendations load with tiered match pills, durations, artists |
| S4 | Wrapped slide 3 (Top Genre) | Genre name + proportional top-5 bars, real counts |
| S5 | Track page → "Why this match" | Feature-overlap reasons shown when seeds exist |
| S6 | Wrapped slide 11 → Download | 1080×1920 PNG exported with slide palette |
| S7 | Genre page "Get recommendations" | Track list limited to that genre, artists shelf populated |
| S8 | Save a track (heart) → Your Taste | Track persists after refresh (localStorage) |

### 11.3 Manual — failure scenarios (documented, handled)

| # | Scenario | Observed behaviour |
|---|---|---|
| F1 | Search gibberish ("zzzzqqqq") | Empty-state with suggestion to adjust terms — no crash |
| F2 | Wrapped with zero seeds | API 400 → friendly error screen with "Pick seeds" action |
| F3 | Backend offline | Error states with Retry on every page; UI shell still renders |
| F4 | Track with no scraped artwork | Generated SVG cover (never an empty box) |
| F5 | Genre whose recommendations de-dup below 10 | Shorter list served; no padded duplicates |
| F6 | 404 route | Redirects to `/` (onboarding/home) |
| F7 | `prefers-reduced-motion: reduce` | Story auto-advance off, transforms replaced by fades |

## 12. Testing Interface (Deployed UI)

The deployed app is the evaluator's interface. Every requirement maps to a screen:

| Evaluator need | Where | How |
|---|---|---|
| **Enter or select inputs** | Onboarding (`/`) | Genre tiles (3–10, star-count per genre), then search-as-you-type track picker; sticky tray shows live selection. Editable later in **Your Taste** (`/library`). |
| **Generate recommendations** | Wrapped banner → `/wrapped`; track pages; genre "Get recommendations"; Home shelves | Seeds → full Wrapped story; any track → ranked similar list; any genre → genre-limited list |
| **Clearly observe outputs** | Every surface | Cards/rows show cover art, title, artist, genre, duration, tiered match pill with distinct colours |
| **Understand *why*** | Track pages, Wrapped slide 6, share cards | "Why this match" reasons (feature overlap with your seeds), Audio Aura + FeatureBars showing the 0–100 feature values vs the typical-listener tick, match tiers explained, and the recommendation blend (60% audio / 40% genre) documented here |

Suggested 5-minute evaluation path: Onboarding → pick genres/tracks → watch the Wrapped story → open a top track from slide 5 → inspect "Why this match" + audio profile → share a card → return to Home and explore a genre.

## 13. Known Limitations

1. **Low intra-list diversity** — top-10 lists are single-genre (measured 1.0/10). The 0.4 genre weight plus a balanced dataset make genre dominate ranking. Correct for "more like this", limiting for exploration.
2. **No collaborative signal** — without interaction data, "users like you" recommendations are impossible; personalisation is bounded by seed quality.
3. **Single genre per track** — the dataset's one-label constraint makes multi-genre tracks (e.g. pop-rock) neighbours of only one world.
4. **13% of lists fall below K=10** after de-duplication for cover/remaster-heavy seeds.
5. **No audio playback** — the dataset has no previews; the mini player is hidden rather than fake.
6. **Artwork depends on third-party APIs** — iTunes/Deezer can miss or rate-limit; generated covers cover the gap but aren't real album art.
7. **Popularity is a snapshot** — no time dimension, so "fresh finds" are low-overlap, not actually new.
8. **Personality archetypes are heuristics** — thresholds were chosen on feature distributions, not validated against human labels.
9. **Search is substring-based** — no fuzzy matching or typo tolerance; p95 ≈ 92 ms over 114k rows.
10. **Free-tier cold starts** — the deployed API sleeps after 15 idle minutes (mitigated by a keep-alive pinger, see `DEPLOY_ONLINE.md` §5).

## 14. Future Improvements

1. **MMR / diversity re-ranking** — tunable λ between relevance and intra-list diversity; directly addresses limitation 1.
2. **Embedding upgrade** — replace engineered features with learned audio embeddings (e.g. CLAP/MusicNN) or lyric SBERT embeddings blended into the similarity space.
3. **Hybrid CF once data exists** — the schema is ready; implicit-feedback matrix (plays/saves) blended with content similarity via weighted hybrid.
4. **FAISS ANN index** — if the catalogue grows beyond ~1M tracks or top-K needs to exceed 100.
5. **Fuzzy search** — trigram index (typos, partial artist names) to fix limitation 9.
6. **Real playback** — Spotify OAuth for 30 s previews and full tracks, turning the mini player on for real.
7. **A/B framework** — measure story completion and share rates against alternative slide orders/weights.
8. **User accounts** — cross-device seeds, wrapped history snapshots (schema already persists seeds v2).

## 15. Reproduction

```bash
# 1. Backend
cd backend
python -m venv venv && venv\Scripts\activate        # Windows
pip install -r requirements.txt
python scripts/precompute.py                         # ~7–10 min → artifacts
python scripts/scrape_artwork.py --limit 500         # optional, real covers
python scripts/evaluate.py                           # reproduce §10 metrics
python -m pytest tests/ -v                           # automated tests
python -m app.main                                   # API on :8000

# 2. Frontend
cd ../spotify-frontend
npm install
npm run dev          # http://localhost:5173
npm run build        # production bundle → dist/

# 3. One command for both (dev)
# repo root:
npm install && npm run dev
```

## 16. API Reference (summary)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Liveness probe |
| GET | `/api/v1/genres?with_counts=true` | Genres + exact track counts + charting-track counts |
| GET | `/api/v1/search?q=&limit=` | Substring search over title/artist, popularity-sorted |
| POST | `/api/v1/recommend` | `{track_id, n_recommendations}` → de-duplicated, diversified, tiered neighbours |
| GET | `/api/v1/genres/{slug}/tracks?limit=` | Genre page: tracks + "artists to know" |
| GET | `/api/v1/artists/{name}` | Artist page: tinted header data + top tracks |
| POST | `/api/v1/wrapped` | `{track_ids[], genres[]}` → full Wrapped payload |

Interactive docs: `http://localhost:8000/docs` (Swagger UI).
