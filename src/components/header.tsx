import React from "react";
import { Authenticated, useConvexAuth, useQuery } from "convex/react";
import { UserButton } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../convex/_generated/api";
import { useTheme, FREE_THEME_IDS, DEFAULT_THEME } from "../lib/theme";
import { canRemix } from "../lib/engagement";
import { HQConsole } from "./HQConsole";
import { ThemeGallery, PreviewBanner } from "./ThemeGallery";
import { FlameIcon } from "./icons";

/**
 * Gates theme *selection* only: `free ∪ profile.unlockedThemes` is
 * selectable, everything else can only be trialed via the gallery's
 * session-only preview. Signed-out visitors (no profile) only ever see the
 * free set as selectable. If the currently-*selected* theme somehow isn't in
 * that selectable set (e.g. tampered localStorage, or the pre-paint script
 * applying a stale value), fall back to the default free theme rather than
 * leaving an ungated, unselectable theme painted on screen. This gates only
 * on the persisted `theme`, never `appliedPalette`/`appliedKit` — so
 * previewing or remixing a locked theme never trips the reset. It also
 * re-validates a persisted remix loadout against the profile (see below).
 */
function useThemeGate() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const profile = useQuery(api.Profile.getProfile, isAuthenticated ? {} : "skip");
  const { theme, setTheme, remix, setRemix } = useTheme();

  const unlocked = React.useMemo(
    () => new Set<string>([...FREE_THEME_IDS, ...(profile?.unlockedThemes ?? [])]),
    [profile]
  );
  const remixAllowed = profile ? canRemix(profile) : false;

  // Only decide once auth has resolved and (if signed in) the profile has
  // loaded. Otherwise the loading window looks unauthenticated, and the effect
  // below would reset an unlocked theme to the default on every page load.
  const ready = !isLoading && (!isAuthenticated || profile !== undefined);

  React.useEffect(() => {
    if (!ready) return;
    if (!unlocked.has(theme)) setTheme(DEFAULT_THEME);
    // A remix loadout persisted in localStorage is server-untrusted, so
    // re-validate it once the profile is known: if remix isn't earned or the
    // palette is no longer unlocked, drop back to the plain theme; if only the
    // kit is locked, degrade it silently to the palette's own kit (Fable
    // issue #6). The pre-paint script only ever applied the palette, so this
    // correction touches the post-hydration kit without a paint flash.
    if (remix) {
      if (!remixAllowed || !unlocked.has(remix.palette)) {
        setRemix(null);
      } else if (!unlocked.has(remix.kit)) {
        setRemix({ palette: remix.palette, kit: remix.palette });
      }
    }
  }, [ready, unlocked, theme, setTheme, remix, remixAllowed, setRemix]);

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
  useThemeGate();
  const { pathname } = useLocation();
  const [galleryOpen, setGalleryOpen] = React.useState(false);
  const today = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  return (
    <>
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
          <span className="eyebrow">Print</span>
          <button
            type="button"
            className="btn theme-gallery-btn"
            onClick={() => setGalleryOpen(true)}
            aria-haspopup="dialog"
          >
            Themes
          </button>
        </div>
        <Authenticated>
          <HQCell />
          <div className="titleblock__cell titleblock__cell--end">
            <UserButton />
          </div>
        </Authenticated>
      </header>
      <PreviewBanner />
      <ThemeGallery open={galleryOpen} onClose={() => setGalleryOpen(false)} />
    </>
  );
};
