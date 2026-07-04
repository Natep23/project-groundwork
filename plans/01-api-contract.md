# 01 — Backend API Contract (shared reference)

The single source of truth every workstream builds against. Authored/locked by the coordinator
before `02` implements it. Extends the Phase 1 backend; unchanged functions are omitted.

## Schema additions (`src/convex/schema.ts`)

```ts
// Tasks — additions (all optional so no migration is needed)
completedAt: v.optional(v.number()),   // set when done flips true, cleared when false
everCompleted: v.optional(v.boolean()) // XP anti-farm guard; true once first completed

// ResearchLinks — addition
taskId: v.optional(v.id("Tasks"))      // link attached to a specific task within its card
// + index: by_task ["taskId"]

// Cards — additions
order: v.optional(v.number()),         // position within phase; assigned = Date.now() on create so it shares a scale with legacy _creationTime, then normalized by setCardOrder
everShipped: v.optional(v.boolean()),  // ship-XP anti-farm guard; true once first moved to Completed
shippedAt: v.optional(v.number())      // first time it reached Completed

// NEW table: UserProfile (one per user)
UserProfile: {
  userId: v.string(),
  xp: v.number(),
  level: v.number(),
  currentStreak: v.number(),
  longestStreak: v.number(),
  lastActiveDay: v.optional(v.string()),        // "YYYY-MM-DD" local dayKey
  unlockedThemes: v.array(v.string()),          // theme ids beyond the free 4
  achievements: v.array(v.string()),            // earned achievement ids
  totalTasksCompleted: v.number(),
  totalProjectsCreated: v.number(),
  totalProjectsShipped: v.number(),
}  // index: by_user ["userId"]

// NEW table: Events (append-only activity log)
Events: {
  userId: v.string(),
  type: v.union(
    v.literal("task_completed"), v.literal("task_added"),
    v.literal("card_created"), v.literal("card_shipped"),
    v.literal("level_up"), v.literal("achievement"), v.literal("daily_visit")
  ),
  ts: v.number(),
  dayKey: v.string(),                            // client local day, for the heatmap
  meta: v.optional(v.object({ label: v.optional(v.string()), cardId: v.optional(v.string()), taskId: v.optional(v.string()) })),
}  // indexes: by_user ["userId"], by_user_day ["userId","dayKey"]
```

## XP curve & levels

Cumulative XP thresholds (index = level−1); beyond the table, each level adds +800:
`[0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200]` → L1..L10.
`level = highest index whose threshold ≤ xp, +1`. Store both `xp` and derived `level`.

XP awards: task completed **+10** (once, guarded by `everCompleted`); project created **+5**;
project shipped (→Completed) **+50** (once, guarded by `everShipped`); first activity of a day **+15**.
Counters (`totalTasksCompleted`, `totalProjectsShipped`) increment on the first-time transition only and never decrement on un-done / un-ship.

## Achievements catalog (ids authoritative; server evaluates)

| id | name | condition | reward |
|----|------|-----------|--------|
| `first_task` | First Blood | first task completed | +20 xp |
| `first_ship` | Shipped It | first project → Completed | +30 xp, unlock `arc-reactor` |
| `streak_3` | On a Roll | 3-day streak | +25 xp |
| `streak_7` | Locked In | 7-day streak | +50 xp, unlock `phosphor` |
| `streak_30` | Momentum | 30-day streak | +150 xp |
| `five_in_day` | Productive | 5 tasks completed in one dayKey | +40 xp |
| `portfolio_5` | Portfolio | 5 projects created | +30 xp |
| `finisher_10` | Finisher | 10 projects shipped | +100 xp |
| `remix_unlocked` | Master Builder | all three unlockable themes present in `unlockedThemes` | +0 xp; gates remix mode |

## Theme unlock table

Free always: `daylight`, `blueprint`, `graphite`, `jobsite`.
Unlockable: `arc-reactor` (Level 3 **or** `first_ship`), `command` (Level 5), `phosphor` (Level 7 **or** `streak_7`).
`unlockedThemes` stores earned ids; server adds them on the triggering mutation. Client picker treats
`free ∪ unlockedThemes` as selectable; others render locked with their condition.

## Functions (new + changed)

**Cards.ts**
- `getBoard` *(changed)* — sort by `(phase, order ?? _creationTime)`; keep `taskCount`/`doneCount`.
- `addCard` *(changed)* — assign `order = Date.now()` (unifies scale with legacy `_creationTime`-based order so new cards append correctly even against unmigrated docs); award create XP + `card_created` event. Takes optional `dayKey`.
- `changePhase` *(changed)* — used by the phase arrows / detail selector. Routes through the shared ship-award path: on the **first** move to `Completed` (guarded by `everShipped`) award ship XP + `card_shipped` event + eval achievements + set `shippedAt`. Assign destination `order = Date.now()` (append). Optional `dayKey`.
- `moveCard` *(new)* — `{ id, toPhase: phaseValidator, order: v.number() }`; **atomic** phase + order patch for the drag case, so a cross-phase drop is a single mutation / single optimistic update (no `changePhase` + `setCardOrder` race). Goes through the same first-ship award path as `changePhase`.
- `setCardOrder` *(new)* — `{ updates: [{id: Id<"Cards">, order: number}] }`; whole batch ownership-checked **before** any write (mirror `Tasks.setOrder`). Used for same-column reorder.
- `removeCard` — unchanged (already cascades tasks + links).

**Tasks.ts**
- `getTasks` — unchanged.
- `addTask` *(changed)* — `task_added` event. Optional `dayKey`.
- `setDone` *(changed)* — on true: set `completedAt = ts`; if `!everCompleted` award task XP, set `everCompleted`, eval achievements (`first_task`, `five_in_day`); emit `task_completed`. On false: clear `completedAt` (no XP change). Optional `dayKey`.
- `updateTask` — unchanged (description + priority); already exists, UI wires it up.
- `setOrder`, `removeTask` *(changed: removeTask also deletes its `by_task` links)*.

**ResearchLinks.ts**
- `getLinks` *(changed)* — returns card-level links (taskId undefined) by default; add `getTaskLinks({ taskId })`.
- `addLink` *(changed)* — accepts optional `taskId`; validates the task exists and belongs to the same card + user; scheme allow-list unchanged.
- `removeLink` — unchanged.

**Profile.ts** *(new — engagement surface)*
- `getProfile` query `{}` → profile doc, or a synthesized default (`level 1, xp 0, streaks 0, unlockedThemes: []`) when none exists. **No writes.**
- `recordDailyVisit` mutation `{ dayKey: string }` → validates `dayKey` against `^\d{4}-\d{2}-\d{2}$` (reject otherwise); ensures the profile doc exists; emits `daily_visit`; awards first-activity-of-day XP **once per day** (idempotent — a second call with the same `dayKey` is a strict noop: no extra XP, no duplicate event, streak unchanged). Streak advancement itself lives in `applyEngagement` so it also fires from actions taken on a new day.
- `getActivity` query `{ sinceDayKey?: string }` → events since `sinceDayKey` (**defaults server-side to today−90 days**), read via the `by_user_day` index range with a `.take()` cap — never an unbounded `.collect()`. Returns recent events for the feed + per-day counts for the heatmap.

**helpers.ts** *(new shared helper)*
- `applyEngagement(ctx, userId, { xpDelta, dayKey, event })` — the one place that **get-or-creates the profile** and mutates XP/level, appends the event, checks level-up (emit `level_up` + unlock themes by level), and evaluates achievements. **Also owns streak advancement:** if `dayKey` is newer than `lastActiveDay` (lexicographic compare on `YYYY-MM-DD`), advance (consecutive = +1, gap = reset to 1) and set `lastActiveDay`; if `dayKey <= lastActiveDay` (same day, or a backwards/DST/skewed clock), it's a same-day noop for the streak. Called by every action mutation and by `recordDailyVisit`. Idempotent per the anti-farm rules.

## Notes for consumers
- Action mutations accept an **optional `dayKey`** (client local "YYYY-MM-DD") used to stamp events for the heatmap and drive streak advancement; when absent, derive from `ts` in UTC (acceptable fallback — the UI always passes it). Prefer making `dayKey` required at the client-facing arg surface.
- `five_in_day` counts `task_completed` events for `(user, dayKey)` **including** the one just inserted (count after insert, or count + 1) — watch the off-by-one.
- `getProfile` + `getActivity` are the only reads the engagement UI needs; both are reactive, so celebrations can trigger off profile deltas client-side.
