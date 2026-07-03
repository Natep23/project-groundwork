# 05 — Engagement UI & Analytics

**Owner:** Sonnet 5 · **Depends on:** `02` (`getProfile`, `getActivity`, `recordDailyVisit`)

## Goal
Make the payoff visible and pull the user back daily — using the currently-empty regions of the app.
This is the "utilize blank space" workstream.

## Scope / deliverables
- **Daily briefing bar** across the empty top of the dashboard: time-of-day greeting, **streak flame** (current streak), **level + XP progress bar**, and a "N tasks need attention" / "M projects active" line. JARVIS register, concise copy.
- **`recordDailyVisit`**: call with the client's local `dayKey` on load **and re-fire when the local day changes** (check on `visibilitychange`/`focus`) so a tab left open past midnight still advances the streak. Server idempotency (per `01`) is the real guard; the client ref is cosmetic.
- **HQ console** — a slide-over opened from a new header cell ("HQ"): level + XP-to-next, current/longest streak, **achievements grid** (earned in color, locked as silhouettes with their unlock condition), **activity heatmap** (~12 weeks from `getActivity` day counts), and **weekly velocity** (tasks completed / projects shipped per week).
- **Progress rings** on dashboard cards + card-detail header (done/total tasks), replacing/augmenting the current text ratio.
- **Celebrations**: `useEngagementCelebrations` mounted **once at App level inside `<Authenticated>`** — not in a screen. Most XP originates on `CardScreen`/`CreateCardScreen`, so a screen-local snapshot would unmount and miss the level-up. React to `getProfile` deltas; **queue** simultaneous events (level-up + achievement + unlock from one mutation) and play them sequentially. Expose theming hooks for `06`.
- Empty/first-run states: profile at level 1 with no history reads as an invitation, not a blank.

## Acceptance criteria
- Briefing renders correct streak/level/XP from `getProfile`; XP bar math matches the curve.
- `recordDailyVisit` fires exactly once per load (guard against StrictMode double-invoke).
- Achievements grid shows earned vs locked with conditions; heatmap buckets events by `dayKey`; velocity aggregates by week.
- Celebrations trigger on the right deltas and never on initial load of already-earned state (diff against previous profile, not against zero).
- All motion behind reduced-motion; HQ is keyboard-navigable and focus-trapped like other modals.
- Vitest: briefing states, XP-bar math, achievement grid (earned/locked), celebration-diff logic; typecheck/tests/build green.

## Out of scope
Backend (in `02`). Theme skins / boot sequence visuals (in `06`) — but expose the hooks they need.

## Notes
- Reuse `ModalShell` semantics for the HQ slide-over (focus trap, Escape, scrim) rather than a new pattern.
- Celebration diffing: keep the previous `getProfile` snapshot in a ref; compare level/achievements/unlockedThemes to fire once.
