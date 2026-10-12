export interface Track {
  track_id: string;
  track_name: string;
  artists: string;
  album_name: string;
  track_genre: string;
  duration_ms: number;
  explicit: boolean;
  popularity: number;
  artwork_url: string | null;
  artist_image_url: string | null;
  preview_url?: string | null;
  danceability?: number | null;
  energy?: number | null;
  valence?: number | null;
  acousticness?: number | null;
  instrumentalness?: number | null;
  liveness?: number | null;
  speechiness?: number | null;
  tempo?: number | null;
  loudness?: number | null;
}

export interface TrackWithMatch extends Track {
  match_score: number;
  match_tier: "perfect" | "great" | "good";
  match_reasons: string[];
}

export interface RecommendationResponse {
  recommendations: TrackWithMatch[];
  query_track: Track | null;
}

export interface SearchResponse {
  tracks: Track[];
  total: number;
}

export interface GenreCount {
  name: string;
  count: number;
}

export interface GenresResponse {
  genres: string[];
  counts: GenreCount[] | null;
  hot_counts: GenreCount[] | null;
}

export interface GenreTracksResponse {
  tracks: Track[];
  artists: Array<{ name: string; track_count: number; image_url: string | null }>;
  total_count: number;
}

export interface ArtistResponse {
  artist: { name: string; image_url: string | null; genres: string[] };
  tracks: Track[];
}

export interface TopGenre {
  name: string;
  track_count: number;
}

export interface TopArtist {
  name: string;
  track_count: number;
  image_url: string | null;
}

export interface Personality {
  id: string;
  name: string;
  description: string;
  traits: string[];
  color: string;
}

export interface WrappedPayload {
  top_genre: TopGenre;
  top_genres: TopGenre[];
  top_artists: TopArtist[];
  top_tracks: TrackWithMatch[];
  minutes_estimate: number;
  audio_profile: { features: Record<string, number>; baseline: Record<string, number> };
  personality: Personality;
  mood_label: string;
  discovery: { new_genres_count: number; new_artists_count: number };
  generated_at: string;
  playlist: Track[];
}

export interface WrappedRequest {
  track_ids: string[];
  genres: string[];
}

export interface SeedGenre {
  genre: string;
}

export interface SeedTrack {
  track_id: string;
  track_name: string;
  artists: string;
  artwork_url: string | null;
}

export type PaletteName =
  | "electric-purple"
  | "lime"
  | "hot-pink"
  | "cobalt"
  | "tangerine"
  | "black"
  | "mint";

export interface Palette {
  bg: string;
  text: string;
  accent: string;
  name: PaletteName;
}
