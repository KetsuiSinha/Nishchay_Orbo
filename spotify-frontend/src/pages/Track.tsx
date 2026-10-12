import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import { CoverArt } from "../components/media/CoverArt";
import { Shelf } from "../components/media/Shelf";
import { TrackCard } from "../components/media/TrackCard";
import { TrackRow } from "../components/media/TrackRow";
import { FeatureBars } from "../components/wrapped/AuraVisual";
import { Skeleton } from "../components/ui/Skeleton";
import { matchTierLabel, formatArtists, formatMinutes } from "../lib/utils";
import { matchReasons } from "../lib/personality";
import { useSeeds } from "../state/seeds";
import type { RecommendationResponse, Track } from "../types";

export default function Track() {
  const { trackId = "" } = useParams();
  const navigate = useNavigate();
  const seeds = useSeeds((s) => s.tracks);
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .getRecommendations(trackId, 20)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [trackId]);

  const track = data?.query_track;
  const reasons = useMemo(
    () => (track && seeds.length ? matchReasons(track, seeds as unknown as Track[]) : []),
    [track, seeds]
  );

  return (
    <div className="pt-4">
      {/* Track hero */}
      <header className="px-4 md:px-6">
        {loading || !track ? (
          <div className="flex flex-col items-center gap-5 py-6 sm:flex-row sm:items-end">
            <Skeleton className="h-48 w-48 rounded" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end">
            <CoverArt track={track} size="hero" rounded="rounded" />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="mb-1 text-label uppercase text-secondary">Track</p>
              <h1 className="font-display text-3xl font-extrabold leading-[1.05] tracking-[-0.03em] md:text-5xl">
                {track.track_name}
              </h1>
              <p className="mt-2 text-secondary">
                {formatArtists(track.artists)} · {track.track_genre.replace(/-/g, " ")} ·{" "}
                {formatMinutes(track.duration_ms)}
              </p>
            </div>
          </div>
        )}
      </header>

      <div className="mt-8 space-y-10">
        {/* Features */}
        {track && (
          <section className="px-4 md:px-6">
            <h2 className="mb-4 font-display text-xl font-extrabold tracking-tight md:text-2xl">Audio profile</h2>
            <FeatureBars
              features={Object.fromEntries(
                ["danceability", "energy", "valence", "acousticness", "instrumentalness", "liveness", "speechiness"].map(
                  (k) => [k, Number(track[k as keyof typeof track]) || 0]
                )
              )}
            />
          </section>
        )}

        {/* Why this match */}
        {reasons.length > 0 && track && (
          <section className="px-4 md:px-6">
            <h2 className="mb-3 font-display text-xl font-extrabold tracking-tight md:text-2xl">Why this match</h2>
            <div className="flex flex-wrap gap-2">
              {reasons.map((r) => (
                <span key={r} className="rounded-pill bg-green/15 px-3 py-1.5 text-xs font-bold text-green-bright">
                  {r}
                </span>
              ))}
              <span className="rounded-pill bg-highlight px-3 py-1.5 text-xs font-bold text-secondary">
                {matchTierLabel((data?.recommendations[0] as any)?.match_tier ?? "good")} neighbour pool
              </span>
            </div>
          </section>
        )}

        {/* More like this */}
        <section>
          <Shelf title="More like this">
            {loading
              ? [...Array(5)].map((_, i) => (
                  <div key={i} className="w-40 shrink-0 md:w-[200px]">
                    <Skeleton className="aspect-square w-full rounded" />
                  </div>
                ))
              : data?.recommendations.map((t) => (
                  <div key={t.track_id} className="w-40 shrink-0 md:w-[200px]">
                    <TrackCard track={t} onNavigate={(id) => navigate(`/track/${id}`)} />
                  </div>
                ))}
          </Shelf>
        </section>

        {data && data.recommendations.length > 0 && (
          <section className="px-4 md:px-6">
            <h2 className="mb-2 font-display text-xl font-extrabold tracking-tight md:text-2xl">
              All similar tracks
            </h2>
            <div role="list">
              {data.recommendations.map((t, i) => (
                <TrackRow key={t.track_id} track={t} rank={i + 1} onNavigate={(id) => navigate(`/track/${id}`)} />
              ))}
            </div>
          </section>
        )}

        {error && (
          <div className="px-4 py-16 text-center md:px-6">
            <p className="font-display text-xl font-extrabold">Can't reach the server</p>
            <p className="mt-1 text-sm text-secondary">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
