import React from "react";
import type { CelebrationEvent } from "./engagement";
import { useTheme } from "./theme";

/**
 * Theming seam for workstream 06 (themes & motion): lets a theme skin the
 * celebration visuals (icon + copy per event kind) without touching the
 * queue/diff logic in `useEngagementCelebrations`. Wrap the app in
 * `EngagementVisualsProvider` with overrides; anything left `undefined`
 * falls back to the default here.
 */
export type EngagementVisuals = {
  icon: (event: CelebrationEvent) => React.ReactNode;
  title: (event: CelebrationEvent) => string;
  /** Extra class applied to the celebration card, e.g. for a theme-specific animation. */
  className?: (event: CelebrationEvent) => string | undefined;
};

const defaultVisuals: EngagementVisuals = {
  icon: (event) => {
    switch (event.kind) {
      case "level_up":
        return "⬆"; // up arrow
      case "achievement":
        return "★"; // star
      case "theme_unlock":
        return "◈"; // diamond
    }
  },
  title: (event) => {
    switch (event.kind) {
      case "level_up":
        return `Level ${event.level}`;
      case "achievement":
        return "Achievement unlocked";
      case "theme_unlock":
        return "New print unlocked";
    }
  },
};

const EngagementVisualsContext = React.createContext<EngagementVisuals>(defaultVisuals);

export function EngagementVisualsProvider({
  value,
  children,
}: {
  value: Partial<EngagementVisuals>;
  children: React.ReactNode;
}) {
  const merged = React.useMemo<EngagementVisuals>(
    () => ({ ...defaultVisuals, ...value }),
    [value]
  );
  return (
    <EngagementVisualsContext.Provider value={merged}>{children}</EngagementVisualsContext.Provider>
  );
}

export function useEngagementVisuals(): EngagementVisuals {
  return React.useContext(EngagementVisualsContext);
}

// ---------------------------------------------------------------------------
// Workstream 06: HUD-flavored overrides for the unlockable themes. Only
// arc-reactor and command get bespoke copy/iconography per the spec ("HUD
// flourishes in arc-reactor/command, restrained elsewhere") — phosphor keeps
// the default copy but still gets its own CRT-flavored celebration frame via
// `className`.
// ---------------------------------------------------------------------------

const arcReactorVisuals: Partial<EngagementVisuals> = {
  icon: (event) => {
    switch (event.kind) {
      case "level_up":
        return "⟁";
      case "achievement":
        return "◈";
      case "theme_unlock":
        return "⌬";
    }
  },
  title: (event) => {
    switch (event.kind) {
      case "level_up":
        return `System upgrade — Level ${event.level}`;
      case "achievement":
        return "Protocol unlocked";
      case "theme_unlock":
        return "New HUD skin online";
    }
  },
  className: () => "celebration--arc-reactor",
};

const commandVisuals: Partial<EngagementVisuals> = {
  icon: (event) => {
    switch (event.kind) {
      case "level_up":
        return "▲";
      case "achievement":
        return "★";
      case "theme_unlock":
        return "◆";
    }
  },
  title: (event) => {
    switch (event.kind) {
      case "level_up":
        return `Promotion — Rank ${event.level}`;
      case "achievement":
        return "Commendation earned";
      case "theme_unlock":
        return "New loadout available";
    }
  },
  className: () => "celebration--command",
};

const phosphorVisuals: Partial<EngagementVisuals> = {
  className: () => "celebration--phosphor",
};

const THEME_VISUALS: Record<string, Partial<EngagementVisuals>> = {
  "arc-reactor": arcReactorVisuals,
  command: commandVisuals,
  phosphor: phosphorVisuals,
};

/**
 * Reads the active theme and feeds the matching overrides into
 * `EngagementVisualsProvider`. Mount once, inside `ThemeProvider` and above
 * `EngagementCelebrations` (see `App.tsx`).
 */
export function ThemedEngagementVisuals({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const overrides = THEME_VISUALS[theme] ?? {};
  return <EngagementVisualsProvider value={overrides}>{children}</EngagementVisualsProvider>;
}
