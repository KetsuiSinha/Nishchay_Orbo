import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { SearchBar } from "../components/browse/SearchBar";
import { GenreTile } from "../components/browse/GenreTile";
import { TrackRow } from "../components/media/TrackRow";
import { ArtistChip } from "../components/media/ArtistChip";
import { Skeleton } from "../components/ui/Skeleton";
import { Chip } from "../components/ui/Chip";
import type { GenreCount, Track } from "../types";

type GenreWithHot = GenreCount & { hot: number };

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [allGenres, setAllGenres] = useState<GenreWithHot[]>([]);
  const [results, setResults] = useState<Track[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(true);
  const [searching, setSearching] = useState(false);
  const [genreFilter, setGenreFilter] = useState<"popular" | "az">("popular");

  useEffect(() => {
    api.getGenres(true).then((r) => {
      const hot = new Map((r.hot_counts ?? []).map((c) => [c.name, c.count]));
      const counts = (r.counts ?? r.genres.map((g) => ({ name: g, count: 0 }))).map((c) => ({
        ...c,
        hot: hot.get(c.name) ?? 0,
      }));
      setAllGenres(counts);
      setLoadingGenres(false);
    });
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      api
        .searchTracks(query, 30)
        .then((r) => setResults(r.tracks))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const genres =
    genreFilter === "az"
      ? [...allGenres].sort((a, b) => a.name.localeCompare(b.name))
      : [...allGenres].sort((a, b) => b.hot - a.hot);

  const artists = Array.from(
    new Map(
      results.map((t) => [
        t.artists.split(";")[0].trim(),
        { name: t.artists.split(";")[0].trim(), image: t.artist_image_url },
      ])
    ).values()
  ).slice(0, 8);

  return (
    <div className="flex flex-col gap-6 pt-4 md:pt-6">
      <header className="px-4 md:px-6">
        <h1 className="mb-4 font-display text-2xl font-extrabold tracking-tight md:text-3xl">Search</h1>
        <SearchBar onSearch={setQuery} onValueChange={setQuery} autoFocus />
      </header>

      {query.trim().length < 2 ? (
        <section className="px-4 md:px-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">Browse all</h2>
            <div className="flex gap-1.5">
              <Chip label="Popular" size="compact" selected={genreFilter === "popular"} onClick={() => setGenreFilter("popular")} />
              <Chip label="A–Z" size="compact" selected={genreFilter === "az"} onClick={() => setGenreFilter("az")} />
            </div>
          </div>
          {loadingGenres ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {[...Array(15)].map((_, i) => (
                <Skeleton key={i} className="aspect-[16/11] rounded" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {genres.map((g) => (
                <GenreTile
                  key={g.name}
                  genre={g.name}
                  hotCount={g.hot}
                  onClick={() => navigate(`/genre/${encodeURIComponent(g.name)}`)}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="space-y-8 px-4 md:px-6">
          {artists.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-xl font-extrabold tracking-tight">Artists</h2>
              <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
                {artists.map((a) => (
                  <ArtistChip
                    key={a.name}
                    name={a.name}
                    imageUrl={a.image}
                    onClick={() => navigate(`/artist/${encodeURIComponent(a.name)}`)}
                  />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-2 font-display text-xl font-extrabold tracking-tight">
              Songs <span className="ml-1 text-sm font-semibold text-secondary">{results.length}</span>
            </h2>
            {searching ? (
              <div className="space-y-1">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded" />
                ))}
              </div>
            ) : results.length ? (
              <div role="list">
                {results.map((t, i) => (
                  <TrackRow key={t.track_id} track={t} rank={i + 1} onNavigate={(id) => navigate(`/track/${id}`)} showTier={false} />
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-secondary">No results for “{query}”</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
