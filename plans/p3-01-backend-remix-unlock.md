# p3-01 — Backend: server-authoritative "remix" unlock

**Recommended subagent:** **Sonnet** — small backend diff, but a real ordering/idempotency subtlety in `applyEngagement` + convex-test coverage (above Haiku, below Opus).
**Depends on:** — · **Blocks:** p3-05

> **Decision (D1):** trigger is the **`remix_unlocked` "Master Builder"** achievement, earned when all three unlockable themes (`arc-reactor`, `command`, `phosphor`) are in `unlockedThemes`. `canRemix` derives from `achievements.includes("remix_unlocked")` — no schema change, server-authoritative. Do **not** add an `unlockedFeatures` field.

> **Ordering trap (Fable issue #2 — required):** in `applyEngagement`, achievement candidates are evaluated *before* `computeLevel` and *before* the level-gated theme unlocks. The third theme can unlock via a level-up **in the same call**, so an "all 3 unlocked" check placed with the other candidates fires one call late. Evaluate `remix_unlocked` **after** the level-gated unlock block, then recompute `computeLevel(xp)` once more (idempotent set-adds, emit `level_up` if crossed) — **or** give it 0 XP to avoid the recompute. Required convex-test: "third theme unlocks via level-up in the same mutation → Master Builder granted in that same call."

## Goal
Add a server-authoritative capability that unlocks "remix mode" (mixing a palette with a different component kit) as a later-tier reward, with a celebration hook — without trusting the client.

## Scope
- Add a **new achievement** to the catalog (server `src/convex/helpers.ts` + client mirror `src/lib/engagement.ts` + `plans/01-api-contract.md`): proposed `remix_unlocked` — "Master Builder", earned when all three unlockable themes are unlocked (or Level 10 — see D1 in p3-00; Fable/user pick). Reward: XP + it is itself the gate for remix mode.
- Expose the capability to the client. Prefer **deriving** `canRemix` from already-server-owned profile fields (e.g. `achievements.includes("remix_unlocked")`) so **no schema change** is needed. If a dedicated flag is cleaner, add `UserProfile.unlockedFeatures?: string[]` (optional → migration-free) written only by `applyEngagement`.
- Evaluate/grant the achievement inside `applyEngagement` (the single write path), idempotently, exactly like existing achievements. Emit the `achievement` event so the existing celebration pipeline fires.

## Acceptance criteria
- The achievement is granted exactly once, server-side, when its condition is first met; never client-writable; re-evaluation is idempotent.
- `canRemix` is derivable from `getProfile` output alone (no extra round-trip).
- convex-test coverage: not granted before condition; granted on the triggering transition; not re-granted; cross-user isolation.
- Client mirror (`engagement.ts`) stays in sync with the server catalog (add the def + a `canRemix(profile)` helper).

## Out of scope
Any UI (that's p3-05). Keep this a minimal, well-tested backend change.
