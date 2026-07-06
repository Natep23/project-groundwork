# p4-04 — Run setup modal + mandatory review/approve + live progress

**Recommended subagent:** **Sonnet** — larger than p4-03 but still a well-specified reactive modal flow; no novel architecture.
**Depends on:** p4-01, p4-03 · **Blocks:** p4-05

> The primary user-facing surface. Opens from the card's research panel (`ResearchList` / `CardScreen`). `ModalShell` dialog; reactive off `getRun`/`getFindings`. Mutations follow the toast/`logger.error` convention.
>
> **Visual styling is owned by `p4-07`, not here.** Build the markup against p4-07's *frozen component contract* — its kit-aware component list, `useThemeKit` hooks, and class/registry conventions — so the modal, buttons, inputs, agent rows, and progress indicators are kit-aware (read `appliedKit`/`data-kit`) and remix-native from the first commit. This workstream owns structure + behavior; p4-07 owns the per-theme/per-kit look.

## Goal

The end-to-end configure → plan → **review/approve** → watch flow. The approval gate is mandatory for every run (D4).

## Scope

### Entry & gating
- A "Research with agents" action in the card's research panel (available in any phase). If the card **description is empty**, block with an instructive prompt to add one first (it feeds the system prompt). If **no API key**, route to p4-03's settings surface.

### Setup step
- **Interactive context form** (the user ask): fields augmenting the card description into the system prompt — audience, goals, key questions, constraints. Bounded lengths.
- **Mode toggle:** *Orchestrated* (give an objective + agent/subagent caps; the orchestrator proposes the breakdown) vs *Manual* (define each agent yourself).
- **Manual agent editor:** repeatable agent rows — `role`, `task`, `model` select (**v1 menu: Opus 4.8 / Sonnet 5 / Haiku 4.5**; `ollama` shown disabled "coming soon"; **Fable 5 deferred — limited availability, add later**, see p4-02 "Deferred models"), `maxWebSearches`, and **domain scope**: a radio `domainMode` (No restriction / Restrict to these domains / Exclude these domains) + a domains input (only enabled for allow/block). Enforce allow **xor** block in the UI (matches the backend single-mode).
- **Web-search master toggle** (default on) + **template** picker (preset/custom from p4-03) + **limits** (max agents, max subagents, max web searches/agent, token budget) shown with the ceilings.
- Submit → `createRun`. Orchestrated → run enters `planning` (spinner); Manual → straight to review.

### Review & approve (mandatory)
- When run is `awaiting_approval`, show the plan: each agent's `role`/`task`/`model`/domain scope/`maxWebSearches`/allocated `maxTokens`, plus the **cost estimate** (low–high — must fold in **per-model token pricing** and **web-search per-search cost**) and effective limits.
- Inline-editable before approval (`updateProposedAgent`/`add`/`remove`) — re-checks ceilings. **Approve** → `approveRun` (dispatch). **Cancel** → `cancelRun`.
- Copy makes clear that approving spends money against the user's key.

### Live progress
- While `running`, show per-agent status chips (pending/running/completed/failed) reactively; a run-level progress readout; findings appear as they land (link into p4-05's findings view). Terminal states (`completed`/`failed`/`canceled`) shown clearly with error text when present.
- A run can be left and returned to (durable) — a runs list per card (`listRuns`) lets the user reopen an in-flight or past run.

## Acceptance criteria

- No run ever executes without passing the review/approve modal.
- Description/key gating works; setup validates domain-mode xor and clamps limits to ceilings (client mirrors server).
- Orchestrated planning shows a spinner then the editable plan + cost estimate; manual goes straight to review.
- Progress is reactive and durable across navigation; canceling a running run stops it.
- `ModalShell` conventions (focus trap, Escape/scrim, kit-aware, pointer-event isolation so it doesn't bubble into card drag/navigate); a11y labeled controls; motion behind `prefers-reduced-motion`.
- Frontend tests (jsdom/RTL, Convex mocked): empty-description block; no-key route; manual agent add/edit with domain-mode toggle; approve/cancel transitions; reactive status render.

## Out of scope

Findings rendering + Obsidian export + notification surfacing (p4-05). Backend actions (p4-02).
