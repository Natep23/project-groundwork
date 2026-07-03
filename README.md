# GroundWork

A personal board for tracking dev projects from first research to done. Cards move through
`Research` → `In Progress` → `Completed` (drag to reorder within a phase or across phases); each
card carries its own task checklist — tasks are editable, check off with completion dates, and hold
their own research links (Obsidian notes or web pages).

A built-in engagement layer keeps you coming back: XP and clearance levels, daily streaks, a
briefing bar and HQ console (achievements, activity heatmap, weekly velocity), and cinematic
celebrations. Seven themes — four free plus three unlocked as you level up: **Arc Reactor** (JARVIS
HUD), **Command** (military tactical), and **Phosphor** (CRT terminal).

Built with React 18 + TypeScript on Vite, [Convex](https://convex.dev) for the backend/database,
and [Clerk](https://clerk.com) for auth.

## Running it

Two processes side by side:

```sh
npm run dev        # Vite dev server on http://localhost:3000
npx convex dev     # Convex backend in watch mode (required)
```

`VITE_CONVEX_URL` and `CONVEX_DEPLOYMENT` live in `.env.local`. The Clerk publishable key is
served by the backend at boot (`PublicConfig.getClerkPublishableKey`), not stored locally.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `npm start` | dev server |
| `npm test` | Vitest in watch mode |
| `npm run test:run` | run the test suite once |
| `npm run typecheck` | `tsc --noEmit` over the whole project |
| `npm run build` | typecheck + production build to `dist/` |
| `npm run preview` | serve the production build locally |

## Layout

- `src/convex/` — Convex backend (schema, queries/mutations, auth config). Every function except
  the public-config query requires a signed-in user and scopes data by `userId`. The engagement
  engine (XP/levels/streaks/achievements) is server-authoritative — see `CLAUDE.md`.
- `src/screens/`, `src/components/`, `src/lib/` — one screen per route, shared components, and
  hooks/helpers (theme, toasts, engagement, drag-drop math).
- `src/styles/` — token-based design system; seven themes switched via `data-theme` on `<html>`.
- `src/tests/` — Vitest suites: `convex/` (backend, runs in edge-runtime via convex-test) and
  `frontend/` (jsdom + Testing Library).
- `plans/` — the Phase 2 build specs (API contract, per-workstream plans).
