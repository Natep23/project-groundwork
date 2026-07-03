# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

GroundWork is a personal Kanban-style dev-tracking board: cards move through `Research` -> `In Progress` -> `Completed` phases, and each card holds its own tasks and Obsidian research links. Frontend is Create React App (TypeScript); backend/database is Convex; auth is Clerk.

## Commands

- `npm start` - frontend dev server (localhost:3000)
- `npx convex dev` - Convex backend in watch mode; must be running alongside `npm start` for the app to work, and regenerates `src/convex/_generated/*` on every function change
- `npx convex codegen` - regenerate `src/convex/_generated/*` once, without the watcher (needed after adding/renaming a convex function if `convex dev` isn't already running)
- `npx tsc --noEmit -p tsconfig.json` - type-check the whole project
- `npm test` - CRA/Jest test runner (watch mode)
- `npm run build` - production build
- `npx convex env list` / `npx convex env set <NAME> <VALUE>` - inspect/update backend env vars (see `src/convex/CLAUDE.md`)

## Architecture

- **Routing** (`src/App.tsx`): the whole route tree is gated by Clerk's `<Authenticated>`/`<Unauthenticated>` wrappers, not a router guard. Signed-out users only ever see `StartScreen`; the three routes (`/`, `/create-card`, `/card/:id`) only render once Clerk resolves a session.
- **Auth bootstrapping** (`src/index.tsx`): the Clerk publishable key is *not* a local build-time env var. It's fetched at runtime via a Convex query (`api.PublicConfig.getClerkPublishableKey`) before `ClerkProvider` mounts, so the app shows an `.app-loading` placeholder until that round-trip resolves. Details: `src/convex/CLAUDE.md`.
- **Frontend/backend split**: `src/convex/` is Convex backend code (queries/mutations, deployed separately). Everything else under `src/` is the React frontend - see `src/CLAUDE.md` for screens/components/styling conventions.

## Convex backend (src/convex/)

> Note: `convex.json` sets `"functions": "src/convex/"`, so the Convex CLI bundles *every* file in this directory with esbuild to deploy it. Its bundler only special-cases `README.md`, `schema.ts`/`.js`, dotfiles, and a couple other patterns - any other non-code file (including a nested `CLAUDE.md`) breaks the deploy with a "No loader configured" error. Do not add a `CLAUDE.md` inside `src/convex/`; keep backend notes here instead.

Deployed to dev deployment `calculating-chameleon-56` (see `CONVEX_DEPLOYMENT` in `.env.local`). Run `npx convex dev` while editing these files so `_generated/` stays in sync.

### Tables (`schema.ts`)
- `Cards`: `title`, `description`, `color`, `phase` (`"Research" | "In Progress" | "Completed"`)
- `Tasks`: `taskDescription`, `cardId` (-> Cards), `priority`, `order`, `Draggable`
- `ResearchLinks`: `link`, `cardId` (-> Cards)

### Files
- `Cards.tsx` - CRUD plus phase-filtered queries (`getDevCards`/`getResearchCards`/`getCompletedCards` each filter by `phase`) and `changePhase` (used by the dashboard's drag-and-drop)
- `Tasks.tsx`, `ResearchLinks.tsx` - CRUD scoped to a `cardId`
- `PublicConfig.tsx` - `getClerkPublishableKey` query; exposes the `REACT_APP_CLERK_PUBLISHABLE_KEY` backend env var to the frontend at boot. Clerk's key is deliberately kept out of `.env.local` - see the auth bootstrapping note above.
- `auth.config.ts` - Clerk JWT provider config; `domain` reads `CLERK_JWT_ISSUER_DOMAIN` from the backend env rather than being hardcoded

### Backend env vars (`npx convex env list`)
- `CLERK_JWT_ISSUER_DOMAIN` - Clerk instance domain, consumed by `auth.config.ts`
- `REACT_APP_CLERK_PUBLISHABLE_KEY` - consumed by `PublicConfig.getClerkPublishableKey`
- `CLERK_SECRET_KEY` - set but not currently read by any function

Change these with `npx convex env set <NAME> <VALUE>`; there's no separate redeploy step.
