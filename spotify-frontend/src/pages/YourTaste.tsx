import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useSeeds } from "../state/seeds";
import { usePlayer } from "../state/player";
import { Button } from "../components/ui/Button";
import { Chip } from "../components/ui/Chip";
import { TrackRow } from "../components/media/TrackRow";
import { CoverArt } from "../components/media/CoverArt";
import { toast } from "../state/toast";
import type { Track } from "../types";

export default function YourTaste() {
  const navigate = useNavigate();
  const { genres, tracks, saved, removeGenre, toggleSaved, clearSeeds } = useSeeds();
  const play = usePlayer((s) => s.play);

  const regenerate = async () => {
    toast.info("Generating your Wrapped…");
    try {
      await api.generateWrapped({ track_ids: tracks.map((t) => t.track_id), genres: genres.map((g) => g.genre) });
      navigate("/wrapped");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not regenerate");
    }
  };

  return (
    <div className="flex flex-col gap-8 pt-4 md:pt-6">
      <header className="px-4 md:px-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Your Taste</h1>
        <p className="mt-1 text-sm text-secondary">The seeds behind your Wrapped. Edit them anytime.</p>
      </header>

      {/* Seeds */}
      <section className="px-4 md:px-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold tracking-tight">Seed genres</h2>
          {(genres.length > 0 || tracks.length > 0) && (
            <button
              onClick={() => {
                clearSeeds();
                toast.success("Seeds cleared");
              }}
              className="text-xs font-bold uppercase tracking-label text-secondary hover:text-primary"
            >
              Clear all
            </button>
          )}
        </div>
        {genres.length === 0 ? (
          <p className="text-sm text-secondary">
            No genres picked.{" "}
            <button onClick={() => navigate("/")} className="font-semibold text-green-bright underline underline-offset-2">
              Add some
            </button>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <Chip key={g.genre} label={g.genre.replace(/-/g, " ")} selected onClick={() => removeGenre(g.genre)} />
            ))}
          </div>
        )}
      </section>

      <section className="px-4 md:px-6">
        <h2 className="mb-3 font-display text-xl font-extrabold tracking-tight">Seed tracks</h2>
        {tracks.length === 0 ? (
          <p className="text-sm text-secondary">
            No tracks picked.{" "}
            <button onClick={() => navigate("/")} className="font-semibold text-green-bright underline underline-offset-2">
              Add some
            </button>
          </p>
        ) : (
          <div role="list">
            {tracks.map((t) => (
              <TrackRow
                key={t.track_id}
                track={
                  {
                    track_id: t.track_id,
                    track_name: t.track_name,
                    artists: t.artists,
                    album_name: "",
                    track_genre: "",
                    duration_ms: 0,
                    explicit: false,
                    popularity: 0,
                    artwork_url: t.artwork_url,
                    artist_image_url: null,
                  } as Track
                }
                onNavigate={(id) => navigate(`/track/${id}`)}
                showTier={false}
              />
            ))}
          </div>
        )}
      </section>

      <section className="px-4 md:px-6">
        <Button onClick={regenerate} disabled={tracks.length === 0 && genres.length === 0}>
          Regenerate Wrapped
        </Button>
      </section>

      {/* Saved */}
      <section className="px-4 md:px-6">
        <h2 className="mb-3 font-display text-xl font-extrabold tracking-tight">
          Saved tracks <span className="ml-1 text-sm font-semibold text-secondary">{saved.length}</span>
        </h2>
        {saved.length === 0 ? (
          <p className="text-sm text-secondary">Tap the heart on any track to save it here.</p>
        ) : (
          <div role="list">
            {saved.map((t) => (
              <div key={t.track_id} className="group flex items-center gap-3 rounded px-2 py-2 hover:bg-highlight">
                <CoverArt track={t} size="xs" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.track_name}</p>
                  <p className="truncate text-xs text-secondary">{t.artists}</p>
                </div>
                <button
                  onClick={() => play(t)}
                  className="rounded-full px-3 py-1.5 text-xs font-bold text-secondary hover:text-primary"
                  aria-label={`Play ${t.track_name}`}
                >
                  Play
                </button>
                <button
                  onClick={() => toggleSaved(t)}
                  className="rounded-full p-2 text-secondary hover:text-primary"
                  aria-label={`Remove ${t.track_name} from saved`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Past Wrappeds (snapshots of seeds at generate time) */}
      <section className="px-4 pb-4 md:px-6">
        <h2 className="mb-3 font-display text-xl font-extrabold tracking-tight">Past Wrappeds</h2>
        <p className="text-sm text-secondary">
          Snapshots appear here after you share a Wrapped. Your current seeds:{" "}
          <span className="font-semibold text-primary">
            {genres.length} genre{genres.length === 1 ? "" : "s"}, {tracks.length} track
            {tracks.length === 1 ? "" : "s"}
          </span>
          . {saved.length > 0 && `${saved.length} saved.`}
        </p>
      </section>
    </div>
  );
}
