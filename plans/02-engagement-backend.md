# 02 — Engagement Backend

**Owner:** Sonnet 5 · **Depends on:** `01-api-contract.md` · **Blocks:** 03, 04, 05, 06

## Goal
Implement the full server-authoritative engagement engine and the schema/function changes in the
contract. This is logic-heavy but fully specified; correctness is enforced by exhaustive tests.

## Scope / deliverables
- `schema.ts`: add `Tasks.completedAt`, `Tasks.everCompleted`, `ResearchLinks.taskId` (+ `by_task`), `Cards.order`, and the new `UserProfile` and `Events` tables with indexes.
- `helpers.ts`: `applyEngagement(ctx, userId, {xpDelta, dayKey, event})` — the single mutation path that **get-or-creates the profile** and handles XP, level-up, theme unlock, event append, **streak advancement**, and achievement evaluation. Plus pure, exported `computeLevel(xp)` and `dayDiff`/dayKey helpers so streak/level logic is unit-tested without a DB.
- `Cards.ts`: change `getBoard`, `addCard`, `changePhase`; add `setCardOrder`.
- `Tasks.ts`: change `addTask`, `setDone`, `removeTask`.
- `ResearchLinks.ts`: change `addLink`, `getLinks`; add `getTaskLinks`.
- `Profile.ts` (new): `getProfile`, `recordDailyVisit`, `getActivity`.
- Deploy with `npx convex dev --once`; regenerate `_generated`.

## Acceptance criteria (convex-test, `src/tests/convex/`)
- **Auth + ownership + cross-user isolation** on every new/changed function.
- **XP/level:** `computeLevel` matches the threshold table at boundaries (99→L1, 100→L2, 3200→L10, 4000→L11). Completing a task awards +10 once; **un-done → re-done does not re-award** (the key anti-farm test).
- **Streak:** same-day visit = noop; next-day (dayKey+1) = +1; gap (≥2 days) = reset to 1; **backwards dayKey (≤ lastActiveDay) = noop** (DST/travel/skew); `longestStreak` tracks the max; first-visit initializes to 1; streak also advances from an **action** taken on a new day, not only from `recordDailyVisit`.
- **Ship once:** first move to Completed awards +50 and sets `everShipped`; **un-ship → re-ship does not re-award**; `totalProjectsShipped` never decrements.
- **Idempotency:** two `recordDailyVisit` calls with the same `dayKey` → daily XP once, one `daily_visit` event, streak unchanged; a malformed `dayKey` is rejected.
- **five_in_day off-by-one:** completing the 5th task within a `dayKey` fires the achievement exactly once (count includes the just-inserted event).
- **Achievements:** `first_task`, `first_ship`, `streak_3/7`, `five_in_day`, `finisher_10` each fire exactly once and grant their reward (xp and/or theme unlock — assert `arc-reactor` in `unlockedThemes` after `first_ship`).
- **Theme unlocks by level:** reaching L3/L5/L7 adds the right theme ids.
- **Cascade:** `removeTask` deletes its `by_task` links; `removeCard` still deletes all tasks + links.
- **Card order:** `addCard` assigns increasing order within a phase; `setCardOrder` batch is ownership-checked before any write (a foreign id in the batch aborts the whole thing).
- **Profile bootstrap:** `getProfile` returns the synthesized default with no doc and never writes; the first `recordDailyVisit` creates the doc.

## Out of scope
Any UI. Any celebration rendering (client reacts to `getProfile` deltas). Do not touch `src/` outside `src/convex/` and `src/tests/convex/`.

## Notes
- Keep streak/level/dayKey helpers **pure and exported** so tests hit them without a DB.
- `Date.now()` is fine in Convex mutations for `ts`; `dayKey` comes from the client arg (do not derive local day server-side).
- Emit `level_up` inside `applyEngagement` when the computed level increases, and stack theme unlocks in the same write.
