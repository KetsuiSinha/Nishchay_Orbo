import { NavLink, Outlet } from "react-router-dom";
import { Heart, Home, Search } from "lucide-react";
import { cn } from "../../lib/utils";
import { MiniPlayer } from "../media/MiniPlayer";

const NAV = [
  { to: "/home", label: "Home", Icon: Home },
  { to: "/search", label: "Search", Icon: Search },
  { to: "/library", label: "Your Taste", Icon: Heart },
];

/**
 * Spotify-faithful shell: tab bar on mobile, sidebar ≥1024px,
 * MiniPlayer docked above the tab bar, content never overlapped.
 */
export function AppShell() {
  return (
    <div className="min-h-[100dvh] bg-base">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-[100] hidden w-[72px] flex-col items-center gap-2 bg-base py-4 md:flex lg:w-[240px] lg:items-start lg:px-3">
        <BrandMark />
        <nav className="mt-4 flex w-full flex-col gap-1" aria-label="Main">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-4 rounded px-3 py-2.5 font-semibold transition-colors",
                  "justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white lg:justify-start",
                  isActive ? "text-primary" : "text-secondary hover:text-primary"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-6 w-6 shrink-0" fill={isActive ? "currentColor" : "none"} aria-hidden />
                  <span className="hidden text-[15px] lg:inline">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main — bottom padding covers tab bar (56) + mini player (56) + safe area */}
      <main className="pb-[calc(128px+env(safe-area-inset-bottom,0px))] md:pl-[72px] lg:pl-[240px]">
        <div className="mx-auto max-w-[1280px]">
          <Outlet />
        </div>
      </main>

      {/* Mobile tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-[100] flex h-[calc(56px+env(safe-area-inset-bottom,0px))] items-stretch border-t border-white/5 bg-[#121212f2] pb-[env(safe-area-inset-bottom,0px)] backdrop-blur md:hidden"
        aria-label="Main"
      >
        {NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-transform active:scale-95",
                isActive ? "text-primary" : "text-secondary"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-6 w-6" fill={isActive ? "currentColor" : "none"} aria-hidden />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <MiniPlayer />
    </div>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-2 px-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green" aria-hidden>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#121212">
          <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
        </svg>
      </span>
      <span className="hidden font-display text-lg font-extrabold tracking-tight text-primary lg:inline">
        Wrapped
      </span>
    </div>
  );
}
