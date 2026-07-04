# p3-05 — Mix mode: palette ⊗ component-kit (unlockable)

**Recommended subagent:** **Opus** — the hard integration: ThemeProvider `data-theme`/`data-kit` split, pre-paint script + `theme.tsx` mirror sync, `useThemeGate` interplay, localStorage back-compat, and a server-gated capability. A subtle bug here becomes a paint flash or a gate loop.
**Depends on:** p3-01 (remix unlock), p3-02 (gallery), p3-03 (kit registry + `data-kit`)

> **Persistence back-compat (Fable issue #6 — acceptance criterion):** keep `groundwork-theme` as the sole source of truth when NOT remixing; write `groundwork-palette`/`groundwork-kit` only once a remix is actually engaged. The pre-paint script's fallback chain is **palette-key → theme-key → media query**. A stale `groundwork-kit` naming a locked/unknown theme must degrade **silently** to the palette's kit (no gate loop, no flash).

## Goal
The later-tier reward: once `canRemix` is earned, let the user pair any unlocked **palette** with any unlocked **component kit** — e.g. Command colors + Arc-reactor circular loaders — and persist the combo.

## Scope
- **Decouple palette from kit** in `ThemeProvider`: state becomes `{ palette, kit }` (both default to the selected theme id). `data-theme` on `<html>` follows `palette`; `useThemeKit()` follows `kit`. When not remixing, `palette === kit === theme` (identical to today).
- **Gate** on `canRemix(profile)` from p3-01. Locked → no remix UI; the gallery behaves as p3-02.
- **Loadout UI** in the gallery (a "Loadout" tab/section, only when unlocked): two selectors — **Palette** and **Component kit** — each limited to *unlocked* themes (`free ∪ unlockedThemes`). Selecting a combo persists it (e.g. `localStorage` `groundwork-palette` / `groundwork-kit`), alongside the plain theme for back-compat.
- **Celebration** when remix first unlocks (rides the existing `achievement` celebration from p3-01).
- **Pre-paint**: only `palette` matters for the `index.html` pre-paint script (kit is post-hydration) — update the script + `lib/theme.tsx` mirror to read the persisted palette; a persisted kit that isn't unlocked falls back gracefully to the palette's kit.

## Acceptance criteria
- Remix UI is invisible/inert until `canRemix` is true; never client-forgeable (capability comes from server profile).
- A remixed combo persists across reloads with no paint flash; palette drives tokens, kit drives signature components, independently and correctly.
- You can only pick palettes/kits you've unlocked; a stale/locked persisted value degrades gracefully to a safe default.
- Non-remix users see zero behavior change vs p3-02/p3-03.
- Vitest: gated visibility by `canRemix`; independent palette/kit application; persistence + graceful fallback; pre-paint reads palette only. Typecheck/tests/build green.

## Out of scope
New palettes or kits (those are the existing themes). Backend changes beyond p3-01.
