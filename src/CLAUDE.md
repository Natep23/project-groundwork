# Frontend (src/, excluding src/convex)

Vite + React 18 + TypeScript, no CSS framework. React Router v6 lives inside Clerk's `Authenticated`/`Unauthenticated` gate in `App.tsx` (see root `CLAUDE.md`).

## Screens vs components

- `screens/` - one per route: `DashboardScreen` (three phase columns + search + dnd + briefing bar), `CreateCardScreen` (form with live preview), `CardScreen` (expandable tasks + research links for one card, edit/delete/phase controls), `StartScreen` (signed-out hero)
- `components/` - shared building blocks:
  - `card.tsx` - `Card` (kanban card: sortable via a dedicated `kcard__grip` handle, accessible title button, phase-arrow + delete actions, task-progress ring) and `CardGhost` (DragOverlay rendering); exports `BoardCard` type and `PHASES`. A **Completed** card is a locked terminal state: `kcard--completed` (strikethrough title + a lock badge), non-draggable, no phase arrows — delete only.
  - `BoardColumn.tsx` - per-phase `SortableContext` + droppable, with per-phase empty states
  - `TaskList.tsx` - sortable task checklist; rows expand (`TaskDetail`) to edit title/priority inline, show Added/Completed dates, and manage the task's own research links
  - `ResearchList.tsx` - exports `LinkList({cardId, taskId?})` (the shared link list used by both the card panel and each task's detail; obsidian/web icons, `linkTitle`, delete, inline add) and the `ResearchList` panel wrapper; backend rejects non-obsidian/http(s) schemes
  - `Modals.tsx` - `ModalShell` (portal to body, focus trap, Escape/scrim close, `variant: "dialog" | "slideover"`, stops pointer events so card-owned modals don't bubble into drag/navigate), `ConfirmDeleteModal`, `EditCardModal`
  - `BriefingBar.tsx` - dashboard status readout (greeting, streak, level + XP bar, attention counts)
  - `HQConsole.tsx` - slide-over: level/XP (kit-aware `Progress`), streak, achievements grid, activity heatmap, weekly velocity; hosts the per-kit set-pieces (arc-reactor dial/brackets, command topo-map backdrop, phosphor CRT terminal frame + typewriter headings)
  - `EngagementCelebrations.tsx` - renders queued level-up/achievement/unlock celebrations
  - `Loader.tsx` / `Progress.tsx` - kit-aware primitives (`role="status"` / `role="progressbar"`); the **default** kit reuses the pre-Phase-3 markup exactly (free-theme parity), bespoke kits render signature visuals (reactor spinner/dial, radar sweep/segmented gauge, CRT cursor/ASCII bar). See `lib/themeKit.tsx`
  - `Typewriter.tsx` - `SectionHeading`: plain heading everywhere except the phosphor kit (+ motion allowed), where it overlays an `aria-hidden` typewriter layer while keeping the real text in the a11y tree
  - `ThemeGallery.tsx` - `ThemeGallery` (theme picker modal: live per-tile mini-previews via nested `data-theme` + `KitScope`, locked-tile preview/trial, unlocked-tile select; a `Loadout` remix section when `canRemix`) and `PreviewBanner` (session-only trial banner)
  - `ColorSwatches.tsx` - flagging-tape preset palette + custom color input
  - `header.tsx` - the title-block header (wordmark, sheet/date cells, a **Themes** button opening `ThemeGallery`, gated + remix-validated via `useThemeGate`, HQ cell, UserButton)
  - `BootSequence.tsx` - the cinematic JARVIS-style load screen (skippable, reduced-motion aware; kit flavor via CSS on `[data-theme]` since it mounts pre-`ThemeProvider`); `icons.tsx` - inline SVG icons; `ErrorBoundary.tsx`; `ScrollToTop.tsx`
- `lib/` - `theme.tsx` (ThemeProvider + `THEMES`; owns `theme`/`previewTheme`/`remix` and the derived `appliedPalette`/`appliedKit`), `themeKit.tsx` (`useThemeKit()` + `KitScope` component-kit registry — kit follows `appliedKit`, overridable per-subtree), `toast.tsx`, `logger.ts`, `engagement.ts` (client mirror of XP curve/achievements/unlock table + `canRemix` + pure `diffProfiles`/heatmap/velocity helpers), `useEngagementCelebrations.ts` (celebration queue), `useDailyVisit.ts` (fires `recordDailyVisit` on load + on local-day change), `engagementTheme.tsx` (celebration theming seam, keyed on the kit), `cx.ts` (classname join), `dayKey.ts` (`localDayKey()`), `boardDnd.ts` (pure drag-drop math), `usePrefersReducedMotion.ts`

## Engagement UI

`getProfile`/`getActivity` are the only reads the engagement UI needs; both reactive. `EngagementRoot` mounts once inside `<Authenticated>` in `App.tsx` (survives navigation) and runs `useDailyVisit()` + `<EngagementCelebrations />`. Celebrations diff the current `getProfile` against the previous snapshot (first non-undefined profile primes the ref and fires nothing); simultaneous level-up/achievement/unlock events queue and play sequentially. All progression math is display-only mirroring — the server is authoritative (see root `CLAUDE.md`).

## Drag-and-drop

dnd-kit throughout, always on. Dashboard: a multi-container sortable — each column is a `SortableContext`, cards are sortable items dragged by the `kcard__grip` handle, Mouse/Touch/Keyboard sensors, `DragOverlay` shows `CardGhost`. A local column snapshot owns reordering during a drag (updated in `onDragOver`, committed in `onDragEnd`) so reactive `getBoard` updates don't fight the gesture. Same-column drops persist via `setCardOrder` (renumber 1..n); cross-phase drops via a single atomic `moveCard`; both have optimistic updates so nothing snaps back. Dragging is disabled while a search filter is active (a filtered subset would scramble hidden cards' order). **Completing a card is gated + confirmed:** moving into Completed (via the `→` arrow, a drag into the column, or the CardScreen phase select) client-pre-checks that all tasks are done — otherwise an instructive toast, no move — then opens a blocking "Complete & lock" confirm before the mutation. The drag path stashes the move in `pendingComplete` and only runs it on confirm (canceling reverts naturally since no mutation ran); completed cards are themselves non-draggable. Task list: `SortableContext` + Keyboard sensor; reorders persist via batched `Tasks.setOrder`. All drag math is factored into pure helpers in `lib/boardDnd.ts`.

## Styling/theming (src/styles/)

Token-based system, class-based selectors (no CSS modules). Three files imported in order from `index.tsx`: `tokens.css` (the theme contract - every theme defines the full token set: bg/grid/surface/ink/line/accent/danger/shadows/radius/border-w), `base.css` (reset, plan-grid body background, type roles `.display`/`.eyebrow`/`.mono`, focus-visible), `components.css` (everything else). Components consume only `var(--token)`, never raw colors; the one exception is `--flag` (per-card color, set inline, falls back to `--accent`).

A theme has **two halves** (Phase 3): a **palette** (the token set, applied via `data-theme` on `<html>`) and a **component kit** (signature components, applied via `data-kit`). They are 1:1 for every user unless *remix* is engaged. Palette-driven CSS keys off `[data-theme]`; kit-driven CSS (ambient `body::before` overlays, set-pieces) and `useThemeKit()` key off `[data-kit]`. `ThemeProvider` holds three pieces of state and derives what's painted: `appliedPalette = previewTheme ?? remix?.palette ?? theme` (→ `data-theme` + `meta[theme-color]`), `appliedKit = previewTheme ?? remix?.kit ?? theme` (→ `data-kit`).

Seven themes. Four are free — `daylight` (default), `blueprint`, `graphite`, `jobsite` — and three are **unlockable rewards**: `arc-reactor` (JARVIS HUD), `command` (military tactical), `phosphor` (CRT terminal). Each unlockable theme ships a bespoke component kit; the four free themes use the default kit (renders byte-identical to pre-Phase-3).

- **Selection & gating.** The plain selected theme persists to `groundwork-theme` (system dark-mode → graphite on first visit, legacy `light`/`dark` migrated). `header.tsx`'s `useThemeGate` gates *selection* to `free ∪ profile.unlockedThemes` and falls a locked/stored theme back to the default once auth+profile have loaded — it must wait for `isLoading` to clear or it would wipe an unlocked theme on every reload.
- **Gallery & preview (p3-02).** The header **Themes** button opens `ThemeGallery`; locked themes can be *trialed* app-wide via a transient in-memory `previewTheme` (never persisted, never touches `unlockedThemes`, reverts on Exit/reload). Preview must **not** route through `setTheme` (it would persist + trip the gate reset).
- **Remix (p3-05).** Once `canRemix` (server-owned "Master Builder" achievement, p3-01) is earned, the gallery's Loadout pairs any unlocked palette with any unlocked kit. A remix persists to `groundwork-palette`/`groundwork-kit`, written **only** while engaged (Fable issue #6: `groundwork-theme` stays the sole source of truth otherwise). `useThemeGate` re-validates a persisted loadout against the profile: not-earned/locked-palette → drop to plain theme; locked-kit → degrade to the palette's kit.
- **Pre-paint.** `index.html`'s pre-paint script applies only the **palette** (fallback chain `groundwork-palette` → `groundwork-theme` → media query) and does **not** set `data-kit` — the kit is post-hydration so a remix can't cause a paint flash. It can't re-check unlock state (the gate corrects post-load). Keep it in sync with `lib/theme.tsx`.

Fonts are npm-bundled (`@fontsource`): Big Shoulders Display (display), Archivo (body), IBM Plex Mono (eyebrows/annotations/buttons). Every animation/transition sits behind `prefers-reduced-motion: no-preference`.

## Conventions

- Mutations: `try/await/catch` → success toast where it isn't obvious, `logger.error` + error toast on failure. Surface `ConvexError.data` directly only when the backend message is user-appropriate (e.g. link scheme).
- `window.open` always with `"noopener,noreferrer"`.
- Tests for this layer live in `src/tests/frontend/` (jsdom); shared setup in `src/test/setup.ts` (jest-dom matchers, RTL cleanup, matchMedia stub).
