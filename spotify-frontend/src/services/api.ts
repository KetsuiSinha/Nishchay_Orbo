import type {
  ArtistResponse,
  GenreTracksResponse,
  GenresResponse,
  RecommendationResponse,
  SearchResponse,
  WrappedPayload,
  WrappedRequest,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: `Request failed (${response.status})` }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export const api = {
  getGenres: (withCounts = false): Promise<GenresResponse> => {
    const qs = withCounts ? "?with_counts=true" : "";
    return fetch(`${API_BASE_URL}/api/v1/genres${qs}`).then((r) => handle(r));
  },

  searchTracks: (q: string, limit = 20): Promise<SearchResponse> => {
    const params = new URLSearchParams({ q, limit: String(limit) });
    return fetch(`${API_BASE_URL}/api/v1/search?${params}`).then((r) => handle(r));
  },

  getRecommendations: (trackId: string, n = 20): Promise<RecommendationResponse> =>
    fetch(`${API_BASE_URL}/api/v1/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ track_id: trackId, n_recommendations: n }),
    }).then((r) => handle(r)),

  getGenreTracks: (slug: string, limit = 20): Promise<GenreTracksResponse> =>
    fetch(`${API_BASE_URL}/api/v1/genres/${encodeURIComponent(slug)}/tracks?limit=${limit}`).then(
      (r) => handle(r)
    ),

  getArtist: (name: string): Promise<ArtistResponse> =>
    fetch(`${API_BASE_URL}/api/v1/artists/${encodeURIComponent(name)}`).then((r) => handle(r)),

  generateWrapped: (seeds: WrappedRequest): Promise<WrappedPayload> =>
    fetch(`${API_BASE_URL}/api/v1/wrapped`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(seeds),
    }).then((r) => handle(r)),
};
