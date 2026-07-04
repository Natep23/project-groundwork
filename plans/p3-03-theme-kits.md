# p3-03 — Theme-kit registry + core signature components

**Recommended subagent:** **Sonnet** — wide but mechanical refactor against a hard parity spec ("default kit renders identically"); API shape is dictated, parity tests catch drift.
**Depends on:** — · **Blocks:** p3-04, p3-05, **p3-02** (per-tile kit override) — build this **before** p3-02.

> **`data-kit` ownership (Fable issue #1 — required here):** `ThemeProvider` sets `data-kit` on `<html>` (defaults to theme id). Re-key the ambient `body::before` overlays (`components.css` ~1913–1999) from `[data-theme=…]` to `[data-kit=…]`, and point `ThemedEngagementVisuals` (`engagementTheme.tsx`) at the kit instead of `useTheme().theme`. This is what makes remix combos (p3-05) and set-pieces (p3-04) target the kit cleanly.

> **Per-tile override (for p3-02):** `data-theme` on a preview tile re-scopes *tokens* only; kit components resolve from JS context. Expose a way to override the kit for a subtree (e.g. a `KitScope` provider / prop on `useThemeKit`) so p3-02's mini-preview tiles show the correct signature loader/progress under a scoped theme.

## Goal
Introduce the **component-kit layer** that lets a theme supply *signature components* beyond palette, and ship the three most-used ones (loader, progress, boot) with per-theme variants. This is the foundation the set-pieces (p3-04) and remix (p3-05) build on.

## Scope
- **Kit registry** (`src/lib/themeKit.tsx` or similar): a `ThemeKit` descriptor type + a map `kitId → descriptor` and a `useThemeKit()` hook that returns the active kit. The active kit derives from the active theme today; p3-05 will let it be overridden independently (design the hook so an override slots in cleanly — e.g. read an optional `kit` from context, default to the active theme).
- **Default kit** reproduces today's rendering for the 4 free themes exactly (no visual regression).
- **`<Loader>`** component with kit variants, replacing the ad-hoc loading states (`.app-loading`, panel "Loading…", query spinners):
  - arc-reactor: concentric counter-rotating rings + pulsing core (reactor spinner).
  - command: contained radar-sweep.
  - phosphor: blinking-cursor / typewriter ("LOADING▊").
  - free themes: current simple pulse.
- **`<Progress>`** component with kit variants for card task-progress and the XP bar:
  - arc-reactor: circular reactor dial.
  - command: segmented gauge.
  - phosphor: ASCII bar `[####----]`.
  - free themes: current linear bar/ring.
- **Boot sequence** (`BootSequence.tsx`) made kit-aware: arc-reactor reactor spin-up, command "systems online" readout, phosphor CRT power-on. Must stay purely cosmetic / no authed reads (Phase 2 constraint) and skippable.

## Acceptance criteria
- Free themes render identically to today (screenshot/DOM parity on the default kit).
- Each unlockable theme shows its signature loader + progress; a theme with no variant falls back to default.
- All motion behind `prefers-reduced-motion: no-preference`; loaders expose an accessible label (`role="status"`), progress keeps its `role="progressbar"` + aria values; contrast holds per theme.
- `useThemeKit()` is override-ready for p3-05 (kit decoupled from palette in the API even though 1:1 for now).
- Vitest: kit selection per theme; default-kit parity; a11y roles present; reduced-motion path. Typecheck/tests/build green.

## Out of scope
The big set-pieces (topo map, HUD chrome, CRT terminal HQ) — p3-04. The remix override UI — p3-05.
