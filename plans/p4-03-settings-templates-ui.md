# p4-03 — Settings & templates UI: BYO-key management + note-template builder

**Recommended subagent:** **Sonnet** — conventional forms + list CRUD UI following documented `src/CLAUDE.md` conventions.
**Depends on:** p4-01 · **Blocks:** p4-04

> Frontend, `src/` conventions (see `src/CLAUDE.md`): token-based CSS, kit-aware where relevant, `ModalShell` for dialogs, mutations wrapped in `try/await/catch` → toast on success/failure, `logger.error` on failure.

## Goal

The two configuration surfaces the run modal depends on: (1) per-user Anthropic key management, (2) note-template preset toggle + saveable custom builder.

## Scope

### API-key management
- A **Research settings** surface (new slide-over or a section in an existing settings/HQ area — match `ModalShell` `variant`). Reads `getCredentialStatus`.
- Empty state: input to paste a key + optional default-model select → `setApiKey`; success toast. Never echo the key back — after save, show only `sk-…{last4}` + "Replace" / "Remove" (`clearApiKey`).
- Copy explaining the key is encrypted server-side, used only for the user's own runs, and never shown to others (BYO model). Mask the input; `autoComplete="off"`.

### Note templates
- **Preset templates** are client constants (e.g. "Research summary", "Literature review", "Competitive scan") — markdown with the placeholder set `{{title}} {{objective}} {{findings}} {{sources}} {{date}}`.
- **Toggle** preset ⇄ custom (the user ask). Custom builder: name + markdown textarea with a live placeholder legend and inline validation (only known placeholders allowed — mirror the server allow-list); save via `saveTemplate`, list/edit/delete via `listTemplates`/`removeTemplate`.
- A live preview panel rendering the template with sample values (reuse the app's markdown display approach; findings render as markdown elsewhere too).

## Acceptance criteria

- Key is enterable, replaceable, removable; UI never displays more than `last4`; status is reactive.
- Presets are selectable without a round-trip; custom templates persist, validate placeholders client- and server-side, and can be edited/deleted.
- All mutations follow the toast/`logger.error` convention; modal uses `ModalShell` (focus trap, Escape/scrim close, kit-aware).
- a11y: labeled inputs, masked key field, keyboard-navigable; motion (if any) behind `prefers-reduced-motion`.
- Frontend tests (jsdom/RTL): key set→status shows last4→remove; custom template save with invalid placeholder blocked; preset⇄custom toggle.

## Out of scope

The run setup/review modal (p4-04). Findings/export (p4-05). Any Anthropic call (backend only).
