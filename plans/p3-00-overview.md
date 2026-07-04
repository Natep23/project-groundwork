# GroundWork — Phase 3 Plan (Theme Previews, Signature Components & Remix)

Status: **🔵 PLANNED** — awaiting Fable plan-review + model assignment, then user go-ahead. Build only on the `begin` signal, one workstream at a time.

## Why

Three user asks, framed as a game-reward loop:

1. **Preview future rewards.** Locked themes should be viewable *before* unlocking — both as a teaser (like previewing rewards in a good game) and so the Phase 2 styles (arc-reactor / command / phosphor) are actually seeable now.
2. **Signature components per theme.** Go beyond palette: bespoke, theme-native components — a circular reactor loader for the JARVIS theme, an animated topographic map for the military theme, a CRT terminal for phosphor, plus surprises.
3. **Remix (a later unlock tier).** Once earned, let the user mix a theme's *palette* with a different theme's *component kit* (e.g. Command colors + Arc-reactor circular loaders).

## The core architectural idea

Today, a theme id drives everything 1:1: `data-theme="x"` scopes a token set (`tokens.css`), and components are purely token-driven. Phase 3 splits one concept into two:

- **Palette** = the token set (`data-theme`), unchanged.
- **Component kit** = a named set of *signature components* (loader, progress, panel chrome, boot, celebration set-pieces) selected per theme.

A `useThemeKit()` registry maps the active selection → a kit descriptor; components render the matching variant, falling back to a clean default for the 4 free themes (no regression). Because palette and kit are separated, "remix" becomes a natural later-tier unlock: pick them independently.

Previewing locked themes is safe and cheap precisely because a theme is just a `data-theme` scope — an isolated preview subtree, or a session-only app-wide trial, applies the tokens without ever touching the server-authoritative `unlockedThemes`.

## Workstreams

| # | File | Depends on |
|---|---|---|
| `p3-01` | Backend: server-authoritative "remix" unlock (new achievement/level gate) | — |
| `p3-02` | Theme gallery + preview & trial of locked themes | — (independent) |
| `p3-03` | Theme-kit registry + core signature components (loader, progress, boot) | — |
| `p3-04` | Per-theme signature set-pieces (reactor dial, topo map, CRT terminal, celebrations) | p3-03 |
| `p3-05` | Mix mode: palette ⊗ component-kit, gated by p3-01's unlock | p3-01, p3-02, p3-03 |
| `p3-06` | QA + Opus review + Fable sign-off | all |

Sequencing (revised per Fable review — p3-03 **before** p3-02, not parallel): **`p3-01` ∥ `p3-03` → `p3-02` → `p3-04` → `p3-05` → `p3-06`.** Reason: the gallery mini-previews (p3-02) need p3-03's per-tile kit-override hook to show the right signature components, and running p3-02/p3-03 together would collide on `components.css` and header-adjacent files. This ordering gives p3-02 sole ownership of `header.tsx`, and p3-05 (Opus) later owns `header.tsx` + `theme.tsx` + `index.html` alone.

### `data-kit` convention (Fable issue #1 — settle before building)

Two theme-specific behaviors exist today and must be owned by the **kit**, not the palette, or remix combos look broken (e.g. Command palette + Arc kit would show Command's radar-sweep overlay under Arc components): the ambient `body::before` overlays (`components.css`) and celebration visuals (`ThemedEngagementVisuals`). Resolution: `ThemeProvider` sets a second attribute **`data-kit` on `<html>`** (defaults to the theme id). p3-03 re-keys the ambient-overlay CSS from `[data-theme=…]` to `[data-kit=…]` and points `ThemedEngagementVisuals` at the kit; p3-04's set-pieces target `[data-kit=…]`. Palette stays on `data-theme`.

## Locked-in conventions (carry from Phase 1/2)

- **Server-authoritative unlocks.** The remix capability is derived from server-owned profile state; the client never grants it. Preview/trial never mutate unlock state.
- **No regression for free themes.** The default kit reproduces today's rendering exactly; signature variants are additive and opt-in per theme.
- **Reduced-motion + a11y are floor requirements** on every new component (circular loaders, topo map, CRT flicker, typewriter): all decorative motion behind `prefers-reduced-motion: no-preference`, keyboard-navigable, contrast ≥4.5:1 for text.
- **Pre-paint sync.** Only *palette* affects the `index.html` pre-paint script; the component kit is post-hydration, so remixing can't cause a paint flash.
- **Migration-free.** Any new profile field is optional; the dev DB is not wiped this phase.

## Decisions (resolved — Fable review; user to confirm)

- **D1 — Remix unlock trigger → "Master Builder" achievement (all 3 unlockable themes unlocked).** Cleaner celebration moment than a bare level gate; composes with both theme-unlock paths. `canRemix` derives from `achievements.includes("remix_unlocked")` — **no schema change**, genuinely server-authoritative (the `achievements` array is only ever written by `applyEngagement`). No `unlockedFeatures` field for a single flag.
- **D2 — Signature-kit scope → 3 bespoke kits only** (arc-reactor, command, phosphor). Free themes keep the refined default kit. **Cut from scope:** the optional Blueprint surprise, and the arc-reactor hover reticle (per Fable issue #5 — an over-built mousemove flourish for a single-user app).
- **D3 — Trial duration → session-only + explicit "Exit preview", no timer.** In-memory `previewTheme`; reload reverts naturally. A timer adds state/annoyance for zero security value (the tokens ship in `tokens.css` regardless).

## Cost / model note

Per the root `CLAUDE.md` workflow: model assignment is Fable's call (fill the `Recommended subagent:` line in each workstream). Rough shape: one small backend change, a couple of mid frontend workstreams, one heavier set-piece/animation workstream, one integration (remix), one QA.
