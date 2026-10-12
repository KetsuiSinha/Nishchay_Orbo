# Wrapped Recommendations 🎧

A Spotify-Wrapped-style music discovery system. Pick a few seeds, get an 11-slide story of your taste — backed by a hybrid content-based recommendation engine over **114,000 tracks × 114 genres**.

| Doc | Contents |
|---|---|
| **[DOCUMENTATION.md](DOCUMENTATION.md)** | Problem statement, architecture, methodology, dataset, evaluation (with measured results), test cases, limitations, reproduction guide |
| **[DEPLOY_ONLINE.md](DEPLOY_ONLINE.md)** | Deploy the whole stack for free — Render (backend) + Vercel (frontend), artwork scraper, cold-start keep-alive, troubleshooting |

## Quick start

```bash
npm install                       # root tooling

# Backend
cd backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
python scripts/precompute.py      # one-time, ~7–10 min
python -m app.main                # http://localhost:8000

# Frontend (new terminal)
cd ../spotify-frontend
npm install
npm run dev                       # http://localhost:5173
```

Or both at once from the root: `npm run dev`

## Stack

FastAPI · pandas · NumPy · scikit-learn — React 18 · TypeScript · Vite · Tailwind · Zustand · Framer Motion
