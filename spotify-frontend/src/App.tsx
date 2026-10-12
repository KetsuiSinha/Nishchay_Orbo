import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { Toaster } from "./components/ui/Toast";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Genre from "./pages/Genre";
import Artist from "./pages/Artist";
import Track from "./pages/Track";
import YourTaste from "./pages/YourTaste";
import Wrapped from "./pages/Wrapped";
import Onboarding from "./pages/Onboarding";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route element={<AppShell />}>
          <Route path="/home" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/library" element={<YourTaste />} />
          <Route path="/genre/:slug" element={<Genre />} />
          <Route path="/artist/:name" element={<Artist />} />
          <Route path="/track/:trackId" element={<Track />} />
        </Route>
        <Route path="/wrapped" element={<Wrapped />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}
