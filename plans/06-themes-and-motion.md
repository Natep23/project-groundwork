# 06 — Themes & Cinematic Motion

**Owner:** Sonnet 5 · **Depends on:** `02` (unlock state via `getProfile`), `05` (celebration hooks)

## Goal
Deliver the "fun themes" and full-cinematic feel — as unlockable rewards — plus a spacing/sizing
uplift on any regions still reading as empty after `04`/`05`.

## Scope / deliverables
- **Three new unlockable themes**, each defining the full token set in `tokens.css` (no partial themes):
  - **`arc-reactor`** (JARVIS HUD): near-black canvas, cyan primary + gold accent, glowing hairline frames, reticle/scanline motifs, faint ambient pulse. Unlock: Level 3 / `first_ship`.
  - **`command`** (military tactical): olive/graphite with amber accent, stencil display face treatment, radar-grid background, blunt edges. Unlock: Level 5.
  - **`phosphor`** (CRT terminal): black + phosphor-green, scanlines, subtle flicker, mono-forward. Unlock: Level 7 / `streak_7`.
- **Theme picker gating** in the header: `free ∪ unlockedThemes` selectable; locked themes rendered with a lock + unlock condition. Gate **selection only** — the pre-paint script in `index.html` applies the stored theme *without* re-checking unlock state (it can't know it, and re-checking would cause a flash). Keep the script in sync with any theme-id changes.
- **Cinematic boot/briefing sequence** as the load screen: a short, **skippable** JARVIS-style boot that resolves into the briefing; also serves the auth-loading state. **Purely cosmetic — no authed reads**: `getProfile` needs auth and the Clerk-key round-trip hasn't resolved yet, so the boot must not gate on profile/unlock/theme state or it will flash/deadlock. Respects reduced-motion (collapses to an instant state).
- **Celebration visuals**: wire `05`'s hooks to themed level-up / achievement / ship effects (HUD flourishes in `arc-reactor`/`command`, restrained elsewhere).
- **Ambient motion** in HUD themes (pulse/scan), all behind reduced-motion.
- **Spacing/sizing uplift**: audit remaining sparse areas and increase density/scale purposefully (not filler).

## Acceptance criteria
- Every new theme defines all tokens; contrast checked for small text on each new surface (≥4.5:1 for body/labels) — no repeat of Phase 1's faint-on-tint issue.
- Locked themes are not selectable; unlocking one (via `getProfile` update) makes it appear without reload.
- Boot sequence is skippable (click/key) and instant under `prefers-reduced-motion`; no layout shift on resolve.
- No token referenced without a definition (grep `var(--x)` vs `tokens.css`).
- Vitest: picker shows locked vs unlocked correctly per profile; boot sequence skip + reduced-motion path.
- Typecheck/tests/build green.

## Out of scope
Backend unlock logic (in `02`). Engagement data/hooks (in `05`).

## Notes
- Lowest priority in the phase — if time is short, ship `arc-reactor` first (it's the headliner and the `first_ship` unlock), then `command`, then `phosphor`.
- Keep decorative layers as pseudo-elements/overlays so they don't affect layout or interaction.
