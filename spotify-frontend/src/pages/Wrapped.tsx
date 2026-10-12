import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useSeeds } from "../state/seeds";
import { StoryPlayer } from "../components/wrapped/StoryPlayer";
import { Button } from "../components/ui/Button";
import type { WrappedPayload } from "../types";

export default function Wrapped() {
  const navigate = useNavigate();
  const { genres, tracks } = useSeeds();
  const [data, setData] = useState<WrappedPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .generateWrapped({
        track_ids: tracks.map((t) => t.track_id),
        genres: genres.map((g) => g.genre),
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not build your Wrapped"));
  }, [tracks, genres]);

  if (error) {
    return (
      <div className="flex min-h-[80dvh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-display text-2xl font-extrabold">Hmm, that didn't work</p>
        <p className="max-w-[36ch] text-sm text-secondary">{error}</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go back
          </Button>
          <Button onClick={() => navigate("/")}>Pick seeds</Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[80dvh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-green border-t-transparent" aria-hidden />
        <p className="text-sm font-medium text-secondary">Building your Wrapped…</p>
      </div>
    );
  }

  return <StoryPlayer data={data} onClose={() => navigate("/home")} />;
}
