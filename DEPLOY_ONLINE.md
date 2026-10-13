# DEPLOY ONLINE — Free Hosting Guide

Deploy the full stack for **$0**. Total time: ~15 minutes.

> **Read this first:** the backend can now serve the built frontend itself (single origin — no CORS, no env vars). That's **Option 1** and is the recommended path. Running frontend and backend as separate services still works (**Option 2**) but needs two env vars wired correctly.

| Option | What it deploys | Config surface |
|---|---|---|
| **1. Single Render service** (recommended) | API + frontend from one container | No env vars (just `PYTHON_VERSION`) |
| 2. Split: Render API + Vercel frontend | Frontend on Vercel CDN, API on Render | `VITE_API_URL` + `CORS_ORIGINS` must match |

---

## 0. Prerequisites

- A GitHub account and this project pushed to a GitHub repository
- Precomputed artifacts generated once locally (`npm run precompute`)

## 1. Commit the large files (critical)

`.gitignore` excludes the model artifacts and dataset by default — the deployed backend needs them. Also note: the Python `lib/` ignore rule is now anchored to the repo root, so `spotify-frontend/src/lib/` is committed normally.

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
- Biggest file is `top_k_indices.npy` ≈ 91 MB — under GitHub's 100 MB hard limit.
- Artifacts load into ~110 MB RAM (int32/float32 downcast) — fits every free tier listed here.

### 1b. (Optional but recommended) Scrape real album covers first

```bash
cd backend
.\venv\Scripts\python.exe scripts\scrape_artwork.py --limit 1000 --delay 0.1
```

Free iTunes/Deezer lookup, no API keys, incrementally cached to `backend/artwork_cache.json`. Tracks without a scraped cover get deterministic generated SVG covers — nothing ever renders empty.

## 2. Option 1 (recommended): ONE Render service serves everything

The backend automatically serves `spotify-frontend/dist` when it exists, so one container = API + app on one origin. No CORS. No API URL env var.

1. **dashboard.render.com** → **New → Web Service** → connect your GitHub repo.
2. Settings:
   - **Runtime:** Docker
   - **Dockerfile Path:** `backend/Dockerfile`
   - **Docker Context:** repo root (leave default if it shows the root)
   - **Instance Type:** Free
3. Environment (optional but nice): `PYTHON_VERSION=3.12.10`
4. **Create Web Service.** First build ~5–8 min (compiles the frontend inside Docker). Live at `https://wrapped-api-xxxx.onrender.com`.

The Docker build is multi-stage: Node compiles the SPA → Python image serves it via FastAPI. Because the app and API share an origin, the frontend talks to `/api/v1/...` relatively — no CORS preflights at all.

**One URL does everything:** open the service URL → you get the app; `/docs` → Swagger; `/health` → probe.

**Free-tier behaviour:** sleeps after 15 min idle; first request after a nap takes ~50 s. Keep it warm with cron-job.org (§5).

## 3. Option 2: Split deploy (Render API + Vercel frontend)

### 3a. Backend on Render

1. **New → Web Service** → your repo.
2. **Root Directory:** `backend` · **Build:** `pip install -r requirements.txt` · **Start:**
   ```
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
3. Environment:
   - `PYTHON_VERSION=3.12.10`
   - `CORS_ORIGINS` — flexible now! Any of these work:
     ```
     https://your-app.vercel.app
     https://your-app.vercel.app,https://your-app-2.vercel.app
     ["https://your-app.vercel.app"]
     *
     ```
     (`*` allows all origins — fine for a demo, don't ship it in production)

### 3b. Frontend on Vercel

1. **Import the repo** → Framework: Vite → **Root Directory:** `spotify-frontend`.
2. Environment variable: `VITE_API_URL` = your Render URL (**no trailing slash**).
   ⚠️ This is a **build-time** variable — set it *before* deploying, and redeploy after changing it. A frontend built without it will call `localhost:8000` in your users' browsers and silently load nothing.
3. Deploy. SPA refreshes are handled by `vercel.json` (in the repo).

**Shortcut for Option 2:** instead of `VITE_API_URL` + CORS, add an API proxy to `vercel.json` and skip both:
```json
{"rewrites": [
  {"source": "/api/:path*", "destination": "https://wrapped-api-xxxx.onrender.com/api/:path*"},
  {"source": "/(.*)", "destination": "/index.html"}
]}
```
The frontend then calls its own origin and Vercel proxies to the backend — no CORS, no env var. (This is why the frontend's default in production is same-origin.)

## 4. Update the deployed app

```bash
git push origin main     # auto-redeploys both services
```

After changing seeds/data, regenerate artifacts locally first, commit them (`git add -f backend/*.npy backend/*.pkl`), then push.

## 5. Defeat cold starts (free)

Render sleeps free services after 15 idle minutes. Keep warm with cron-job.org: ping `https://...onrender.com/health` every 10 minutes.

## 6. Alternative — Hugging Face Spaces (16 GB RAM, free)

Same Dockerfile works. Steps:
1. Create a **Space** → **Docker** → clone it locally.
2. Copy in `backend/` (code + artifacts), `dataset.csv`, `spotify-frontend/`.
3. `git lfs install && git lfs track "*.npy" "*.pkl" "*.csv"`
4. Space `README.md` front-matter:
   ```yaml
   ---
   title: Wrapped
   sdk: docker
   app_port: 8000
   ---
   ```
5. Push — the container binds `$PORT` automatically. Sleeps after 48 h idle.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Frontend loads but no data; console shows requests to `localhost:8000` | Frontend was built without `VITE_API_URL` | Set it on the frontend host **and redeploy** — or switch to Option 1 where it's unnecessary |
| Frontend loads but no data; console shows CORS errors | Backend `CORS_ORIGINS` missing the frontend URL | Set it on the backend (now accepts a plain URL) and redeploy — or use Option 1 |
| API returns `503 Artifacts not loaded` | Artifacts not committed | Re-run the `git add -f` block in §1, push |
| Backend crashes at boot mentioning CORS | Old bare-string crash — fixed | Deploy latest `main`; the parser now accepts plain URLs, CSV lists, JSON arrays, and `*` |
| First request takes ~1 min | Free-tier cold start (normal) | Keep-alive pinger (§5) |
| `GET /home` 404 after refresh | SPA rewrite missing | Option 1 handles it in-code; Option 2 needs `vercel.json` (in repo) |
| Docker build can't find `dataset.csv` / `.npy` | Stale `.dockerignore` | Latest repo excludes only venv/node_modules/git — pull latest |
