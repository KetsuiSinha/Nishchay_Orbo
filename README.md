# Wrapped Recommendations

A Spotify Wrapped-inspired song recommendation system with a beautiful, personalized frontend and a high-performance FastAPI backend.

## ✨ Features

- **🎵 Personalized Recommendations** — Hybrid collaborative + content-based filtering using genre and audio features
- **🎨 Spotify Wrapped Aesthetic** — Dark mode, vibrant gradients, animated stat circles, genre story cards
- **⚡ Low Latency** — Precomputed top-K similarities for <100ms API responses
- **📱 Fully Responsive** — Mobile-first design with Tailwind CSS
- **🔧 TypeScript + React** — Type-safe frontend with modern tooling
- **🐳 Docker Ready** — Production-ready containers with docker-compose

## 🏗 Architecture

```
wrapped-recommendations/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Configuration
│   │   ├── schemas/        # Pydantic models
│   │   ├── services/       # Business logic
│   │   └── main.py         # App entry point
│   ├── scripts/
│   │   └── precompute.py   # Preprocessing script
│   ├── tests/              # Pytest tests
│   ├── requirements.txt
│   └── Dockerfile
├── spotify-frontend/       # React + TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   ├── types/          # TypeScript types
│   │   └── lib/            # Utilities
│   ├── design.md           # Hallmark design system
│   ├── tailwind.config.ts
│   └── Dockerfile
├── dataset.csv             # 114K Spotify tracks (not in git)
├── docker-compose.yml
└── package.json            # Root dev scripts
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **Git**

### Local Development

1. **Clone and install dependencies:**
```bash
# Install root dev dependencies
npm install

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd ../spotify-frontend
npm install
```

2. **Precompute similarity data (one-time, ~5 min):**
```bash
cd backend
python scripts/precompute.py
```

3. **Start development servers:**
```bash
# From project root
npm run dev
```

This starts:
- Backend API at `http://localhost:8000`
- Frontend at `http://localhost:5173`

### Using Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/genres` | List all genres |
| GET | `/api/v1/search?q={query}&limit=10` | Search tracks |
| POST | `/api/v1/recommend` | Get recommendations |

### Example Recommendation Request

```bash
curl -X POST http://localhost:8000/api/v1/recommend \
  -H "Content-Type: application/json" \
  -d '{"track_id": "5SuOikwiRyPMVoIQDJUgSV", "n_recommendations": 10}'
```

## 🎨 Design System

The frontend uses a custom **Hallmark** design system (`spotify-frontend/design.md`) featuring:

- **Custom OKLCH Palette** — Spotify Wrapped-inspired gradients (purple, pink, green, orange)
- **Typography** — Space Grotesk (display) + DM Sans (body)
- **Motion** — Staggered reveals, stat circle count-ups, ambient gradient shifts
- **Components** — 8-state buttons, stat circles, genre story cards, audio feature radar
- **Dark Mode First** — With light mode support

## 🧪 Testing

```bash
# Run all tests
npm run test

# Backend tests only
npm run test:backend

# Frontend type checking
npm run test:frontend
```

## 📦 Deployment

### Backend (Free Options)

| Platform | Notes |
|----------|-------|
| **Railway** | Free tier, auto-deploy from GitHub |
| **Render** | Free tier, Docker support |
| **Fly.io** | Free allowance, global edge |
| **PythonAnywhere** | Free tier for Python apps |

### Frontend (Free Options)

| Platform | Notes |
|----------|-------|
| **Vercel** | Recommended, zero-config |
| **Netlify** | Drag-and-drop or Git integration |
| **Cloudflare Pages** | Free, fast global CDN |

### Environment Variables

**Backend (.env):**
```env
DATASET_PATH=../dataset.csv
TOP_K=100
CHUNK_SIZE=200
AUDIO_WEIGHT=0.6
GENRE_WEIGHT=0.4
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=["https://your-frontend.vercel.app"]
```

**Frontend:**
```env
VITE_API_URL=https://your-backend.railway.app
```

## 🔧 Configuration

### Recommendation Weights

Adjust in `backend/app/core/config.py` or `.env`:
- `AUDIO_WEIGHT` (default: 0.6) — Audio feature similarity weight
- `GENRE_WEIGHT` (default: 0.4) — Genre similarity weight
- `TOP_K` (default: 100) — Number of similar tracks stored per track

### Audio Features Used

- Danceability
- Energy
- Valence (positivity)
- Acousticness
- Instrumentalness
- Liveness
- Speechiness
- Tempo
- Loudness

## 📈 Performance

- **Precomputation:** ~5 minutes for 114K tracks
- **API Latency:** <100ms (precomputed similarities in memory)
- **Memory:** ~200MB for similarity matrices
- **Frontend Bundle:** ~200KB gzipped

## 🛠 Tech Stack

**Backend:**
- FastAPI + Uvicorn
- Pandas + NumPy + Scikit-learn
- Pydantic v2
- Pytest

**Frontend:**
- React 18 + TypeScript
- Vite
- Tailwind CSS v3
- React Router v6
- Hallmark Design System

**Deployment:**
- Docker + Docker Compose
- Nginx (production frontend)

## 📄 License

MIT License — feel free to use for your own projects!

## 🙏 Acknowledgments

- Spotify for the Wrapped design inspiration
- The Spotify Million Playlist Dataset creators
- Hallmark design system for anti-slop UI principles
- Open source community for the amazing tools