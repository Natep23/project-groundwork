# p3-02 — Theme gallery + preview & trial of locked themes

**Recommended subagent:** **Sonnet** — standard React UI (modal gallery, transient state, RTL tests); fully specified.
**Depends on:** **p3-03** (per-tile kit override, so tiles show real signature components). Owns `header.tsx` for this phase.

> **Preview must NOT route through `setTheme` (Fable issue #3 — required):** `ThemeProvider`'s effect persists to `localStorage` on every `theme` change, and `useThemeGate` resets any non-unlocked *applied* theme back to default — so `setTheme(lockedTheme)` would both persist a locked theme and trigger a reset loop. Implement trial via a separate transient in-memory `previewTheme`; the applied attribute is `previewTheme ?? theme`; the gate keeps checking only the persisted `theme`. Also mirror the `meta[name="theme-color"]` update (`theme.tsx:53`) to the previewed theme so browser chrome matches. Server leak risk: none — unlocks are only written by `applyEngagement`.

## Goal
Replace the header "Print" `<select>` with a **theme gallery** that lets the user *see* every theme — including locked ones — and take a full-app **trial** of a locked theme, without ever unlocking it. Solves both "preview future rewards" and "let me finally see the Phase 2 styles."

## Scope
- **Gallery panel** opened from the header (reuse `ModalShell`; slide-over or centered — implementer's call). Renders all 7 themes as tiles in a grid.
- **Live mini-preview per tile**: a small mock (a card + button + progress + a couple of tokens' swatches) rendered inside an isolated `data-theme="<id>"` subtree, so each tile shows that theme's *real* look regardless of the active theme. This is safe because themes are pure token scopes.
- **Locked tiles**: show the unlock condition and the user's progress toward it (from `getProfile`), a lock badge, and a **"Preview"** action.
- **Trial mode**: "Preview" applies the locked theme **app-wide, session-only** — never written to `localStorage`, never touches `unlockedThemes`. Show a dismissible banner: "Previewing <Theme> — <unlock condition> · Exit preview". Exiting (or reload) reverts to the real selected theme. (See D3 in p3-00: recommend session-only + explicit exit, no timer.)
- **Unlocked tiles**: click selects + persists (current behavior).
- Keep the header slot compact — a "Themes" button that opens the gallery (the current inline `<select>` is replaced).

## Architecture notes
- Extend `ThemeProvider` (or add a thin `usePreview` layer) with a transient `previewTheme` that overrides the applied `data-theme` without persisting. Selected (persisted) theme and preview theme are distinct pieces of state; exiting preview restores the selected one.
- `data-theme` continues to apply to `<html>` for the active/preview theme; mini-previews scope `data-theme` on their own container.

## Acceptance criteria
- Every theme (locked or not) shows an accurate live mini-preview.
- Trialing a locked theme changes the whole app's look, shows the banner, and **does not** persist or unlock; reload or "Exit preview" reverts.
- Selecting an unlocked theme persists as before; locked themes cannot be *selected* (only previewed).
- Keyboard accessible (focus trap via ModalShell, Escape, arrow/tab through tiles); preview animations respect reduced-motion.
- Vitest: gallery renders all themes with correct locked/unlocked + condition; trial applies without persisting/unlocking; exit reverts. Typecheck/tests/build green.

## Out of scope
The signature components themselves (p3-03/p3-04) — but the mini-preview should look right once those land (it renders real components under the scoped theme).
