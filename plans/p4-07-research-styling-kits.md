# p4-07 — Styling: per-theme + kit-aware research UI (remix-native)

**Recommended subagent:** **Sonnet** (implementation pass) — the §Component inventory + §Styling-mechanics *contract* is frozen by Opus during orchestration (architectural, cross-cutting); the per-kit CSS/SVG craft is the p3-04 shape Sonnet handled well.
**Depends on:** p4-03 (frontend conventions) · **p4-08** (the `hacker` kit id must exist in the `ThemeKitId` union) · defines the kit-aware component contract that p4-04/p4-05 build against · **Blocks (styling of):** p4-04, p4-05

> The dedicated visual-design workstream for the agentic-research surface, integrated with the Phase-3 **palette ⊗ kit** system so every theme re-skins it, the unlockable themes get bespoke signature treatments, and all of it is **remix-native**. Read `src/CLAUDE.md` (Styling/theming + Engagement UI) and the p3 plans (`p3-03` kit registry, `p3-04` set-pieces) first — this reuses their machinery, it does not invent a parallel one.

## Core architectural framing (carry from Phase 3 — non-negotiable for remix)

- **Palette** = the token set applied via `data-theme` on `<html>` (bg/surface/ink/line/accent/danger/shadow/radius/border-w). **All 7 themes** differ here automatically.
- **Component kit** = signature components applied via `data-kit`, resolved through `useThemeKit()` / `KitScope`. Default kit for the 4 free themes; bespoke kits for `arc-reactor` / `command` / `phosphor`.
- **Remix** pairs any unlocked palette with any unlocked kit; kit-driven visuals key off `appliedKit` / `[data-kit=…]`, **never** `data-theme`. So research components built as **kit variants** are pulled into remix with zero extra code — identical to `Loader`/`Progress`/the set-pieces.

**Therefore "unique per theme" is delivered two ways:** the palette recolors the research UI for all 7 themes via tokens; the 3 bespoke kits add signature component variants. This is the only design that satisfies the user's remix requirement.

## Decision (user-set) — bespoke research treatment for EVERY theme

**Every theme gets a unique research treatment — free themes included** ("so things stay fresh"). This **reverses the p3 free-theme-parity rule** *for the research surface*: `daylight`/`blueprint`/`graphite`/`jobsite` no longer share the default kit here — each gets its own signature research components, alongside `arc-reactor`/`command`/`phosphor` and the new `hacker` theme (p4-08).

### Architectural mechanics (Fable-reviewed — corrected)

**The kit id already exists per theme.** `THEME_KITS` in `src/lib/themeKit.tsx` maps every theme to a distinct `ThemeKitId` (`ThemeKitId = ThemeId`); the 4 free themes merely share the *label* "Default" and collapse to identical rendering via `isBespokeKit`. `data-kit` / `useThemeKit()` already carry the per-theme id. So no new registry mechanism is needed — scoping **A**:

- **Research components branch on all 8 values of `useThemeKit()` / `[data-kit=…]`** (an 8-way switch), instead of the current `isBespokeKit ? bespoke : default` two-way split — **scoped to the research component set only.** Free themes keep rendering the default kit *everywhere else* (zero Phase-3 regression).
- **Fable-required — never key research kit visuals off `data-theme`.** My earlier "map each theme id → variant" wording was wrong: theme id is the *palette* half, so keying on it would break remix. Key on `useThemeKit()` (the kit half). Palette-level recoloring via `var(--token)` is the only thing that reads `data-theme`.
- **(Rejected: option B** — promoting free themes to full app-wide kits — breaks the Phase-3 "default kit renders byte-identical" guarantee and ripples into every existing kit-aware component for zero benefit outside research.)

### Remix semantics (Fable-resolved)

- **Free-theme research kits need no unlock** — they ride the (free) theme; a non-remix user gets their theme's research variant automatically.
- **A free-theme research kit *can* pair with an unlockable palette (e.g. arc-reactor palette ⊗ blueprint kit), but only via remix, gated exactly as today** (the Master Builder achievement). No new gate, no relaxation; `useThemeGate`'s loadout re-validation needs no change (free kits are always "unlocked").
- **Fable-required regression task:** the Loadout/gallery kit picker currently shows four kits labeled "Default." Once free kits differ on the research surface, **rename the four free-kit labels to per-theme names** (e.g. "Daylight", "Blueprint", "Graphite", "Jobsite") and **audit every `isBespokeKit` consumer** for the assumption "free ⇒ visually default." Add an RTL test: a remix combo (free kit ⊗ unlockable palette) renders the *free kit's* research variant.

### Build priority (8 elaborate treatments — the largest visual surface yet)

**User direction: the free themes get *elaborate* treatments too, not a trimmed baseline** — the free-theme research experience is the app's "broad, widely-available research" mode (unconstrained general web sweeps), and it should feel as crafted as the reward kits. So every one of the 8 is a full treatment.

Priority is a *delivery order*, not a scope cut: **unlockables + `hacker` first** (arc-reactor / command / phosphor / hacker), then the free quartet **`blueprint` / `jobsite` / `graphite` / `daylight`** — each fully realized. `daylight` stays the *cleanest* aesthetically (bright editorial), but "clean" ≠ "cheap": it still gets bespoke components, just a restrained palette. A `satisfies Record<ThemeKitId, …>` on the variant table gives a compile-time completeness check (recommended).

## Component inventory (every one kit-aware, registered via `useThemeKit`/`KitScope`, palette-recolored via tokens)

The research surface's components that must have per-kit treatment (the user's list + the rest of the surface):
- **Modal shell / container** — chrome + **container borders**.
- **Buttons** — primary (Run/Approve), secondary, **danger** (Cancel/Remove).
- **Inputs / selects / textareas** — agent task, model select, domain lists, the context form, the template builder.
- **Toggles / radios** — mode (orchestrated/manual), preset⇄custom, web-search, `domainMode` radios.
- **Agent rows/cards** — in the manual editor and the plan-review list.
- **Progress indicators** — run-level progress, per-agent status chips, and the **live "agents deployed" visualization** (the signature moment of the feature).
- **Findings cards + source chips**, and the **cost-estimate readout**.

## Per-theme signature direction (proposals — one per theme, all kit-aware & remixable)

**Free themes (new bespoke research treatments):**
- **`daylight` (default light):** bright editorial "paper mission-control" — crisp white cards, thin rules, restrained accent; the cleanest of the set.
- **`blueprint`:** drafting-table / technical-drawing — cyan blueprint grid, dashed construction lines, drafting-callout annotations, plan-sheet progress bars.
- **`graphite`:** dark industrial minimal — matte slate panels, hairline borders, monochrome progress with a single accent.
- **`jobsite`:** construction/hazard — flagging-tape accents (reuse the `ColorSwatches` tape vocabulary), caution-stripe progress, stencil labels.

**Unlockable kits (as before):**
- **`arc-reactor` (JARVIS HUD):** glowing bordered panels, **reactor-ring** run/agent progress, holographic input underlines, a HUD "deploy" sweep on approve — reuse the arc-reactor dial/bracket vocabulary from `HQConsole`.
- **`command` (military tactical):** bracketed corners over a faint topo/grid, **segmented-gauge** progress, a radar-sweep "DEPLOYING" state on agent cards — reuse the command radar/topo vocabulary.
- **`phosphor` (CRT terminal):** monospaced terminal-window chrome, `SectionHeading` typewriter headings, blinking-cursor inputs, **ASCII/scanline** progress bars, a boot-style agent activity log — reuse the phosphor CRT vocabulary + `Typewriter`.

**New theme (p4-08):**
- **`hacker` (Matrix breach):** falling-binary backdrop, animated terminal "breach" feel, glitch/typing input states, streaming-log agent progress — distinct from phosphor's retro-CRT (see p4-08 for the theme itself; this is its research-surface variant).

## Remix requirement (explicit)

Every research component variant is selected by `appliedKit` (`data-kit`), so a remix (e.g. Command palette + Arc kit) renders **Arc** research components under **Command** colors — same mechanism as p3-05. Register variants in the `useThemeKit` registry; wrap the research subtree in `KitScope` if a subtree override is ever needed. **No `data-theme`-keyed CSS for kit-level visuals** (palette-level recoloring via `var(--token)` is expected and fine).

## Responsive / mobile (first-class — folds in the earlier ask)

The setup/review modal is dense. Specify responsive behavior: `ModalShell` `slideover` vs `dialog` per breakpoint; agent rows stack on narrow screens; scrollable sections; touch targets ≥44px; heavy kit backdrops (topo, scanlines, HUD glow) reduce/simplify on mobile so they don't overwhelm a small viewport. Mobile is a requirement, not an afterthought.

## Motion / a11y floors (carry Phase 3)

All decorative motion behind `prefers-reduced-motion: no-preference`; progress indicators `role="progressbar"`/`role="status"` with real values in the a11y tree; keyboard-navigable; text contrast ≥4.5:1; kit set-pieces are `aria-hidden` decorative layers over accessible real controls (like `Typewriter`/`BootSequence`).

## Styling mechanics

- New research component classes in `src/styles/components.css` consume **only** `var(--token)`; kit-driven visuals key off `[data-kit=…]` (ambient chrome/overlays), matching the p3 convention.
- New kit component variants added to `src/lib/themeKit.tsx`'s registry; reuse existing kit primitives (reactor / radar / CRT) rather than reinventing.
- If any set-piece mounts before `ThemeProvider`, follow the pre-paint rule (palette only; kit is post-hydration) — not expected here since the modal is deep in the tree.

## Sequencing (updates p4-00)

- **Contract first, frozen:** the **component inventory + "reads `appliedKit`" list + class/registry conventions** (the §Component inventory and §Styling mechanics sections) are authored up front and **frozen before p4-04 builds the modal**, so p4-04/p4-05 build markup against kit-aware hooks and nothing is retrofitted (the p3-03-before-p3-02 lesson).
- **Implementation as a polish pass:** the default-kit baseline must be usable while p4-04/p4-05 build; the **3 bespoke kit treatments + signature animations** land as this workstream's implementation pass, sequenced **after p4-05, before p4-06**.

## Acceptance criteria

- Research UI is fully palette-recolored across all themes via tokens (no hardcoded colors); **every theme** (`daylight`/`blueprint`/`graphite`/`jobsite`/`arc-reactor`/`command`/`phosphor`/`hacker`) renders its own signature research variant of the inventory components.
- **Remix verified:** every unlocked palette ⊗ unlocked research-kit combo renders the *kit's* research components under the *palette's* colors — driven by the applied palette+kit pair, per the confirmed scoping (A or B).
- No Phase-3 regression: adding per-theme research kits does not change how existing (non-research) components render for the free themes (guaranteed under scoping A).
- Responsive: usable and legible on mobile; dense controls reflow; heavy kit backdrops degrade gracefully.
- Motion behind `prefers-reduced-motion`; progress is in the a11y tree; keyboard + contrast floors met.
- Frontend tests (jsdom/RTL): a research component renders the correct variant per `data-kit` incl. a remix combo; reduced-motion path; progressbar/status roles present.

## Out of scope

Functional behavior of the modal/findings (p4-04/p4-05 — this workstream styles what they build). Backend (p4-01/p4-02). The `hacker` theme itself — palette, app-wide kit, and falling-binary backdrop — is **p4-08**; p4-07 only styles the research surface's `hacker` variant.
