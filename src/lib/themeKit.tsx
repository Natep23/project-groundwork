import React from "react";
import { useTheme, type ThemeId } from "./theme";

/**
 * A "kit" is the component-kit half of Phase 3's palette/kit split (see
 * `plans/p3-00-overview.md`): a named set of signature components (loader,
 * progress, boot, and later set-pieces) selected per theme. Kits are 1:1
 * with themes today, so `ThemeKitId` is just `ThemeId` — but the API is
 * shaped so a later remix tier (p3-05) can select a kit independently of
 * the active palette.
 */
export type ThemeKitId = ThemeId;

/** The three bespoke kits; every other theme id resolves to the default kit. */
export type BespokeKitId = "arc-reactor" | "command" | "phosphor";

export function isBespokeKit(kit: ThemeKitId): kit is BespokeKitId {
  return kit === "arc-reactor" || kit === "command" || kit === "phosphor";
}

export type ThemeKit = {
  id: ThemeKitId;
  label: string;
};

export const THEME_KITS: Record<ThemeKitId, ThemeKit> = {
  daylight: { id: "daylight", label: "Default" },
  blueprint: { id: "blueprint", label: "Default" },
  graphite: { id: "graphite", label: "Default" },
  jobsite: { id: "jobsite", label: "Default" },
  "arc-reactor": { id: "arc-reactor", label: "Arc Reactor" },
  command: { id: "command", label: "Command" },
  phosphor: { id: "phosphor", label: "Phosphor" },
};

/**
 * Holds an optional kit override for a subtree. `undefined` (the default)
 * means "no override" — `useThemeKit()` falls back to the active theme.
 * Set by `KitScope` (per-tile mini-previews in p3-02, and later p3-05's
 * independent kit picker).
 */
const KitOverrideContext = React.createContext<ThemeKitId | undefined>(undefined);

/**
 * Overrides the active kit for everything under it, without touching the
 * palette (`data-theme`). p3-02 uses this so a gallery mini-preview tile can
 * render another theme's signature loader/progress while the rest of the
 * app stays on the user's current theme; a nested `KitScope` (or p3-05's
 * remix picker) simply overrides again further down the tree.
 *
 * Usage: `<KitScope kit="command"><Loader /></KitScope>` renders the
 * Command-kit loader regardless of the ambient theme.
 */
export function KitScope({ kit, children }: { kit: ThemeKitId; children: React.ReactNode }) {
  return <KitOverrideContext.Provider value={kit}>{children}</KitOverrideContext.Provider>;
}

/**
 * Returns the active kit id: an ancestor `KitScope` override if present,
 * otherwise the applied kit from `ThemeProvider`. For a non-remix user the
 * applied kit equals the active theme (kit === palette === theme); a remix
 * loadout (p3-05) lets it diverge from the palette, and a gallery trial
 * (p3-02) overrides both.
 */
export function useThemeKit(): ThemeKitId {
  const override = React.useContext(KitOverrideContext);
  // Falls back to `appliedKit` (not the persisted `theme`) so both a full-app
  // trial and a remix loadout swap signature components, independent of the
  // palette on `data-theme`.
  const { appliedKit } = useTheme();
  return override ?? appliedKit;
}
