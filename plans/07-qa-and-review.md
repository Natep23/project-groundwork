# 07 — QA & Review

**Owner:** Sonnet 5 (audit) + coordinator (judgment & fixes) · **Depends on:** all prior workstreams integrated

## Goal
An independent, fresh-eyes audit of the integrated Phase 2 result before commit — since the Fable
advisor is unavailable, this is the primary external check.

## Scope
Audit the uncommitted working tree (`git diff`) in priority order:
1. **Security** — engagement is truly server-authoritative: no client-writable XP/level/unlock/achievement paths; ownership + index-scoping on `UserProfile`/`Events`/task-links/`setCardOrder`; no cross-user leakage via `getActivity`/`getProfile`.
2. **Correctness** — streak math (same/next/gap day, tz via `dayKey`); XP anti-farm (re-check doesn't re-award); level/achievement idempotency; celebration diffing (no false fire on load); DnD reorder + cross-phase order math and optimistic updates; `recordDailyVisit` single-fire under StrictMode.
3. **Verification claims** — reviewer runs `npx tsc --noEmit`, `npx vitest run`, `npm run build` and reports observed results.
4. **CSS/design** — every `var(--x)` defined per theme; contrast on all new themes; reduced-motion guards on every animation incl. boot sequence and ambient HUD motion; no specificity conflicts.
5. **A11y** — HQ + boot sequence keyboard/focus behavior; task expand `aria-expanded`; card keyboard reorder; achievements not color-only.
6. **Leftovers** — dead files/assets, stale docs, dangling references, `.gitignore` correctness, no build artifacts staged.

## Deliverable
Ranked findings (file:line, severity, one-line defect, concrete failure scenario), each verified against the code, plus observed typecheck/test/build results. **Report only — no fixes, no commit.** The coordinator judges each finding and fixes what's real, then re-verifies.

## Then
Update `CLAUDE.md` (root + `src/`) and `README.md` for the new tables/functions/themes/engagement layer, and commit on `Fable5_2026_Revamp`.
