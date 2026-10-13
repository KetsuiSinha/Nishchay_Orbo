import type {
  ArtistResponse,
  GenreTracksResponse,
  GenresResponse,
  RecommendationResponse,
  SearchResponse,
  WrappedPayload,
  WrappedRequest,
} from "../types";

/**
 * Base URL resolution:
 *  - VITE_API_URL env (build-time) always wins
 *  - dev server → local backend on :8000
 *  - production build → same origin (backend serves the built frontend)
 *    so single-service deploys need zero configuration
 */
const isDev = import.meta.env.DEV;
export const API_BASE_URL: string = (
  import.meta.env.VITE_API_URL?.trim() || (isDev ? "http://localhost:8000" : "")
).replace(/\/+$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, init);
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(
        `Cannot reach the API at "${API_BASE_URL || "(same origin)"}". ` +
          `Check that the backend is running and that CORS / VITE_API_URL are configured.`
      );
    }
    throw err;
  }
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: `Request failed (${response.status})` }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export const api = {
  getGenres: (withCounts = false): Promise<GenresResponse> =>
    request(`/api/v1/genres${withCounts ? "?with_counts=true" : ""}`),

  searchTracks: (q: string, limit = 20): Promise<SearchResponse> => {
    const params = new URLSearchParams({ q, limit: String(limit) });
    return request(`/api/v1/search?${params}`);
  },

  getRecommendations: (trackId: string, n = 20): Promise<RecommendationResponse> =>
    request(`/api/v1/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ track_id: trackId, n_recommendations: n }),
    }),

  getGenreTracks: (slug: string, limit = 20): Promise<GenreTracksResponse> =>
    request(`/api/v1/genres/${encodeURIComponent(slug)}/tracks?limit=${limit}`),

  getArtist: (name: string): Promise<ArtistResponse> =>
    request(`/api/v1/artists/${encodeURIComponent(name)}`),

  generateWrapped: (seeds: WrappedRequest): Promise<WrappedPayload> =>
    request(`/api/v1/wrapped`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(seeds),
    }),
};
