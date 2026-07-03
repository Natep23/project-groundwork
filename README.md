# GroundWork

A personal board for tracking dev projects from first research to done. Cards move through
`Research` → `In Progress` → `Completed`; each card carries its own task checklist and research
links (Obsidian notes or web pages).

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
  the public-config query requires a signed-in user and scopes data by `userId`.
- `src/screens/`, `src/components/` — one screen per route plus shared components.
- `src/styles/` — token-based design system; four themes (Daylight, Blueprint, Graphite, Jobsite)
  switched via `data-theme` on `<html>`.
- `src/tests/` — Vitest suites: `convex/` (backend, runs in edge-runtime via convex-test) and
  `frontend/` (jsdom + Testing Library).
