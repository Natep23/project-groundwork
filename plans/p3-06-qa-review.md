# p3-06 — QA + Opus review + Fable sign-off

**Recommended subagent:** **Sonnet** — independent QA audit against a written checklist, report-only. (The workflow already mandates a separate Opus review pass + Fable sign-off afterward; paying Opus twice for the same gate is waste.)
**Depends on:** all prior Phase 3 workstreams integrated

## Goal
Gate Phase 3 before commit, per the root `CLAUDE.md` workflow: independent QA audit → **Opus reviews all code** → **Fable final sign-off** → commit.

## Audit checklist (priority order)
1. **Server-authority.** The remix unlock is granted only server-side and derived from server-owned profile state; no client path grants remix, unlocks a theme, or persists an unlock. Preview/trial mode never mutates `unlockedThemes` or writes unlock state.
2. **No free-theme regression.** The 4 free themes render identically to pre-Phase-3 on the default kit (palette + kit both = theme). Selecting/among them behaves as before.
3. **Correctness.** Preview/trial applies session-only and reverts on exit/reload; remix persists palette+kit independently with graceful fallback for stale/locked values; pre-paint reads palette only (no flash); kit override doesn't leak into non-remix users.
4. **Reduced-motion + a11y.** Every new animation (reactor rings, radar sweep, topo drift, CRT flicker, typewriter) sits behind `prefers-reduced-motion: no-preference` with a static fallback; loaders/progress keep correct ARIA roles; gallery + loadout are keyboard-navigable and focus-trapped; decorative layers are `aria-hidden` and `pointer-events: none`.
5. **CSS/contrast.** Signature components meet ≥4.5:1 for text on their theme surfaces; every `var(--x)` used has a definition; no specificity conflicts with the base component styles.
6. **Verification.** Reviewer runs `npx tsc --noEmit`, `npx vitest run`, `npm run build` and reports observed results.
7. **Leftovers/docs.** No dead files; `CLAUDE.md` (root + `src/`), `README.md`, and `plans/README.md` updated for the gallery/kits/remix; plans marked shipped.

## Deliverable
Ranked findings (file:line, severity, one-line defect, concrete failure scenario), report-only. Then: Opus reviews all produced code, applies real fixes, re-verifies; Opus hands to Fable for sign-off; on SIGN OFF, commit on `Fable5_2026_Revamp` and close with the required end-of-task feature chart (tokens/time/model per workstream).
