import React from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { THEMES, useTheme, ThemeId, FREE_THEME_IDS } from "../lib/theme";
import { KitScope } from "../lib/themeKit";
import { THEME_UNLOCKS, canRemix } from "../lib/engagement";
import { ModalShell } from "./Modals";
import { Progress } from "./Progress";
import { LockIcon, XIcon } from "./icons";
import { cx } from "../lib/cx";

const UNLOCK_CONDITION: Record<string, string> = Object.fromEntries(
  THEME_UNLOCKS.map((t) => [t.id, t.condition])
);

const LEVEL_RE = /Level (\d+)/;

/** Pulls the numeric level requirement out of a condition string like
 * "Reach Level 3, or earn Shipped It", if it has one — used to show
 * progress ("Level 1/3") alongside the raw condition text. */
function requiredLevel(condition: string | undefined): number | null {
  if (!condition) return null;
  const match = condition.match(LEVEL_RE);
  return match ? Number(match[1]) : null;
}

const THEME_LABEL: Record<string, string> = Object.fromEntries(
  THEMES.map((t) => [t.id, t.label])
);

type GalleryTileProps = {
  themeId: ThemeId;
  isUnlocked: boolean;
  isSelected: boolean;
  isPreviewing: boolean;
  currentLevel: number;
  onSelect: () => void;
  onPreview: () => void;
};

/** A single grid tile: a live, isolated mini-preview of the theme (scoped by
 * its own `data-theme` + `KitScope` so it renders that theme's real palette
 * *and* signature components regardless of the app's active theme), plus
 * either a "Select" action (unlocked) or a lock badge + condition/progress +
 * "Preview" action (locked). */
function GalleryTile({
  themeId,
  isUnlocked,
  isSelected,
  isPreviewing,
  currentLevel,
  onSelect,
  onPreview,
}: GalleryTileProps) {
  const label = THEME_LABEL[themeId];
  const condition = UNLOCK_CONDITION[themeId];
  const levelNeeded = requiredLevel(condition);

  return (
    <li
      className={cx(
        "theme-tile",
        isSelected && "theme-tile--selected",
        isPreviewing && "theme-tile--previewing"
      )}
    >
      <div className="theme-tile__preview" data-theme={themeId} aria-hidden="true">
        <KitScope kit={themeId}>
          <div className="theme-tile__mock-card">
            <span className="theme-tile__mock-title">{label}</span>
            <Progress value={3} max={5} label={`${label} preview`} />
          </div>
          <span className="btn btn--primary theme-tile__mock-btn">Button</span>
          <div className="theme-tile__swatches">
            <span className="theme-tile__swatch" style={{ background: "var(--accent)" }} />
            <span className="theme-tile__swatch" style={{ background: "var(--surface)" }} />
          </div>
        </KitScope>
      </div>
      <div className="theme-tile__meta">
        <span className="theme-tile__label">
          {label}
          {isSelected && " · Selected"}
          {isPreviewing && " · Previewing"}
        </span>
        {isUnlocked ? (
          <button
            type="button"
            className="btn btn--primary"
            onClick={onSelect}
            disabled={isSelected}
          >
            {isSelected ? "Selected" : "Select"}
          </button>
        ) : (
          <>
            <span className="theme-tile__lock">
              <LockIcon /> Locked
            </span>
            <span className="theme-tile__condition">
              {condition}
              {levelNeeded != null && ` (Level ${currentLevel}/${levelNeeded})`}
            </span>
            <button type="button" className="btn" onClick={onPreview}>
              {isPreviewing ? "Previewing…" : "Preview"}
            </button>
          </>
        )}
      </div>
    </li>
  );
}

/**
 * The remix loadout: two selectors that pair any unlocked *palette* with any
 * unlocked *component kit*. Rendered only once `canRemix` is earned server-
 * side (the "Master Builder" achievement, p3-01) — the capability is never
 * client-forgeable. Picking a combo where palette === kit collapses back to a
 * plain theme (clears the remix keys, selects that theme) so a non-remix
 * state stays byte-identical to pre-p3-05.
 */
function Loadout({ unlockedIds }: { unlockedIds: ThemeId[] }) {
  const { theme, setTheme, remix, setRemix } = useTheme();
  const palette = remix?.palette ?? theme;
  const kit = remix?.kit ?? theme;

  const apply = (nextPalette: ThemeId, nextKit: ThemeId) => {
    if (nextPalette === nextKit) {
      // A matched combo is just a plain theme — revert cleanly.
      setRemix(null);
      setTheme(nextPalette);
    } else {
      setRemix({ palette: nextPalette, kit: nextKit });
    }
  };

  return (
    <section className="loadout" aria-label="Remix loadout">
      <h3 className="loadout__title">Loadout</h3>
      <p className="loadout__hint mono">Mix any unlocked palette with any unlocked component kit.</p>
      <div className="loadout__controls">
        <label className="loadout__field">
          <span className="eyebrow">Palette</span>
          <select
            className="loadout__select"
            value={palette}
            onChange={(e) => apply(e.target.value as ThemeId, kit)}
          >
            {unlockedIds.map((id) => (
              <option key={id} value={id}>
                {THEME_LABEL[id]}
              </option>
            ))}
          </select>
        </label>
        <span className="loadout__cross" aria-hidden="true">
          ⊗
        </span>
        <label className="loadout__field">
          <span className="eyebrow">Component kit</span>
          <select
            className="loadout__select"
            value={kit}
            onChange={(e) => apply(palette, e.target.value as ThemeId)}
          >
            {unlockedIds.map((id) => (
              <option key={id} value={id}>
                {THEME_LABEL[id]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {remix && (
        <button type="button" className="btn loadout__reset" onClick={() => setRemix(null)}>
          Reset to matched theme
        </button>
      )}
    </section>
  );
}

type ThemeGalleryProps = {
  open: boolean;
  onClose: () => void;
};

/** The theme gallery modal: every theme as a live-previewed tile. Locked
 * themes can only be trialed (session-only, via `setPreviewTheme`), never
 * selected — selection persists only for `free ∪ profile.unlockedThemes`. */
export function ThemeGallery({ open, onClose }: ThemeGalleryProps) {
  const { theme, setTheme, previewTheme, setPreviewTheme } = useTheme();
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.Profile.getProfile, isAuthenticated ? {} : "skip");

  const unlocked = React.useMemo(
    () => new Set<string>([...FREE_THEME_IDS, ...(profile?.unlockedThemes ?? [])]),
    [profile]
  );
  const unlockedIds = React.useMemo(
    () => THEMES.map((t) => t.id).filter((id) => unlocked.has(id)),
    [unlocked]
  );
  const currentLevel = profile?.level ?? 1;
  const remixAllowed = profile ? canRemix(profile) : false;

  if (!open) return null;

  return (
    <ModalShell title="Themes" onClose={onClose} variant="dialog">
      {remixAllowed && <Loadout unlockedIds={unlockedIds} />}
      <ul className="theme-gallery">
        {THEMES.map((t) => (
          <GalleryTile
            key={t.id}
            themeId={t.id}
            isUnlocked={unlocked.has(t.id)}
            isSelected={theme === t.id}
            isPreviewing={previewTheme === t.id}
            currentLevel={currentLevel}
            onSelect={() => setTheme(t.id)}
            onPreview={() => setPreviewTheme(previewTheme === t.id ? null : t.id)}
          />
        ))}
      </ul>
      <div className="modal__actions">
        <button type="button" className="btn" onClick={onClose}>
          Close
        </button>
      </div>
    </ModalShell>
  );
}

/** Dismissible app-level banner shown while a locked theme is being trialed.
 * Mounted unconditionally in the header (so it survives the gallery modal
 * closing) and renders nothing when there's no active preview. */
export function PreviewBanner() {
  const { previewTheme, setPreviewTheme } = useTheme();
  if (!previewTheme) return null;

  const label = THEME_LABEL[previewTheme];
  const condition = UNLOCK_CONDITION[previewTheme];

  return (
    <div className="preview-banner" role="status">
      <span>
        Previewing <strong>{label}</strong>
        {condition && ` — ${condition}`}
      </span>
      <button
        type="button"
        className="preview-banner__exit"
        onClick={() => setPreviewTheme(null)}
      >
        <XIcon /> Exit preview
      </button>
    </div>
  );
}
