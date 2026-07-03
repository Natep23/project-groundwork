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
- **Data model**: three Convex tables - `Cards`, `Tasks`, `ResearchLinks` - with `Tasks`/`ResearchLinks` referencing their parent card via a `cardId` field. There is no `schema.ts`; Convex infers types permissively, so nothing enforces field shapes beyond each function's own `args` validator.
