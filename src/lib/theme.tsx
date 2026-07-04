import React from "react";

export const THEMES = [
  { id: "daylight", label: "Daylight", free: true },
  { id: "blueprint", label: "Blueprint", free: true },
  { id: "graphite", label: "Graphite", free: true },
  { id: "jobsite", label: "Jobsite", free: true },
  { id: "arc-reactor", label: "Arc Reactor", free: false },
  { id: "command", label: "Command", free: false },
  { id: "phosphor", label: "Phosphor", free: false },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

/** Themes every user can select regardless of profile/unlock state. */
export const FREE_THEME_IDS: ThemeId[] = THEMES.filter((t) => t.free).map((t) => t.id);

export const DEFAULT_THEME: ThemeId = "daylight";

/** Back-compat source of truth for the plain (non-remix) selected theme. */
const THEME_KEY = "groundwork-theme";
/** Remix loadout, written ONLY while a remix is engaged (Fable issue #6). */
const PALETTE_KEY = "groundwork-palette";
const KIT_KEY = "groundwork-kit";

function isThemeId(value: string | null): value is ThemeId {
  return value !== null && THEMES.some((t) => t.id === value);
}

function initialTheme(): ThemeId {
  const stored = localStorage.getItem(THEME_KEY);
  if (isThemeId(stored)) return stored;
  // Legacy values from the old light/dark toggle
  if (stored === "dark") return "graphite";
  if (stored === "light") return "daylight";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "graphite" : "daylight";
}

/** A remix loadout: an independently-chosen palette + component kit. */
export type Remix = { palette: ThemeId; kit: ThemeId };

/**
 * Reads a persisted remix loadout. Present only once the user has engaged
 * remix (both keys written together). Unlock/`canRemix` validity is NOT
 * checked here — `ThemeProvider` sits above auth and has no profile — so a
 * stale or locked loadout is corrected post-load by the header's gate
 * (`useThemeGate`), exactly as a stale plain theme already is.
 */
function initialRemix(): Remix | null {
  const palette = localStorage.getItem(PALETTE_KEY);
  const kit = localStorage.getItem(KIT_KEY);
  if (isThemeId(palette) && isThemeId(kit)) return { palette, kit };
  return null;
}

const ThemeContext = React.createContext<{
  /** The persisted/selected plain theme — what `useThemeGate` gates on. */
  theme: ThemeId;
  /** Selects + persists a plain theme (also the palette+kit when not remixing). */
  setTheme: (theme: ThemeId) => void;
  /** Transient, in-memory-only trial override — never persisted. `null` when not previewing. */
  previewTheme: ThemeId | null;
  /** Starts/stops a session-only trial of a (usually locked) theme without touching `theme`. */
  setPreviewTheme: (theme: ThemeId | null) => void;
  /** Active remix loadout (palette ⊗ kit), or `null` when not remixing. */
  remix: Remix | null;
  /** Sets/clears the remix loadout; `null` reverts to the plain `theme` and clears its keys. */
  setRemix: (remix: Remix | null) => void;
  /** The palette actually painted (`data-theme`): preview ▸ remix ▸ plain theme. */
  appliedPalette: ThemeId;
  /** The kit actually active (`data-kit` / `useThemeKit`): preview ▸ remix ▸ plain theme. */
  appliedKit: ThemeId;
} | null>(null);

export const THEME_BG: Record<ThemeId, string> = {
  daylight: "#f3f4f1",
  blueprint: "#10273f",
  graphite: "#17181a",
  jobsite: "#ffffff",
  "arc-reactor": "#03070a",
  command: "#14180f",
  phosphor: "#030904",
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<ThemeId>(initialTheme);
  // Session-only trial override (p3-02). Never read from/written to
  // localStorage — a reload always drops back to the persisted state.
  const [previewTheme, setPreviewTheme] = React.useState<ThemeId | null>(null);
  // Remix loadout (p3-05); null unless the user has engaged remix.
  const [remix, setRemix] = React.useState<Remix | null>(initialRemix);

  // Resolution precedence for both dimensions: a live trial wins (it shows a
  // whole theme, palette + kit together), then a remix loadout, then the
  // plain theme (where palette === kit === theme — identical to pre-p3-05).
  const appliedPalette = previewTheme ?? remix?.palette ?? theme;
  const appliedKit = previewTheme ?? remix?.kit ?? theme;

  // The plain theme is always persisted — the sole source of truth for a
  // non-remix user (back-compat).
  React.useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // The remix keys are written ONLY while a loadout is engaged, and removed
  // when it's cleared — so a non-remix user's storage stays exactly as it was
  // before p3-05 (Fable issue #6: `groundwork-theme` is the sole source of
  // truth when not remixing).
  React.useEffect(() => {
    if (remix) {
      localStorage.setItem(PALETTE_KEY, remix.palette);
      localStorage.setItem(KIT_KEY, remix.kit);
    } else {
      localStorage.removeItem(PALETTE_KEY);
      localStorage.removeItem(KIT_KEY);
    }
  }, [remix]);

  // Palette drives the token scope (`data-theme`) and the browser chrome color.
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", appliedPalette);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", THEME_BG[appliedPalette]);
  }, [appliedPalette]);

  // Kit drives the signature-component layer (`data-kit`): ambient overlays,
  // set-pieces, and `useThemeKit()`. Separate from palette so a remix combo
  // paints one theme's colors under another's components.
  React.useEffect(() => {
    document.documentElement.setAttribute("data-kit", appliedKit);
  }, [appliedKit]);

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      previewTheme,
      setPreviewTheme,
      remix,
      setRemix,
      appliedPalette,
      appliedKit,
    }),
    [theme, previewTheme, remix, appliedPalette, appliedKit]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
