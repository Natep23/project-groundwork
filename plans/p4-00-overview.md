# GroundWork — Phase 4 Plan (Agentic Research)

Status: **🟢 PLAN-REVIEWED** — Fable plan-review complete, models assigned, required changes applied (see "Fable review — resolved" below). Awaiting user go-ahead. Build only on the `begin` signal, one workstream at a time.

## Why

An **optional** agentic research feature: from a card's research panel, the user configures one or more Claude agents (and optional subagents) to research the project on their behalf. Agents browse the web (with per-agent domain scoping), and record structured findings that become first-class notes in GroundWork, exportable into Obsidian. The user either defines each agent themselves or lets an **orchestrator** propose the breakdown. Every run passes a mandatory review-and-approve gate (with editable limits) before any money is spent, and the user is notified (in-app toast + email) when a run completes.

This is the first feature in the codebase to introduce Convex **actions**, external API calls (Anthropic), scheduled/durable work, and per-user secrets.

## Decisions (locked with the user)

- **D1 — Findings → Obsidian:** findings are stored in Convex as first-class notes tied to the card, then delivered to the vault via `obsidian://new` URIs and/or `.md` download/zip. No Obsidian plugin, no local-server dependency. (Cloud backend can't write local files; export is the bridge.)
- **D2 — API key → per-user BYO, encrypted at rest.** Each signed-in user stores their own Anthropic key; it's AES-GCM encrypted with a server-only master key, never returned to the client, decrypted only inside the run action. Cost is the key-owner's.
- **D3 — Grounding → web search on, per-agent domain scoping.** Each agent uses Anthropic's server-side `web_search`, and can be **either** restricted to an allow-list **or** given a block-list of domains (Anthropic forbids both on one tool) — e.g. one agent browses broadly (Reddit etc.), another is locked to `.gov`/university sources. Exposed as a per-run + per-agent toggle.
- **D4 — Autonomy → plan-then-approve, always.** Every run — orchestrated or manual — surfaces a review modal (agents, tasks, models, domain scopes, limits, cost estimate) that must be approved before dispatch. The orchestrator is a **planning** step (produces an approvable, static plan), not a live coordinator, in v1.
- **D5 — Completion notification → in-app toast/badge + email (Resend).** Both fire from the run finalizer. Email goes to the user's Clerk email; send failures are logged and never fail the run. Mobile/native push and other channels are a documented v2 seam.

## The core architectural idea

**Agents run server-side, in durable Convex actions — not in the browser, not via Managed Agents.**

- *Not the browser:* Anthropic blocks browser-origin calls, a run would die with the tab, and the key would be exposed. Server-side keeps runs durable and lets Convex's reactive queries drive the live progress UI for free.
- *Not Anthropic Managed Agents:* it hosts execution in Anthropic's container and can't cleanly do per-agent web-search domain lists, per-agent model choice, or the future Ollama path; extracting findings back into Convex is awkward. A **custom orchestration** satisfies all four decisions.

**Durability model.** A run decomposes into per-agent `internalAction`s scheduled via `ctx.scheduler`. Each agent writes only to its own `ResearchAgents` row + its `ResearchFindings`; an idempotent finalizer flips the run to `completed` when all agents are terminal. No single action must finish the whole run, and the run doc isn't a write-contention hot spot.

**Findings via a tool, not structured output.** Each agent is given a `record_finding` client tool `{title, markdown, sources[]}` alongside `web_search`. It calls the tool to emit findings — this composes with the server-side web-search loop and sidesteps the structured-output ⊗ tools constraints. Note templates shape the `markdown` the agent produces.

**Orchestrator = planner.** When the user delegates, the orchestrator model returns a full, flattened plan of agents + subagents (hierarchy recorded via `parentAgentId`) plus a cost estimate. That is what the review modal shows and the user approves. Live sub-spawning mid-run is explicitly v2.

## Workstreams

| # | File | Depends on |
|---|---|---|
| `p4-01` | Backend: schema, per-user encrypted key, ownership helpers, run/agent/finding/template/notification queries+mutations | — |
| `p4-02` | Orchestration + execution: node actions (planner, per-agent runner, finalizer), Anthropic calls, web-search + `record_finding`, Resend email | p4-01 |
| `p4-03` | Settings & templates UI: BYO-key management, note-template preset/custom builder | p4-01 |
| `p4-04` | Run setup modal + mandatory review/approve + live progress | p4-01, p4-03 |
| `p4-05` | Findings view + Obsidian export + notifications (toast/badge/email surface) | p4-01, p4-02, p4-04 |
| `p4-07` | Styling: **bespoke research UI per theme** (free + unlockable + hacker), kit-aware, remix-native | p4-03 (defines the kit contract p4-04/p4-05 build against); p4-08 (`hacker` kit) |
| `p4-08` | New **`hacker` theme** — palette + kit + falling-binary backdrop (app-wide; engagement-unlock ripple) | Phase-2 unlock table + Phase-3 kit system |
| `p4-06` | QA + Opus review + Fable sign-off | all |

Sequencing (Fable-corrected): **`p4-01` → `p4-02` ∥ `p4-03` ∥ `p4-08` → `p4-04` → `p4-05` → `p4-07`(impl) → `p4-06`.** `p4-08` may start as soon as `p4-01` lands (it's app-wide theme work, independent of the research backend) and runs parallel to `p4-02`/`p4-03`/`p4-04` — but its backend slice edits `helpers.ts`, so don't run it concurrently with `p4-01`. `p4-07`'s implementation is **strictly after `p4-08`** (both write `themeKit.tsx` + `components.css`, and p4-07's `hacker` research variant needs the `hacker` kit id to typecheck) and **after `p4-05`** (it styles what p4-04/p4-05 build). **`p4-07`'s component contract is frozen before `p4-04`** — now *more* essential: with all 8 themes getting variants, every research component must be a kit-aware wrapper from the first commit or the retrofit is 8×. File ownership: `tokens.css`/`theme.tsx`/`index.html` → p4-08 only; `themeKit.tsx`+`components.css` → p4-08 then p4-07; `helpers.ts`+`engagement.ts` → p4-01 then p4-08. `p4-01` is the contract everything builds on and must land first. `p4-02` (backend node actions) and `p4-03` (settings/template UI) are independent and parallelizable once `p4-01` exists. `p4-04` needs the settings/template surface; `p4-05` needs execution + the run UI. **`p4-07`'s *component contract* (its inventory + kit-aware hook list + class/registry conventions) is authored up front and frozen before `p4-04` builds the modal** — so the research components are built kit-aware from the start and nothing is retrofitted (the p3-03-before-p3-02 lesson); its bespoke-kit *implementation* lands as the polish pass after p4-05, before QA.

## Process rule — Fable reviews every plan

Per the user: **every plan gets a Fable review before build — including plans added mid-phase** (`p4-07`, `p4-08` were added after the first review and still need their Fable pass). Fable's availability is time-limited right now, so batch and run these reviews promptly. (Recorded in memory as a standing rule.)

## Locked-in conventions (carry from Phases 1–3)

- **Server-authoritative + userId-scoped.** Every new function requires `requireUser` and scopes by `userId`; runs/agents/findings/templates/credentials are ownership-checked (mirror `requireOwnedCard`/`requireOwnedTask`). The key is never returned to the client.
- **All list reads use indexes** (`withIndex`), never `.filter()`; bounded reads (`.take()`), no unbounded `.collect()` on growable tables.
- **Migration-free.** All new tables/fields are additive; the dev DB is not wiped.
- **`ConvexError` with user-appropriate messages** surfaced where safe (mirror the link-scheme pattern); never leak existence of others' data.
- **Feature is optional and non-invasive** — it never blocks or changes the existing Kanban/engagement flows. A user who never opens the research modal sees no behavior change.
- **Completed-card interplay:** research is **allowed on any phase** (it never mutates the card or its tasks — same spirit as the [[completed-lock-links-editable]] rule). Findings/exports are additive.

## Backend env vars (new)

- `RESEARCH_ENCRYPTION_KEY` — base64 256-bit AES-GCM master key for encrypting per-user Anthropic keys. Set via `npx convex env set`.
- `RESEND_API_KEY` — Resend API key for completion emails.
- `RESEARCH_FROM_EMAIL` — verified from-address for Resend.
- `RESEARCH_APP_URL` — app origin for the completion-email card deep link (a scheduled action has no request origin). *(Fable-added.)*

## Cost / model note

Model assignments (Fable's call, filled into each workstream): **p4-01 Sonnet · p4-02 Opus · p4-03 Sonnet · p4-04 Sonnet · p4-05 Sonnet · p4-06 Opus.** Only p4-02 (first Convex actions, Anthropic agent loop, durability/cancellation/budget) and p4-06 (mandatory Opus pre-Fable review) sit at Opus; the rest are Sonnet workhorse work. Nothing warranted Haiku. **`p4-07` and `p4-08` were Fable-reviewed in a second pass** (models: p4-07 **Sonnet** with the contract frozen by Opus; p4-08 **Sonnet**). That pass caught a real defect — p4-07 had specified free-theme variants as a *theme-id* map, which keys on the palette half and breaks remix; corrected to key on `useThemeKit()`/`data-kit` (free themes already carry distinct kit ids). It also locked the hacker theme's decisions: **`REMIX_THEMES`/Master Builder unchanged (hacker is an independent unlock), canvas-based rain**. All findings applied. **Gate (user-set, post-review): hacker unlocks via a new "5 projects completed" achievement** (`finisher_5`, `theme: "hacker"`) — the existing `achievement.theme` mechanism (like `first_ship`→arc-reactor), not a level gate. This one-achievement change matches an established pattern; it rides the final Fable sign-off (p4-06). Per-theme bespoke research kits (parity reversed) make p4-07 the largest visual surface in the app — a build-priority order (unlockables + hacker first, daylight last as a near-default baseline) is baked into p4-07.

## Fable review — resolved

The plan-review pass ran (Fable 5 subagent, since the `advisor` tool was unavailable). Model assignments are filled into each workstream. The nine **required** changes have been applied to the plan files:

1. **Fold finalize into `markAgentDone`** (one transaction) — closes the stranded-run hole where an action dying between a separate `markAgentDone` and `finalizeRunIfComplete` leaves the run `running` forever. *(p4-01, p4-02)*
2. **Watchdog** — schedule `failStaleAgent` alongside each `runAgent`; actions aren't durable (only the scheduler is), so a killed/timed-out agent must be reaped. *(p4-01, p4-02)*
3. **Static budget allocation** — the original stop-dispatch gate can't fire (all agents launch at t=0); instead split `tokenBudget` into per-agent `maxTokens` caps at approve time (+ optional `task_budget` on supporting models). *(p4-01 `maxTokens` field, p4-02)*
4. **`ResearchAgents.status` union** gains `canceled`/`skipped` (their writes would otherwise fail the validator); internal mutations are state-guarded. *(p4-01)*
5. **Per-model request builder gates three things**, not one: web-search tool version, thinking (omit on Fable 5 + Haiku 4.5), and `effort`/`task_budget` (not on Haiku 4.5 — `effort`/adaptive there is a 400). *(p4-02)*
6. **In-loop cancellation check** so a running agent actually stops. *(p4-02)*
7. **Verify `crypto.subtle` in a mutation up front**; if unavailable, `setApiKey` becomes a default-runtime action. *(p4-01)*
8. **`record_finding` is `strict`**; the planner uses `output_config.format` (flat json_schema) rather than a tool. *(p4-02)*
9. **Cost estimate** includes web-search per-search cost and per-model pricing (Fable 5 at $10/$50 shown clearly). *(p4-02, p4-04)*

Optional suggestions also applied: cut the zip for a concatenated `.md`; dedupe `recordFinding`; a "web content is data, not instructions" prompt line; the `RESEARCH_APP_URL` env var; a specific error for Fable-on-ZDR-org 400s.

**User decision — Fable 5 deferred.** Fable 5 is only available for a limited window right now, so it is **out of the v1 model menu** (v1 = Opus 4.8 / Sonnet 5 / Haiku 4.5). Its model-specific handling stays documented in p4-02 ("Deferred models") as a drop-in seam — re-adding it later is a menu change, not a rework.

**Sequencing confirmed** (`p4-01 → p4-02 ∥ p4-03 → p4-04 → p4-05 → p4-06`); run `npx convex codegen` after p4-01 so p4-02/p4-03 build against generated types. `p4-05` touches `ResearchLinks.addLink` only as a caller (no backend edit; `obsidian:` already allow-listed).
