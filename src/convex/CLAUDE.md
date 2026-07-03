# Convex backend (src/convex/)

Deployed to dev deployment `calculating-chameleon-56` (see `CONVEX_DEPLOYMENT` in `.env.local`). Run `npx convex dev` while editing these files so `_generated/` stays in sync.

## Tables (no schema.ts - inferred, not validated)

- `Cards`: `title`, `description`, `color`, `phase` (`"Research" | "In Progress" | "Completed"`)
- `Tasks`: `taskDescription`, `cardId` (-> Cards), `priority`, `order`, `Draggable`
- `ResearchLinks`: `link`, `cardId` (-> Cards)

## Files

- `Cards.tsx` - CRUD plus phase-filtered queries (`getDevCards`/`getResearchCards`/`getCompletedCards` each filter by `phase`) and `changePhase` (used by the dashboard's drag-and-drop)
- `Tasks.tsx`, `ResearchLinks.tsx` - CRUD scoped to a `cardId`
- `PublicConfig.tsx` - `getClerkPublishableKey` query; exposes the `REACT_APP_CLERK_PUBLISHABLE_KEY` backend env var to the frontend at boot. Clerk's key is deliberately kept out of `.env.local` - see root `CLAUDE.md`.
- `auth.config.ts` - Clerk JWT provider config; `domain` reads `CLERK_JWT_ISSUER_DOMAIN` from the backend env rather than being hardcoded

## Backend env vars (`npx convex env list`)

- `CLERK_JWT_ISSUER_DOMAIN` - Clerk instance domain, consumed by `auth.config.ts`
- `REACT_APP_CLERK_PUBLISHABLE_KEY` - consumed by `PublicConfig.getClerkPublishableKey`
- `CLERK_SECRET_KEY` - set but not currently read by any function

Change these with `npx convex env set <NAME> <VALUE>`; there's no separate redeploy step.
