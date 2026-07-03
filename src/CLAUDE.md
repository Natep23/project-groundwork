# Frontend (src/, excluding src/convex)

Vite + React 18 + TypeScript, no CSS framework. React Router v6 lives inside Clerk's `Authenticated`/`Unauthenticated` gate in `App.tsx` (see root `CLAUDE.md`).

## Screens vs components

- `screens/` - one per route: `DashboardScreen` (three phase columns + search + dnd + briefing bar), `CreateCardScreen` (form with live preview), `CardScreen` (expandable tasks + research links for one card, edit/delete/phase controls), `StartScreen` (signed-out hero)
- `components/` - shared building blocks:
  - `card.tsx` - `Card` (kanban card: sortable via a dedicated `kcard__grip` handle, accessible title button, phase-arrow + delete actions, task-progress ring) and `CardGhost` (DragOverlay rendering); exports `BoardCard` type and `PHASES`
  - `BoardColumn.tsx` - per-phase `SortableContext` + droppable, with per-phase empty states
  - `TaskList.tsx` - sortable task checklist; rows expand (`TaskDetail`) to edit title/priority inline, show Added/Completed dates, and manage the task's own research links
  - `ResearchList.tsx` - exports `LinkList({cardId, taskId?})` (the shared link list used by both the card panel and each task's detail; obsidian/web icons, `linkTitle`, delete, inline add) and the `ResearchList` panel wrapper; backend rejects non-obsidian/http(s) schemes
  - `Modals.tsx` - `ModalShell` (portal to body, focus trap, Escape/scrim close, `variant: "dialog" | "slideover"`, stops pointer events so card-owned modals don't bubble into drag/navigate), `ConfirmDeleteModal`, `EditCardModal`
  - `BriefingBar.tsx` - dashboard status readout (greeting, streak, level + XP bar, attention counts)
  - `HQConsole.tsx` - slide-over: level/XP, streak, achievements grid, activity heatmap, weekly velocity
  - `EngagementCelebrations.tsx` - renders queued level-up/achievement/unlock celebrations
  - `ColorSwatches.tsx` - flagging-tape preset palette + custom color input
  - `header.tsx` - the title-block header (wordmark, sheet/date cells, gated theme select via `useThemeGate`, HQ cell, UserButton)
  - `BootSequence.tsx` - the cinematic JARVIS-style load screen (skippable, reduced-motion aware); `icons.tsx` - inline SVG icons; `ErrorBoundary.tsx`; `ScrollToTop.tsx`
- `lib/` - `theme.tsx` (ThemeProvider + `THEMES`), `toast.tsx`, `logger.ts`, `engagement.ts` (client mirror of XP curve/achievements/unlock table + pure `diffProfiles`/heatmap/velocity helpers), `useEngagementCelebrations.ts` (celebration queue), `useDailyVisit.ts` (fires `recordDailyVisit` on load + on local-day change), `engagementTheme.tsx` (celebration theming seam), `dayKey.ts` (`localDayKey()`), `boardDnd.ts` (pure drag-drop math), `usePrefersReducedMotion.ts`

## Engagement UI

`getProfile`/`getActivity` are the only reads the engagement UI needs; both reactive. `EngagementRoot` mounts once inside `<Authenticated>` in `App.tsx` (survives navigation) and runs `useDailyVisit()` + `<EngagementCelebrations />`. Celebrations diff the current `getProfile` against the previous snapshot (first non-undefined profile primes the ref and fires nothing); simultaneous level-up/achievement/unlock events queue and play sequentially. All progression math is display-only mirroring — the server is authoritative (see root `CLAUDE.md`).

## Drag-and-drop

dnd-kit throughout, always on. Dashboard: a multi-container sortable — each column is a `SortableContext`, cards are sortable items dragged by the `kcard__grip` handle, Mouse/Touch/Keyboard sensors, `DragOverlay` shows `CardGhost`. A local column snapshot owns reordering during a drag (updated in `onDragOver`, committed in `onDragEnd`) so reactive `getBoard` updates don't fight the gesture. Same-column drops persist via `setCardOrder` (renumber 1..n); cross-phase drops via a single atomic `moveCard`; both have optimistic updates so nothing snaps back. Dragging is disabled while a search filter is active (a filtered subset would scramble hidden cards' order). Task list: `SortableContext` + Keyboard sensor; reorders persist via batched `Tasks.setOrder`. All drag math is factored into pure helpers in `lib/boardDnd.ts`.

## Styling/theming (src/styles/)

Token-based system, class-based selectors (no CSS modules). Three files imported in order from `index.tsx`: `tokens.css` (the theme contract - every theme defines the full token set: bg/grid/surface/ink/line/accent/danger/shadows/radius/border-w), `base.css` (reset, plan-grid body background, type roles `.display`/`.eyebrow`/`.mono`, focus-visible), `components.css` (everything else). Components consume only `var(--token)`, never raw colors; the one exception is `--flag` (per-card color, set inline, falls back to `--accent`).

Seven themes applied via `data-theme` on `<html>` by `ThemeProvider` (persisted to localStorage key `groundwork-theme`, system dark-mode → graphite on first visit, legacy `light`/`dark` migrated). Four are free — `daylight` (default), `blueprint`, `graphite`, `jobsite` — and three are **unlockable rewards**: `arc-reactor` (JARVIS HUD), `command` (military tactical), `phosphor` (CRT terminal). `header.tsx`'s `useThemeGate` gates *selection* to `free ∪ profile.unlockedThemes` (locked options shown disabled with their unlock condition) and falls a locked/stored theme back to the default once auth+profile have loaded — it must wait for `isLoading` to clear or it would wipe an unlocked theme on every reload. `index.html` has a pre-paint script that applies the stored theme WITHOUT re-checking unlock state (it can't know it — avoids a flash); keep it in sync with `lib/theme.tsx`.

Fonts are npm-bundled (`@fontsource`): Big Shoulders Display (display), Archivo (body), IBM Plex Mono (eyebrows/annotations/buttons). Every animation/transition sits behind `prefers-reduced-motion: no-preference`.

## Conventions

- Mutations: `try/await/catch` → success toast where it isn't obvious, `logger.error` + error toast on failure. Surface `ConvexError.data` directly only when the backend message is user-appropriate (e.g. link scheme).
- `window.open` always with `"noopener,noreferrer"`.
- Tests for this layer live in `src/tests/frontend/` (jsdom); shared setup in `src/test/setup.ts` (jest-dom matchers, RTL cleanup, matchMedia stub).
