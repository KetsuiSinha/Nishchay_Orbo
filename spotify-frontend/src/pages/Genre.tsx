import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import { TrackRow } from "../components/media/TrackRow";
import { ArtistChip } from "../components/media/ArtistChip";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Skeleton";
import { genreGradient } from "../lib/colorFromSlug";
import type { GenreTracksResponse } from "../types";

export default function Genre() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<GenreTracksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .getGenreTracks(slug, 24)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const title = slug.replace(/-/g, " ");
  const seed = data?.tracks[0];

  const getRecs = async () => {
    if (!seed) return;
    navigate(`/track/${seed.track_id}`);
  };

  return (
    <div className="flex flex-col pt-4">
      {/* Genre hero */}
      <header
        className="relative overflow-hidden px-4 pb-10 pt-16 md:px-6 md:pt-20"
        style={{ background: `linear-gradient(180deg, ${genreGradient(slug)} 0%, var(--bg-base) 100%)` }}
      >
        <p className="mb-2 text-label uppercase text-white/70">Genre</p>
        <h1 className="font-display text-[clamp(2.5rem,8vw,4.5rem)] font-extrabold capitalize leading-none tracking-[-0.03em] text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.3)]">
          {title}
        </h1>
        <p className="mt-2 text-sm font-semibold text-white/80">
          {loading ? "…" : `${(data?.total_count ?? 0).toLocaleString()} tracks`}
        </p>
        <Button onClick={getRecs} disabled={!seed} className="mt-5">
          Get recommendations
        </Button>
      </header>

      <div className="flex flex-col gap-8 pt-2">
        {loading ? (
          <div className="px-4 md:px-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="mb-1 h-14 rounded" />
            ))}
          </div>
        ) : error ? (
          <div className="px-4 py-16 text-center md:px-6">
            <p className="font-display text-xl font-extrabold">Can't reach the server</p>
            <p className="mt-1 text-sm text-secondary">{error}</p>
            <Button className="mt-5" onClick={() => navigate(0)}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            {data && data.artists.length > 0 && (
              <section>
                <h2 className="mb-3 px-4 font-display text-xl font-extrabold tracking-tight md:px-6 md:text-2xl">
                  Artists to know
                </h2>
                <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1 md:px-6">
                  {data.artists.map((a) => (
                    <ArtistChip
                      key={a.name}
                      name={a.name}
                      imageUrl={a.image_url}
                      onClick={() => navigate(`/artist/${encodeURIComponent(a.name)}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="px-4 md:px-6">
              <h2 className="mb-2 font-display text-xl font-extrabold tracking-tight md:text-2xl">
                Popular in {title}
              </h2>
              <div role="list">
                {data?.tracks.map((t, i) => (
                  <TrackRow key={t.track_id} track={t} rank={i + 1} onNavigate={(id) => navigate(`/track/${id}`)} showTier={false} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
