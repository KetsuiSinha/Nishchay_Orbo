# DEPLOY ONLINE — Free Hosting Guide

Deploy the full stack for **$0**. Total time: ~20 minutes.

| Piece | Recommended (free) | Why |
|---|---|---|
| Backend API (FastAPI) | **Render** — free web service | Deploys straight from GitHub, 512 MB RAM (fits our artifacts after int32/float32 downcast), HTTPS included |
| Frontend (React/Vite) | **Vercel** — free Hobby project | Zero-config Vite builds, global CDN, SPA rewrites included (`vercel.json` is already in the repo) |
| Album-art scraper | **Your local machine** (one-time) | Scrapes iTunes/Deezer, produces `artwork_cache.json` which you commit — the deployed API then serves real covers |

Alternatives if Render doesn't suit you: **Koyeb** (free service, 512 MB) and **Hugging Face Spaces** (free Docker, 16 GB RAM — instructions at the bottom).

---

## 0. Prerequisites

- A GitHub account
- This project pushed to a GitHub repository
- The precomputed artifacts exist locally (they are generated once by `npm run precompute`)

## 1. Commit the large files (important)

`.gitignore` excludes the model artifacts and dataset by default. The deployed backend needs them, so force-add:

```bash
git add -f dataset.csv
git add -f backend/top_k_indices.npy backend/top_k_scores.npy
git add -f backend/track_lookup.pkl backend/track_ids.npy
git add -f backend/feature_scaler.pkl backend/genre_encoder.pkl
# optional but recommended: real album covers for the deployed app
git add -f backend/artwork_cache.json
git commit -m "Add model artifacts for deployment"
git push
```

Notes:
- Biggest file is `top_k_indices.npy` ≈ 91 MB — under GitHub's 100 MB hard limit, so no LFS needed for Render/Koyeb.
- Don't commit `venv/`, `node_modules/`, `dist/` (already ignored).

### 1b. (Optional but recommended) Scrape real album covers first

Deployed apps look far better with real artwork. Run locally before pushing:

```bash
cd backend
.\venv\Scripts\python.exe scripts\scrape_artwork.py --limit 1000 --delay 0.1
```

This seeds `backend/artwork_cache.json` (free iTunes/Deezer lookup, no API keys). Tracks without a scraped cover automatically get deterministic generated SVG covers in the UI — nothing ever renders empty.

## 2. Backend → Render (free)

1. Go to **dashboard.render.com** → **New → Web Service** → connect your GitHub repo.
2. Settings:
   - **Name:** `wrapped-api` (anything)
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:**
     ```
     pip install -r requirements.txt
     ```
   - **Start Command:**
     ```
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type:** Free
3. Under **Environment**, add:

   | Key | Value |
   |---|---|
   | `PYTHON_VERSION` | `3.12.10` |
   | `CORS_ORIGINS` | `["https://YOUR-APP.vercel.app"]` — must be valid JSON array; add your frontend URL (set in step 3, come back and edit) |

   > ⚠️ `CORS_ORIGINS` is parsed as JSON. It must be `["https://..."]` with quotes and brackets — a bare URL will crash startup.
4. **Create Web Service.** First build takes ~5 min. Your API goes live at `https://wrapped-api-xxxx.onrender.com`.
5. Verify: open `https://wrapped-api-xxxx.onrender.com/health` → `{"status":"ok"}`.

**Free-tier behaviour:** the service sleeps after 15 min without traffic. First request after a nap takes ~50 s (spin-up + artifact load). Every later request is <100 ms. See §5 for a free keep-alive.

## 3. Frontend → Vercel (free)

1. Go to **vercel.com** → **Add New → Project** → import the same GitHub repo.
2. Settings:
   - **Framework Preset:** Vite (auto-detected)
   - **Root Directory:** `spotify-frontend`
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist` (default)
3. Under **Environment Variables**, add:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://wrapped-api-xxxx.onrender.com` (your Render URL, **no trailing slash**) |

4. **Deploy.** Your app goes live at `https://YOUR-APP.vercel.app`.

SPA routing is already handled — `spotify-frontend/vercel.json` rewrites all routes to `index.html`, so `/home`, `/search`, etc. survive a hard refresh.

## 4. Close the loop: CORS

1. Copy your final Vercel URL.
2. In Render → your service → **Environment** → edit `CORS_ORIGINS`:
   ```
   ["https://YOUR-APP.vercel.app"]
   ```
3. **Save** — Render redeploys automatically. Test the app: pick seeds → generate Wrapped → recommendations should load.

## 5. Defeat cold starts (free)

Render sleeps the free instance after 15 idle minutes. Keep it warm with a free uptime pinger:

1. Create an account at **cron-job.org**.
2. Create a cron job: URL = `https://wrapped-api-xxxx.onrender.com/health`, every 10 minutes.
3. Done — the API now answers in <100 ms around the clock.

## 6. Update the deployed app

```bash
git push origin main        # Render + Vercel auto-redeploy on push
```

After changing seeds/data, regenerate artifacts locally first, commit them, then push:

```bash
npm run precompute
git add -f backend/*.npy backend/*.pkl
git commit -m "Refresh artifacts" && git push
```

---

## Alternative A — Koyeb (free, no spin-down policy differences)

1. **app.koyeb.com** → **Create App → GitHub** → pick the repo.
2. Builder: **Buildpack** · Workdir: `backend` · Run command:
   ```
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
   (Koyeb exposes port 8000 by default; set the **HTTP port** to 8000 in the service config.)
3. Instance: **Free** (512 MB). Add the same env vars as Render (§2).
4. Frontend: identical to §3, with `VITE_API_URL` pointing at the Koyeb URL.

## Alternative B — Hugging Face Spaces (16 GB RAM, free)

Best if you skip the downcast or want headroom. One extra wrinkle: files >10 MB need Git LFS, and Spaces listen on port 7860.

1. Create a **Space** → **Docker** → blank.
2. Clone the Space repo locally and copy in: `backend/` (code + artifacts), `dataset.csv`.
3. Track big files with LFS:
   ```bash
   git lfs install
   git lfs track "*.npy" "*.pkl" "*.csv"
   git add .gitattributes
   ```
4. The Space needs its own `Dockerfile` at the root — reuse the backend one but expose HF's port:
   ```dockerfile
   FROM python:3.12-slim
   WORKDIR /app
   COPY backend/requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY backend/ /app/
   COPY dataset.csv /app/dataset.csv
   ENV DATASET_PATH=/app/dataset.csv
   EXPOSE 7860
   CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
   ```
5. Add to the Space `README.md` front-matter so HF routes traffic:
   ```yaml
   ---
   title: Wrapped API
   sdk: docker
   app_port: 7860
   ---
   ```
6. Push. API lives at `https://YOUR-USER-wrapped-api.hf.space`. Spaces sleep after 48 h idle — much warmer than Render.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Browser console: CORS blocked | `CORS_ORIGINS` missing/misspelled frontend URL | Env var must be a JSON array: `["https://your-app.vercel.app"]` |
| API returns `503 Artifacts not loaded` | Artifacts not committed to the repo | Re-run the `git add -f` block in §1, push |
| Backend crashes at boot, `CORS_ORIGINS` error | Bare URL instead of JSON array | `["https://..."]` — quotes and brackets required |
| First request takes ~1 min | Free-tier cold start (normal) | Keep-alive pinger (§5) or upgrade instance |
| `GET /` returns 404 after refresh on Vercel/Netlify | SPA rewrite missing | `vercel.json` / `public/_redirects` are in the repo — make sure they were pushed |
| Search returns 500 | Old deployed code | Redeploy latest `main` (NaN→None artwork fix landed) |
| Render build OOM or timeout during precompute | You tried building artifacts on the server | Don't — precompute locally, commit artifacts (§1) |
