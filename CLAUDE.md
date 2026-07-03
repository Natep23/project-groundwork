# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

GroundWork is a personal Kanban-style dev-tracking board: cards move through `Research` -> `In Progress` -> `Completed` phases, and each card holds its own tasks and Obsidian research links. Frontend is React 18 + TypeScript on Vite; backend/database is Convex; auth is Clerk.

## Commands

- `npm run dev` (or `npm start`) - Vite dev server (localhost:3000)
- `npx convex dev` - Convex backend in watch mode; must be running alongside the dev server for the app to work, and regenerates `src/convex/_generated/*` on every function change
- `npx convex codegen` - regenerate `src/convex/_generated/*` once, without the watcher
- `npm run typecheck` - `tsc --noEmit` over the whole project
- `npm test` - Vitest in watch mode; `npm run test:run` for a single pass
- `npm run build` - typecheck + production build to `dist/`
- `npx convex env list` / `npx convex env set <NAME> <VALUE>` - inspect/update backend env vars

## Architecture

- **Routing** (`src/App.tsx`): the route tree is gated by Clerk's `<Authenticated>`/`<Unauthenticated>`/`<AuthLoading>` wrappers, not a router guard. Signed-out users only ever see `StartScreen`; the three routes (`/`, `/create-card`, `/card/:id`) only render once Clerk resolves a session. Providers nest: ThemeProvider > ErrorBoundary > ToastProvider > Router.
- **Auth bootstrapping** (`src/index.tsx`): the Clerk publishable key is *not* a local build-time env var. It's fetched at runtime via a Convex query (`api.PublicConfig.getClerkPublishableKey`) before `ClerkProvider` mounts; a failure renders an error screen with a reload button.
- **Frontend/backend split**: `src/convex/` is Convex backend code (deployed separately). Everything else under `src/` is the React frontend - see `src/CLAUDE.md` for screens/components/styling conventions.
- **Tests** live in `src/tests/` (NOT next to sources): `src/tests/convex/` (convex-test, each file carries a `// @vitest-environment edge-runtime` pragma) and `src/tests/frontend/` (jsdom + Testing Library; setup in `src/test/setup.ts`).

## Convex backend (src/convex/)

> Note: `convex.json` sets `"functions": "src/convex/"`, so the Convex CLI bundles *every* file in this directory. Do not add non-code files (including a nested `CLAUDE.md`) or test files there - tests go in `src/tests/convex/`. Keep backend notes here instead.

Deployed to dev deployment `calculating-chameleon-56` (see `CONVEX_DEPLOYMENT` in `.env.local`). Run `npx convex dev` while editing these files so `_generated/` stays in sync.

### Security model

Every query/mutation except `PublicConfig.getClerkPublishableKey` requires a Clerk identity and scopes data by `userId` (`identity.subject`). Helpers in `helpers.ts` (`requireUser`, `requireOwnedCard`, `requireOwnedTask`, `requireOwnedLink`) throw `ConvexError("Not signed in")` / `ConvexError("Not found")` (the latter deliberately doesn't leak existence). `getCardById` takes a plain string and returns `null` for malformed/missing/foreign ids instead of throwing. All list reads use indexes (`withIndex`), never `.filter()` scans.

### Tables (`schema.ts`)

- `Cards`: `title`, `description`, `color?`, `phase` (union literal, exported as `phaseValidator`/`Phase`), `userId`; indexes `by_user`, `by_user_phase`
- `Tasks`: `taskDescription`, `cardId` (-> Cards), `priority` (1|2|3), `order`, `done`, `userId`; indexes `by_card`, `by_user`
- `ResearchLinks`: `link`, `cardId` (-> Cards), `userId`; indexes `by_card`, `by_user`

### Functions

- `Cards.ts` - `getBoard` (all of the user's cards enriched with `taskCount`/`doneCount`), `getCardById`, `addCard`, `updateCard`, `changePhase`, `removeCard` (cascade-deletes the card's tasks and links). Titles trimmed/length-checked; colors must match `#rrggbb`.
- `Tasks.ts` - `getTasks` (sorted by `order`), `addTask` (server assigns `order` = max+1), `setDone`, `updateTask`, `setOrder` (batch reorder, whole batch ownership-checked before any write), `removeTask`
- `ResearchLinks.ts` - `getLinks`, `addLink` (scheme allow-list: `obsidian:`/`http:`/`https:` only), `removeLink`
- `PublicConfig.ts` - `getClerkPublishableKey`; exposes the `REACT_APP_CLERK_PUBLISHABLE_KEY` backend env var to the frontend at boot (legacy name kept; it's a backend env var, not a frontend one)
- `auth.config.ts` - Clerk JWT provider config; `domain` reads `CLERK_JWT_ISSUER_DOMAIN` from the backend env

### Backend env vars (`npx convex env list`)

- `CLERK_JWT_ISSUER_DOMAIN` - Clerk instance domain, consumed by `auth.config.ts`
- `REACT_APP_CLERK_PUBLISHABLE_KEY` - consumed by `PublicConfig.getClerkPublishableKey`
- `CLERK_SECRET_KEY` - set but not currently read by any function

Change these with `npx convex env set <NAME> <VALUE>`; there's no separate redeploy step.
