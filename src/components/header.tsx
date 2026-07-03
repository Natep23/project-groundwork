import React from "react";
import { Authenticated, useConvexAuth, useQuery } from "convex/react";
import { UserButton } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../convex/_generated/api";
import { THEMES, useTheme, ThemeId, FREE_THEME_IDS, DEFAULT_THEME } from "../lib/theme";
import { THEME_UNLOCKS } from "../lib/engagement";
import { HQConsole } from "./HQConsole";
import { FlameIcon } from "./icons";

const UNLOCK_CONDITION: Record<string, string> = Object.fromEntries(
  THEME_UNLOCKS.map((t) => [t.id, t.condition])
);

/**
 * Gates theme *selection* only: `free ∪ profile.unlockedThemes` is
 * selectable, everything else renders as a disabled option with its unlock
 * condition. Signed-out visitors (no profile) only ever see the free set as
 * selectable. If the currently-applied theme somehow isn't in that
 * selectable set (e.g. tampered localStorage, or the pre-paint script
 * applying a stale value), fall back to the default free theme rather than
 * leaving an ungated, unselectable theme painted on screen.
 */
function useThemeGate() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const profile = useQuery(api.Profile.getProfile, isAuthenticated ? {} : "skip");
  const { theme, setTheme } = useTheme();

  const unlocked = React.useMemo(
    () => new Set<string>([...FREE_THEME_IDS, ...(profile?.unlockedThemes ?? [])]),
    [profile]
  );

  // Only decide once auth has resolved and (if signed in) the profile has
  // loaded. Otherwise the loading window looks unauthenticated, and the effect
  // below would reset an unlocked theme to the default on every page load.
  const ready = !isLoading && (!isAuthenticated || profile !== undefined);

  React.useEffect(() => {
    if (!ready) return;
    if (!unlocked.has(theme)) setTheme(DEFAULT_THEME);
  }, [ready, unlocked, theme, setTheme]);

  return unlocked;
}

function sheetLabel(pathname: string): string {
  if (pathname === "/create-card") return "S-02 · NEW CARD";
  if (pathname.startsWith("/card/")) return "S-03 · CARD DETAIL";
  return "S-01 · BOARD";
}

function HQCell() {
  const profile = useQuery(api.Profile.getProfile);
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div className="titleblock__cell">
        <span className="eyebrow">Status</span>
        <button
          type="button"
          className="titleblock__hq"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
        >
          <FlameIcon
            className={
              profile && profile.currentStreak > 0
                ? "briefing__flame briefing__flame--lit"
                : "briefing__flame"
            }
          />
          HQ{profile ? ` · L${profile.level}` : ""}
        </button>
      </div>
      {profile && <HQConsole open={open} profile={profile} onClose={() => setOpen(false)} />}
    </>
  );
}

export const Header = () => {
  const { theme, setTheme } = useTheme();
  const unlocked = useThemeGate();
  const { pathname } = useLocation();
  const today = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  return (
    <header className="titleblock">
      <div className="titleblock__cell">
        <span className="eyebrow">Project</span>
        <Link to="/" className="wordmark">
          Ground<span>Work</span>
        </Link>
      </div>
      <div className="titleblock__cell titleblock__cell--sheet">
        <span className="eyebrow">Sheet</span>
        <span className="titleblock__value">{sheetLabel(pathname)}</span>
      </div>
      <div className="titleblock__cell titleblock__cell--date">
        <span className="eyebrow">Date</span>
        <span className="titleblock__value">{today}</span>
      </div>
      <div className="titleblock__cell titleblock__cell--grow" aria-hidden="true" />
      <div className="titleblock__cell">
        <label className="eyebrow" htmlFor="theme-select">
          Print
        </label>
        <select
          id="theme-select"
          className="theme-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value as ThemeId)}
        >
          {THEMES.map((t) => {
            const isUnlocked = unlocked.has(t.id);
            return (
              <option key={t.id} value={t.id} disabled={!isUnlocked}>
                {isUnlocked ? t.label : `🔒 ${t.label} — ${UNLOCK_CONDITION[t.id]}`}
              </option>
            );
          })}
        </select>
      </div>
      <Authenticated>
        <HQCell />
        <div className="titleblock__cell titleblock__cell--end">
          <UserButton />
        </div>
      </Authenticated>
    </header>
  );
};
