# Frontend (src/, excluding src/convex)

Vite + React 18 + TypeScript, no CSS framework. React Router v6 lives inside Clerk's `Authenticated`/`Unauthenticated` gate in `App.tsx` (see root `CLAUDE.md`).

## Screens vs components

- `screens/` - one per route: `DashboardScreen` (three phase columns + search + dnd), `CreateCardScreen` (form with live preview), `CardScreen` (tasks + research links for one card, edit/delete/phase controls), `StartScreen` (signed-out hero)
- `components/` - shared building blocks:
  - `card.tsx` - `Card` (kanban card: draggable wrapper div, accessible title button, phase-arrow + delete actions, task progress) and `CardGhost` (DragOverlay rendering); exports `BoardCard` type and `PHASES`
  - `BoardColumn.tsx` - droppable phase column with per-phase empty states
  - `TaskList.tsx` - sortable task checklist (check off, reorder, inline add form, priority chips)
  - `ResearchList.tsx` - research links panel (obsidian/web icons, title extraction via `linkTitle`, delete, inline add); backend rejects non-obsidian/http(s) schemes
  - `Modals.tsx` - `ModalShell` (portal to body, focus trap, Escape/scrim close, stops pointer events so card-owned modals don't bubble into drag/navigate), `ConfirmDeleteModal`, `EditCardModal`
  - `ColorSwatches.tsx` - flagging-tape preset palette + custom color input
  - `header.tsx` - the title-block header (wordmark, sheet/date cells, theme select, UserButton)
  - `icons.tsx` - inline SVG icon set; `ErrorBoundary.tsx`; `ScrollToTop.tsx`
- `lib/` - `theme.tsx` (ThemeProvider + `THEMES`), `toast.tsx` (ToastProvider/useToast, aria-live), `logger.ts` (leveled, debug/info silenced in prod)

## Drag-and-drop

dnd-kit throughout, always on. Dashboard: `DndContext` with Mouse (6px distance) + Touch (200ms delay) sensors, columns are droppables keyed by phase, `DragOverlay` shows `CardGhost`; `changePhase` has a Convex optimistic update so cards don't snap back. Card action buttons stop mouse/touch/pointer-down propagation so taps don't start drags; per-card arrow buttons are the keyboard path for moving phases. Task list: `SortableContext` + Keyboard sensor (focus grip, Space/Enter to lift, arrows to move); reorders persist via batched `Tasks.setOrder` with an optimistic update.

## Styling/theming (src/styles/)

Token-based system, class-based selectors (no CSS modules). Three files imported in order from `index.tsx`: `tokens.css` (the theme contract - every theme defines the full token set: bg/grid/surface/ink/line/accent/danger/shadows/radius/border-w), `base.css` (reset, plan-grid body background, type roles `.display`/`.eyebrow`/`.mono`, focus-visible), `components.css` (everything else). Components consume only `var(--token)`, never raw colors; the one exception is `--flag` (per-card color, set inline, falls back to `--accent`).

Four themes - `daylight` (default), `blueprint`, `graphite`, `jobsite` - applied via `data-theme` on `<html>` by `ThemeProvider` (persisted to localStorage key `groundwork-theme`, system dark-mode → graphite on first visit, legacy `light`/`dark` values migrated). `index.html` has a pre-paint script mirroring that logic to avoid a theme flash; keep it in sync with `lib/theme.tsx`.

Fonts are npm-bundled (`@fontsource`): Big Shoulders Display (display), Archivo (body), IBM Plex Mono (eyebrows/annotations/buttons). Every animation/transition sits behind `prefers-reduced-motion: no-preference`.

## Conventions

- Mutations: `try/await/catch` → success toast where it isn't obvious, `logger.error` + error toast on failure. Surface `ConvexError.data` directly only when the backend message is user-appropriate (e.g. link scheme).
- `window.open` always with `"noopener,noreferrer"`.
- Tests for this layer live in `src/tests/frontend/` (jsdom); shared setup in `src/test/setup.ts` (jest-dom matchers, RTL cleanup, matchMedia stub).
