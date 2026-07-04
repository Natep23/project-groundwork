# GroundWork — Phase 2 Plan (Engagement & Depth)

Status: **✅ SHIPPED** — commit `07fd598` on `Fable5_2026_Revamp`. All workstreams (02–07) complete, 122 tests green, Fable-signed-off. See `plans/README.md` for the index.

## Locked decisions (from planning Q&A)

- **Engagement mechanics:** all four — progress analytics + daily briefing/streak + achievements & badges + XP/levels.
- **Themes:** new themes are **unlockable rewards** (gated by level/achievements). The four current themes stay free.
- **Motion:** **full cinematic** — JARVIS-style boot/briefing sequence, celebratory effects, ambient HUD motion. Always reduced-motion-aware and skippable.

## The spine: one server-authoritative progression layer

Everything hangs off a single engagement engine implemented **entirely in Convex mutations** — the client never computes or asserts XP, level, streak, unlocks, or achievements. See `01-api-contract.md` for exact rules. Summary:

- XP for actions (complete task, ship/create project, first activity of the day) → levels on a defined curve.
- Streak = consecutive local-calendar days with activity (client supplies its local `dayKey`; server does the math).
- Achievements unlock on milestones; some grant XP or theme unlocks.
- Levels + achievements unlock themes; the picker gates locked themes.
- Anti-farming: task-completion XP granted once per task (guarded), so re-checking can't grind.

## Build order & files (each is a discrete unit)

| # | Workstream | Owner model | Depends on |
|---|------------|-------------|------------|
| `01-api-contract.md` | Shared backend contract (reference, not a build step) | — (authored by me) | — |
| `02-engagement-backend.md` | Schema + engagement engine + convex-tests | Sonnet 5 | 01 |
| `03-dashboard-dnd-refactor.md` | Multi-container sortable (reorder + cross-phase) | **Opus 4.8** (major refactor) | 02 (Cards.order, setCardOrder) |
| `04-task-depth-ui.md` | Editable/expandable tasks, dates, per-task links | Sonnet 5 | 02 |
| `05-engagement-ui-analytics.md` | Briefing bar, HQ console, heatmap, rings, celebrations | Sonnet 5 | 02, **03** (shares board/header files) |
| `06-themes-and-motion.md` | 3 unlockable themes, boot sequence, spacing uplift | Sonnet 5 | 02 (unlock state), 05 (celebration hooks) |
| `07-qa-and-review.md` | Independent audit → I judge & fix | Sonnet 5 + me | all |

## Sequencing

1. **Contract first.** I finalize `01` so every UI workstream builds against known signatures in parallel (the approach that worked in Phase 1).
2. **`02` backend lands** (schema + engine + tests green + deployed via `npx convex dev --once`).
3. **`03` (Opus, dashboard drag) and `04` (task depth) build in parallel** — genuinely disjoint. `05` does **not** run alongside `03`: it edits the same high-churn files (`card.tsx`, `DashboardScreen.tsx`, `header.tsx`), so it lands **after** `03` merges.
4. **`05` engagement UI** builds on the merged board + task work.
5. **`06` themes/motion** layers on once unlock state (`02`) and celebration hooks (`05`) exist.
6. **`07` QA** audits the integrated result; I fix what's real.
7. Docs update (`CLAUDE.md` ×2, README) + commit on `Fable5_2026_Revamp`.

Do **not** collapse these into one pass. Each workstream should reach green (typecheck + tests + build) before the next merges.

## Global conventions (apply to every workstream)

- **Server-authoritative** engagement: no client-trusted XP/level/unlock/achievement writes.
- **No migration needed:** the dev DB was wiped in Phase 1, and any new field on an existing table is added **optional with a sensible fallback** (e.g. `Cards.order` falls back to `_creationTime`) so nothing breaks if a card already exists.
- **Ownership** on every new function via `helpers.ts` (`requireUser` + `requireOwned*`); index-scoped reads only, no `.filter()` scans.
- **Tests:** every new/changed backend function gets a convex-test case (auth, ownership, cross-user isolation, plus the logic-specific cases called out per workstream). New UI gets a focused Vitest suite.
- **Reduced-motion:** every animation behind `@media (prefers-reduced-motion: no-preference)`; cinematic sequences skippable and keyboard-safe.
- **Convex bundler rule:** no non-code or test files inside `src/convex/`. Backend tests go in `src/tests/convex/`.

## Integration gates

`npx tsc --noEmit` clean · `npx vitest run` green · `npm run build` succeeds — checked after `02`, after each of `03/04/05/06` merges, and finally before commit.

## Top risks (watch these)

1. **Streak/timezone correctness** — client supplies local `dayKey`; consecutive-day math must handle same-day, next-day, and gap. Heavy test coverage required.
2. **XP farming** — un-done → re-done tasks *and* un-ship → re-ship projects must not re-award. Guard both (`everCompleted`, `everShipped`) in `02`, test explicitly.
3. **Profile creation in a query** — Convex queries can't write; `getProfile` returns a synthesized default and the first mutation creates the doc.
4. **DnD refactor scope** — cross-phase + reorder in one sortable is the trickiest change; isolated to `03` on Opus.
5. **HUD-theme motion perf** — keep to GPU-friendly transforms/opacity; verify under reduced-motion.
6. **Overall size** — sequenced by stated priority (task depth, reorder, space, engagement core before extra themes); if anything slips it's `06`'s `command`/`phosphor` themes (ship `arc-reactor` first), then the trim candidates flagged by review: the unused `task_added` event, the weekly-velocity panel, and ambient HUD motion.
