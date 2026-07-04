# p3-04 — Per-theme signature set-pieces (the surprises)

**Recommended subagent:** **Sonnet** — creative CSS/SVG craft with clear per-theme specs and a priority order; no cross-cutting integration.
**Depends on:** p3-03 (kit registry + `data-kit` hook)

> **Hard a11y/perf acceptance criteria (Fable issue #5 — promoted from notes):**
> - **WCAG 2.3.1:** the CRT power-on flash and glitch/roll must stay **≤3 flashes/sec** with small luminance deltas (the existing 6s flicker is fine; a rapid glitch is where this breaks).
> - **Topo drift:** animate a `transform: translate` on a pre-generated SVG contour tile (never regenerate paths per frame); overlays animate transform/opacity only.
> - **Typewriter headings:** keep the full text in the accessibility tree from the start (animate a visual, `aria-hidden` layer) — no per-character `aria-live`.
> - Loaders announce once via `role="status"`; decorative layers are `aria-hidden` + `pointer-events: none`.
>
> **Cut from scope (D2):** the arc-reactor **hover reticle** (over-built mousemove flourish) and the **Blueprint free-theme surprise** are removed — do not build them.

## Goal
The memorable, theme-native set-pieces — the "cool ideas" — layered on the kit registry. Each is grounded in its theme's world and confined to that kit, so it never touches the free themes.

## Scope (bespoke to the 3 unlockable kits)

- **Arc Reactor (JARVIS HUD):**
  - HUD **corner brackets** framing panels/cards (static CSS, no mouse tracking).
  - HQ level shown as a **circular reactor gauge** (reuses the p3-03 dial), "ARC REACTOR — nn%".
  - Celebration set-piece: **ring-burst** pulse on level-up/unlock.
  - *(Cut per D2: the hover-tracked reticle.)*

- **Command (military tactical):**
  - **Animated topographic contour map** as the HQ console backdrop (and optionally a faint dashboard layer): slowly drifting SVG/CSS contour lines — the headline surprise. Reduced-motion → static contours.
  - Heatmap restyled as a **recon overlay**; velocity as a "sortie" chart accent.
  - Celebration set-piece: **stamped commendation** with a single scan-line wipe.

- **Phosphor (CRT terminal):**
  - HQ console reframed as a **CRT terminal window**: boxed monospace frame, scanline overlay, blinking cursor, a brief power-on flash on open.
  - **Typewriter** reveal on section headings.
  - Celebration set-piece: **CRT glitch/roll**.

- **Celebration wiring:** extend `engagementTheme.tsx` (`className` seam already exists) with these set-pieces; keep copy/icons already defined in Phase 2.

- *(Cut per D2: the optional Blueprint free-theme surprise — out of Phase 3 scope.)*

## Acceptance criteria
- Each set-piece appears only under its theme/kit; free themes are visually unchanged.
- Topo map + reticle + scanlines are decorative layers (pseudo-elements/SVG overlays, `pointer-events: none`), no layout/interaction impact, no CLS.
- All motion behind `prefers-reduced-motion: no-preference` with a sensible static fallback; text/interactive contrast holds; HQ remains fully keyboard-navigable and screen-reader sane (decorative layers `aria-hidden`).
- Vitest where practical (presence of set-piece per theme, reduced-motion fallback, a11y hidden decorations). Typecheck/tests/build green.

## Notes
- Prefer CSS/SVG over JS animation loops; if a JS-driven contour drift is needed, gate it on reduced-motion and clean it up on unmount.
- Priority order if time is short: **Command topo map → Arc reactor dial/brackets → Phosphor CRT HQ → celebration set-pieces**.
