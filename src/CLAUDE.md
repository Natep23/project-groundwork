# Frontend (src/, excluding src/convex)

CRA + TypeScript, no CSS framework. React Router v6 lives inside Clerk's `Authenticated`/`Unauthenticated` gate in `App.tsx` (see root `CLAUDE.md`).

## Screens vs components

- `screens/` - one per route: `DashboardScreen` (the three phase columns), `CreateCardScreen`, `CardScreen` (tasks + research links for one card), `StartScreen` (signed-out)
- `components/` - shared building blocks:
  - `Dropzone.tsx` - generic drag-and-drop container reused for both the card columns (Dashboard) and the task list (CardScreen); branches on the `isTaskCard` prop to pick renderer/handlers
  - `card.tsx` - exports both `Card` (kanban card) and `TaskCard`
  - `CardOptions.tsx` - View/Delete buttons shown on a card when drag-and-drop is toggled off
  - `Modals.tsx` - `DeleteModal`, `TaskModal`, `ResearchModal` (add-task/add-link forms); plain conditionally-rendered overlays, no portal/modal library
  - `ResearchList.tsx` - renders Obsidian `obsidian://`-style links, parsing the note title out of the `file=` query param

## Drag-and-drop

Native HTML5 DnD (`draggable`, `onDragStart`/`onDrop`/`onDragOver`), not a library. On the dashboard it's gated behind a "Drag and Drop" toggle button (`toggleDAD` state) - when off, cards render `CardOptions` (View/Delete) instead of being draggable.

## Styling/theming (`index.css`)

Single global stylesheet, class-based (no CSS modules; `App.css` is unused CRA boilerplate). Theming is CSS custom properties under `:root`, overridden under `[data-theme="dark"]`. `App.tsx` toggles `data-theme` on the top-level `.app-container` div and persists the choice to `localStorage`.
