# p4-06 — QA + Opus review + Fable sign-off

**Recommended subagent:** **Opus** — the workflow mandates the pre-Fable review be Opus; QA execution + edge-case verification ride along (Opus may delegate mechanical test-runs to Haiku/Sonnet).
**Depends on:** all · **Blocks:** —

> The mandatory quality gate before commit, per the root `CLAUDE.md` workflow (Opus pre-review → Fable final review → apply → re-verify → commit).

## Goal

Verify the whole feature end-to-end, close edge cases, and pass the review gates.

## Verification checklist

- `npm run typecheck`, `npm run test:run`, `npm run build` all green. `npx convex codegen` clean; `_generated/` in sync.
- New backend env vars documented and set: `RESEARCH_ENCRYPTION_KEY`, `RESEND_API_KEY`, `RESEARCH_FROM_EMAIL`, `RESEARCH_APP_URL` (`npx convex env list`).
- Manual end-to-end (dev): set key → create orchestrated run on a card with a description → plan appears with cost estimate → edit + approve → agents run with web search + domain scoping → findings recorded → export to Obsidian (URI + download) → completion toast + email. Repeat for a manual run.

## Edge cases to confirm (from p4-00)

- Empty/short description blocks run creation; no-key routes to settings.
- Invalid/expired key → agent fails cleanly, run `failed`, `research_failed` notification, no crash.
- 429/529 → retry/backoff; persistent → that agent fails, siblings continue (partial completion valid).
- `refusal` stop reason surfaced as agent error, not a thrown crash.
- Cost/token budget exhaustion halts further dispatch; skipped agents are recorded (no silent truncation).
- Domain allow/block mutual exclusion enforced (UI + backend); domains sanitized to bare hostnames; correct web-search tool version per model.
- Template placeholder validation (client + server) rejects unknown placeholders.
- `obsidian://` URL-length fallback (clipboard + named note) triggers for large findings; `.md`/zip download unaffected.
- Completion notification: in-app always; email best-effort (missing email / Resend failure logged, run unaffected); deep link built from `RESEARCH_APP_URL`.
- Ownership isolation: user A cannot read/modify user B's runs/agents/findings/templates/credentials; key never returned to any client.
- **Folded finalize** idempotent under simultaneous agent completions (exactly one terminal transition + one notification); no stranded-`running` run after an action dies (**watchdog** `failStaleAgent` catches it).
- **Cancellation** stops in-flight agents (in-loop status check), not just future work.
- **Per-model request gating** correct: adaptive thinking + `effort` on Opus 4.8/Sonnet 5; both omitted on Haiku 4.5 (else 400); thinking omitted on Fable 5; Fable-on-ZDR-org 400 surfaced as a clean agent error.
- Static per-agent `maxTokens` allocation from `tokenBudget` (no runtime dispatch gate); overflow agents `skipped` + recorded.
- `record_finding` is `strict`; `recordFinding` dedupes on `(agentId, title)` and ignores writes for non-`running` agents.
- `Cards.removeCard` cascades runs/agents/findings; `removeRun` cascades children.
- Completed-card interplay: research allowed and functional on a Completed card; it never mutates the card/tasks.
- Feature is fully optional — a user who never opens the modal sees zero behavior change.
- **Styling (p4-07):** research UI is palette-recolored across all 7 themes (no hardcoded colors); the 3 bespoke kits render signature variants; **remix combos** (unlocked palette ⊗ unlocked kit) render the *kit's* research components under the *palette's* colors, driven by `appliedKit` (no `data-theme` kit CSS); free-theme parity holds (unless the alternative decision was taken); mobile/responsive is usable; motion behind `prefers-reduced-motion`; progress in the a11y tree.

## Review gates

1. **Opus pre-Fable review** of all p4 code (mandatory quality gate).
2. **Fable final review** — Opus trusts + applies findings, re-verifies (typecheck + tests + build), then commits. Questions to Fable only under the root `CLAUDE.md` Opus→Fable rule (≤2 per topic, then escalate to the user).

## End-of-task report

Close with the required feature chart: per-workstream table (what changed + why), model used, tokens/tool-uses/duration per subagent, tests added/passing, and a totals row.
