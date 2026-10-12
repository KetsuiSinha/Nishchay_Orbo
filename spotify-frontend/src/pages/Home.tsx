import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useSeeds } from "../state/seeds";
import { Button } from "../components/ui/Button";
import { ChipGroup } from "../components/ui/Chip";
import { Shelf } from "../components/media/Shelf";
import { TrackCard } from "../components/media/TrackCard";
import { TrackRow } from "../components/media/TrackRow";
import { GenreTile } from "../components/browse/GenreTile";
import { ShelfSkeleton } from "../components/ui/Skeleton";
import { paletteFor } from "../lib/palettes";
import { Sticker } from "../components/wrapped/Sticker";
import type { Track } from "../types";

const FILTERS = ["All", "Songs", "Genres", "Moods"] as const;

export default function Home() {
  const navigate = useNavigate();
  const { genres, tracks, saved } = useSeeds();
  const [filter, setFilter] = useState<string>("All");
  const [madeForYou, setMadeForYou] = useState<Track[]>([]);
  const [freshFinds, setFreshFinds] = useState<Track[]>([]);
  const [topGenres, setTopGenres] = useState<Array<{ name: string; count: number; hot: number; tracks: Track[] }>>([]);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

  const seedGenres = genres.map((g) => g.genre);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [countsRes, ...recs] = await Promise.all([
          api.getGenres(true),
          // Recommendations from up to 3 seed tracks (or a genre's top track)
          ...(tracks.length
            ? tracks.slice(0, 3).map((t) => api.getRecommendations(t.track_id, 20))
            : seedGenres.length
              ? [api.getGenreTracks(seedGenres[0], 20)]
              : [api.getGenreTracks("pop", 20)]),
        ]);
        if (cancelled) return;

        const pool = recs.flatMap((r) => ("recommendations" in r ? r.recommendations : r.tracks));
        const seen = new Set<string>();
        const unique = pool.filter((t) => {
          const k = `${t.track_name.toLowerCase()}|${t.artists.split(";")[0].toLowerCase()}`;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        setMadeForYou(unique.slice(0, 12));
        setFreshFinds([...unique].reverse().slice(0, 10));

        const withCounts = countsRes.counts ?? [];
        const hotMap = new Map((countsRes.hot_counts ?? []).map((c) => [c.name, c.count]));
        const top = (seedGenres.length ? seedGenres : withCounts.slice(0, 4).map((c) => c.name))
            .slice(0, 4)
            .map((g) => ({
              name: g,
              count: withCounts.find((c) => c.name === g)?.count ?? 0,
              hot: hotMap.get(g) ?? 0,
              tracks: [] as Track[],
            }));
        setTopGenres(top);
      } catch {
        /* shelf stays empty on failure */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks.length]);

  const banner = paletteFor(1); // lime
  const moodShelves = useMemo(
    () => [
      { title: "Chill mix", key: "chill", test: (t: Track) => (t.energy ?? 1) < 0.45 },
      { title: "Energetic mix", key: "energetic", test: (t: Track) => (t.energy ?? 0) >= 0.65 },
      { title: "Happy mix", key: "happy", test: (t: Track) => (t.valence ?? 0) >= 0.6 },
      { title: "Focus mix", key: "focus", test: (t: Track) => (t.speechiness ?? 1) < 0.05 && (t.instrumentalness ?? 0) > 0.2 },
    ],
    []
  );

  const show = (section: "songs" | "genres" | "moods") =>
    filter === "All" || (filter === "Songs" && section === "songs") || (filter === "Genres" && section === "genres") || (filter === "Moods" && section === "moods");

  return (
    <div className="flex flex-col gap-8 pt-4 md:pt-6">
      {/* Greeting + filters */}
      <header className="px-4 md:px-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Good to see you</h1>
        <div className="mt-3">
          <ChipGroup
            options={FILTERS.map((f) => ({ value: f, label: f }))}
            value={[filter]}
            onChange={(v) => setFilter(v[0] ?? "All")}
            multiple={false}
            size="compact"
          />
        </div>
      </header>

      {/* Wrapped banner */}
      <section className="px-4 md:px-6">
        <button
          onClick={() => navigate("/wrapped")}
          className="relative block w-full overflow-hidden rounded-xl p-6 text-left transition-transform duration-micro hover:scale-[1.005] md:p-8"
          style={{ backgroundColor: banner.bg, color: banner.text }}
          aria-label="Open your Wrapped story"
        >
          <div className="relative z-10 max-w-[60%]">
            <Sticker text={`Wrapped ${year}`} rotation={-5} className="mb-4" style={{ backgroundColor: "rgba(0,0,0,0.15)", color: banner.text }} />
            <h2 className="font-display text-2xl font-extrabold leading-tight tracking-[-0.03em] md:text-4xl">
              Your Wrapped
              <br />
              is ready
            </h2>
            <span className="mt-5 inline-flex h-10 items-center rounded-pill bg-white px-5 text-sm font-bold text-[#121212]">
              See your Wrapped
            </span>
          </div>
          {/* Art collage */}
          <div className="absolute -right-4 bottom-0 top-0 hidden w-2/5 items-center justify-end gap-2 sm:flex" aria-hidden>
            {madeForYou.slice(0, 3).map((t, i) => (
              <img
                key={t.track_id}
                src={t.artwork_url ?? ""}
                alt=""
                className={`h-28 w-28 rounded object-cover shadow-sheet ${i === 1 ? "rotate-6 translate-y-6" : i === 2 ? "rotate-12 translate-y-2" : "-rotate-6"}`}
              />
            ))}
          </div>
        </button>
      </section>

      {loading ? (
        <>
          <ShelfSkeleton />
          <ShelfSkeleton />
        </>
      ) : (
        <>
          {show("songs") && madeForYou.length > 0 && (
            <Shelf title="Made for you" subtitle={tracks.length ? "From your seeds" : "Try saving some tracks"}>
              {madeForYou.map((t) => (
                <div key={t.track_id} className="w-40 shrink-0 md:w-[200px]">
                  <TrackCard track={t} onNavigate={(id) => navigate(`/track/${id}`)} />
                </div>
              ))}
            </Shelf>
          )}

          {show("songs") && saved.length > 0 && (
            <section className="px-4 md:px-6">
              <h2 className="mb-2 font-display text-xl font-extrabold tracking-tight md:text-2xl">Saved tracks</h2>
              <div role="list">
                {saved.slice(0, 6).map((t) => (
                  <TrackRow key={t.track_id} track={t} onNavigate={(id) => navigate(`/track/${id}`)} showTier={false} />
                ))}
              </div>
            </section>
          )}

          {show("genres") && (
            <Shelf title="Your top genres" onShowAll={() => navigate("/search")}>
              {topGenres.map((g) => (
                <div key={g.name} className="w-[46%] shrink-0 sm:w-56">
                  <GenreTile
                    genre={g.name}
                    hotCount={g.hot}
                    tracks={madeForYou.filter((t) => t.track_genre === g.name).slice(0, 1)}
                    onClick={() => navigate(`/genre/${encodeURIComponent(g.name)}`)}
                  />
                </div>
              ))}
            </Shelf>
          )}

          {show("songs") && freshFinds.length > 0 && (
            <section className="px-4 md:px-6">
              <h2 className="mb-2 font-display text-xl font-extrabold tracking-tight md:text-2xl">Fresh finds</h2>
              <div role="list">
                {freshFinds.slice(0, 6).map((t, i) => (
                  <TrackRow key={t.track_id} track={t} rank={i + 1} onNavigate={(id) => navigate(`/track/${id}`)} />
                ))}
              </div>
            </section>
          )}

          {show("moods") &&
            moodShelves.map((m) => {
              const items = madeForYou.filter(m.test).slice(0, 8);
              if (!items.length) return null;
              return (
                <Shelf key={m.key} title={m.title}>
                  {items.map((t) => (
                    <div key={t.track_id} className="w-40 shrink-0 md:w-[200px]">
                      <TrackCard track={t} onNavigate={(id) => navigate(`/track/${id}`)} />
                    </div>
                  ))}
                </Shelf>
              );
            })}

          {!madeForYou.length && (
            <div className="px-4 py-16 text-center md:px-6">
              <p className="font-display text-xl font-extrabold">Nothing here yet</p>
              <p className="mt-1 text-sm text-secondary">Pick some seeds to generate recommendations.</p>
              <Button className="mt-5" onClick={() => navigate("/")}>
                Build my Wrapped
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

