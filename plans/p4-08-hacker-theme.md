# p4-08 — New "hacker" theme (palette + kit + falling-binary backdrop)

**Recommended subagent:** **Sonnet** — palette + kit + one canvas component on established p3-03/p3-04 rails; the backend touch is a one-line unlock-table edit + convex-tests mirroring p3-01 (also Sonnet).
**Depends on:** p4-01 (before its `helpers.ts` edit) · Phase-2 unlock table + Phase-3 kit system · **Blocks:** p4-07's `hacker` research variant
**Scope note (Fable-resolved):** stays **in Phase 4** — it's a cleanly separated plan with no coupling to the research backend; a separate phase would add process cost for nothing. It is scheduling-independent and may start as soon as p4-01 has landed.

> A new theme in the mold of the 3 unlockable signature themes: its own **palette** (`data-theme`) + **component kit** (`data-kit`) + a signature **ambient backdrop** (falling binary / Matrix "digital rain"), animated terminal feel. Distinct from `phosphor` (retro amber/green CRT with scanlines) — `hacker` is a darker "breach" aesthetic with streaming code rain. Read `src/CLAUDE.md` (Styling/theming) + `plans/01-api-contract.md` (theme-unlock table + achievements) + `p3-04` (set-piece patterns) first.

## Goal

Add `hacker` as a fully-supported theme: palette tokens, a bespoke component kit, and the falling-binary backdrop, wired through the existing palette/kit/remix machinery and (if unlockable) the server-authoritative unlock table — with no regression to the existing 7 themes.

## Scope

### Palette (`src/styles/tokens.css`)
- A new `[data-theme="hacker"]` token block: near-black bg, terminal-green (or green→cyan) ink/accent, subtle grid, danger red; full token set (bg/grid/surface/ink/line/accent/danger/shadows/radius/border-w) — every theme must define the complete contract.
- Register in `THEMES` (`src/lib/theme.tsx`) and the `index.html` pre-paint palette list. Pre-paint applies **palette only** (kit is post-hydration) — keep in sync with `lib/theme.tsx`.

### Component kit (`src/lib/themeKit.tsx`)
- A new `hacker` kit descriptor: terminal-styled Loader (streaming cursor / code spinner), Progress (streaming hex/binary bar), panel chrome (terminal window with a title bar), boot flavor, celebration set-piece. Reuse the kit-primitive pattern; distinguish from `phosphor` (no scanline/CRT curvature — instead glitch + rain).

### Signature backdrop — falling binary (the headline visual) — Fable directive: **canvas**
- A single **`<canvas>`**, `position: fixed; inset: 0`, behind content, `aria-hidden="true"`, `pointer-events: none`; mounted by a React component rendered **only when `useThemeKit() === "hacker"` and `!prefersReducedMotion`**. Kit-keyed, so it follows the *kit* half of a remix (Command palette ⊗ hacker kit → rain shows; correct/intended).
- **Recolor from the palette at mount** — read `--accent`/`--ink` off computed styles (don't hardcode green), so a remix recolors the rain.
- One **rAF loop, time-stepped to ~20–24 fps** (advance on elapsed time, don't draw every frame): translucent bg `fillRect` each step + one `fillText` pass (classic trail); per-column head index only, no per-glyph state.
- Column step ~14–16px; **column count = viewport width / step, hard-capped (~120 desktop / ~50 mobile)**; `devicePixelRatio` capped at **1.5** for the backing store.
- **`visibilitychange`** → cancel rAF when hidden, resume on visible; cancel + remove listeners on unmount and on kit change. **No "pause when modal open"** (cut — marginal gain, extra plumbing; the trail sits behind a scrim anyway).
- **Reduced motion → no canvas / no JS loop at all:** a static faint-glyph field via CSS (`[data-kit="hacker"] body::before` with a small repeating data-URI).
- **DOM/CSS-animated text nodes are rejected** — hundreds of animated nodes are continuous layout/paint; canvas is one composited surface.
- **`ThemeGallery` mini-preview tiles must not mount the live canvas** — gate the component so it renders the static field (or nothing) inside a preview tile; only the app-root instance runs the loop.

### Unlock gating (user-set — achievement gate)
- **`hacker` unlocks via a new "5 projects completed" achievement.** This uses the app's existing **`achievement.theme` unlock mechanism** — identical to `first_ship`→`arc-reactor` and `streak_7`→`phosphor` — not a level gate.
- **New achievement** (proposed `finisher_5`, name/XP tunable — e.g. "Serial Shipper", ~+60 xp, `theme: "hacker"`): granted the first time `totalProjectsShipped === 5` (a project "completed" = reached the Completed phase = shipped; guarded by `everShipped`, same as the other ship achievements). Evaluate it as a `card_shipped` candidate in `applyEngagement` alongside `first_ship` (=== 1) and `finisher_10` (=== 10).
- **Touches:** `ACHIEVEMENTS` catalog + the `card_shipped && totalProjectsShipped === 5` candidate in `src/convex/helpers.ts`; the theme-unlock table + achievements catalog in `plans/01-api-contract.md`; the client mirror `src/lib/engagement.ts`. No level-gate change.
- **`REMIX_THEMES` does NOT change — Master Builder stays "all 3" (`arc-reactor`/`command`/`phosphor`).** Raising it to "all four" would retroactively split semantics (grants never revoke). `hacker` is an **independent unlock** that, once in `unlockedThemes`, participates in remix like any other unlocked theme (remix pairs *any unlocked* palette ⊗ kit; `canRemix` untouched). Update the `REMIX_THEMES` doc comment ("the three unlockable themes" is no longer exhaustive of unlockables).
- **Required convex-tests:** (1) 5th ship → `finisher_5` granted + `hacker` in `unlockedThemes`; (2) unlocking `hacker` does **not** grant/affect `remix_unlocked`; (3) the existing "all 3 → Master Builder" tests still pass unchanged with a 4th unlockable present; (4) `finisher_5` not granted before the 5th ship; idempotent re-grant (guarded by `everShipped`, not re-fired on un-ship/re-ship).

### Remix (Fable-resolved)
- The kit is a first-class `data-kit`, so `hacker` palette ⊗ any kit and any palette ⊗ `hacker` kit work through the existing remix machinery once unlocked.
- The falling-binary backdrop is `[data-kit="hacker"]`-keyed, so it **follows the kit half** — a Command-palette ⊗ hacker-kit remix shows the rain, and the rain **recolors from the palette tokens** (`--accent`/`--ink` read at mount), so it isn't hardcoded green under a remix. That is the intended behavior.

## Sync-point checklist (Fable-required — adding a theme touches ~7 places; a miss is a runtime gap)

1. `src/styles/tokens.css` — `[data-theme="hacker"]` full token block.
2. `src/lib/theme.tsx` — `THEMES` + `THEME_BG` entries (a missing `THEME_BG` key fails typecheck under `Record<ThemeId,…>` — the one that self-catches).
3. `index.html` — pre-paint palette list (palette only; no `data-kit`).
4. `src/lib/themeKit.tsx` — `THEME_KITS`, `isBespokeKit`/`BespokeKitId` union, the `hacker` kit descriptor.
5. `src/convex/helpers.ts` — new `finisher_5` (`theme: "hacker"`) in `ACHIEVEMENTS` + its `card_shipped && ===5` candidate in `applyEngagement`; `REMIX_THEMES` doc comment.
6. `src/lib/engagement.ts` — client mirror of the achievement + unlock table.
7. `plans/01-api-contract.md` — achievements-catalog row + theme-unlock-table entry for `hacker`.

## Acceptance criteria

- `hacker` selectable and fully themed app-wide (board, cards, HQ, modals) with the complete token set; **no regression to the other 7 themes** (verify the sync-point list above).
- Falling-binary backdrop animates smoothly (verify frame budget + tab-hidden pause), degrades to a static field under `prefers-reduced-motion`, and scales density on mobile.
- Server-authoritative unlock via the `finisher_5` achievement (never client-granted), correct entry in the achievements + theme-unlock tables and the client mirror, Master-Builder/remix semantics (unchanged) covered by convex-test.
- Remix combos involving `hacker` (both directions) render correctly.
- a11y: text contrast ≥4.5:1 against the dark bg; backdrop is `aria-hidden` decoration behind accessible content.

## Out of scope

The research-surface `hacker` variant (that's p4-07). Any agentic-research backend/behavior.
