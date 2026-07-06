# p4-05 — Findings view + Obsidian export + notifications

**Recommended subagent:** **Sonnet** — rendering + URI/download plumbing + notification surface; the tricky bit (URI-length fallback) is already specified.
**Depends on:** p4-01, p4-02, p4-04 · **Blocks:** —

> Frontend + a thin export layer. `window.open` always with `"noopener,noreferrer"` (existing convention). Findings render as markdown, consistent with the app's link/markdown display.
>
> **Visual styling is owned by `p4-07`.** The findings cards, source chips, and cost-estimate readout are kit-aware components in p4-07's contract — build markup against it (read `appliedKit`/`data-kit`); this workstream owns structure + behavior.

## Goal

Let the user read the agents' findings, get them into Obsidian, and be notified when a run finishes (in-app + email surface).

## Scope

### Findings view
- Per-run findings list (`getFindings`): each finding shows `title`, rendered `markdown`, and `sources` (as web links via the existing web-link icon treatment). Group by agent (`role`) so the user sees which agent produced what.

### Obsidian export (D1)
- **Per-finding "Open in Obsidian":** build an `obsidian://new?file=<name>&content=<encoded markdown>` URI and `window.open` it. **Guard the URL-length cap** — if the encoded content exceeds a safe threshold (~a few KB), fall back to copy-to-clipboard + `obsidian://new?file=<name>` (creates the note, user pastes) and toast the reason.
- **Per-finding / per-run "Download .md":** no-length-limit path — download a single `.md`, or a **run-level "Download all"** as a **single concatenated `.md`** (one `#` heading per finding). **Fable-cut:** no zip / no `jszip` dependency for a single-user app. This is the reliable bulk bridge.
- On successful export, optionally **attach a `ResearchLink`** to the card (and/or task) pointing at the note (obsidian link), reusing the existing `addLink` path — closing the loop with the existing research-links feature. Set `exportedAt` so the UI can badge "exported".
- Vault name: let the user set a default vault (persist in settings or the credential row's `defaultModel`-adjacent field) or include `&vault=` when known; otherwise omit and let Obsidian use the active vault.

### Notifications (D5)
- **In-app:** a notifications badge/area driven by `listNotifications` (reactive); a completion inserts a `research_completed` (or `research_failed`) row → toast when the app is open + a persistent unread badge. `markNotificationRead`/`markAllRead` on view.
- **Email:** the send itself is backend (p4-02 `sendCompletionEmail`); this workstream only ensures the in-app surface and any settings copy ("we'll email you at <clerk email> when a run finishes"). Email failure is silent to the user beyond the in-app notification still appearing.
- **v2 seam:** the notification model is channel-agnostic (rows + a send action) so mobile/native push can be added later without reshaping the data — document this, don't build it.

## Acceptance criteria

- Findings render with sources; grouped by agent; reactive as they arrive.
- "Open in Obsidian" works for reasonable sizes and degrades to clipboard + named-note for large findings; "Download .md"/"Download all" always works; export can attach a `ResearchLink`, and `exportedAt` badges the finding.
- In-app notification badge + toast fire on completion/failure; mark-read works; the email path is surfaced in copy (send lives in p4-02).
- `window.open` uses `"noopener,noreferrer"`; markdown rendering is safe (no raw HTML injection); a11y + reduced-motion respected.
- Frontend tests (jsdom/RTL): findings render + source links; obsidian-URI build + large-content fallback; download invoked; notification badge/read flow.

## Out of scope

The Resend send itself and the finalizer (p4-02). Setup/review/progress (p4-04).
