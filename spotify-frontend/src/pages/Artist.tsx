import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import { TrackRow } from "../components/media/TrackRow";
import { ArtistChip } from "../components/media/ArtistChip";
import { Skeleton } from "../components/ui/Skeleton";
import { Chip } from "../components/ui/Chip";
import { formatArtists } from "../lib/utils";
import type { ArtistResponse } from "../types";

export default function Artist() {
  const { name = "" } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<ArtistResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getArtist(name).then(setData).finally(() => setLoading(false));
  }, [name]);

  const heroImage = data?.artist.image_url;

  return (
    <div className="flex flex-col pt-4">
      <header
        className="relative overflow-hidden px-4 pb-10 pt-16 md:px-6 md:pt-20"
        style={{
          background: heroImage
            ? `linear-gradient(180deg, rgba(30,50,100,0.75) 0%, var(--bg-base) 100%), url(${heroImage}) center 30%/cover`
            : "linear-gradient(180deg, #1E3264 0%, var(--bg-base) 100%)",
        }}
      >
        <p className="mb-2 flex items-center gap-2 text-label uppercase text-white/70">
          {heroImage && (
            <img src={heroImage} alt="" className="h-6 w-6 rounded-full object-cover" />
          )}
          Artist
        </p>
        <h1 className="font-display text-[clamp(2.2rem,7vw,4rem)] font-extrabold leading-none tracking-[-0.03em] text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.4)]">
          {name}
        </h1>
        {data && data.artist.genres.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {data.artist.genres.map((g) => (
              <Chip key={g} label={g.replace(/-/g, " ")} size="compact" onClick={() => navigate(`/genre/${encodeURIComponent(g)}`)} />
            ))}
          </div>
        )}
      </header>

      <div className="pt-2">
        {loading ? (
          <div className="px-4 md:px-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="mb-1 h-14 rounded" />
            ))}
          </div>
        ) : (
          <>
            <section className="px-4 pt-4 md:px-6">
              <h2 className="mb-3 font-display text-xl font-extrabold tracking-tight md:text-2xl">Popular tracks</h2>
              <div role="list">
                {data?.tracks.slice(0, 8).map((t, i) => (
                  <TrackRow key={t.track_id} track={t} rank={i + 1} onNavigate={(id) => navigate(`/track/${id}`)} showTier={false} />
                ))}
              </div>
            </section>
            <section className="px-4 pt-8 md:px-6">
              <h2 className="mb-3 font-display text-xl font-extrabold tracking-tight md:text-2xl">Fans also like</h2>
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                {Array.from(
                  new Set(
                    (data?.tracks ?? []).map((t) => formatArtists(t.artists, 1))
                  )
                )
                  .filter((a) => a.toLowerCase() !== name.toLowerCase())
                  .slice(0, 8)
                  .map((a) => (
                    <ArtistChip
                      key={a}
                      name={a}
                      imageUrl={data?.tracks.find((t) => formatArtists(t.artists, 1) === a)?.artist_image_url}
                      onClick={() => navigate(`/artist/${encodeURIComponent(a)}`)}
                    />
                  ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
