# p4-01 — Backend: schema, encrypted key, ownership, run/agent/finding/template/notification API

**Recommended subagent:** **Sonnet** — large but extremely well-specified backend contract mirroring existing patterns (`requireOwned*`, index discipline, convex-test); the crypto file is small with a pinned algorithm.
**Depends on:** — · **Blocks:** p4-02, p4-03, p4-04, p4-05

> This is the contract every other workstream builds against. Author/lock it first. All functions require `requireUser` and scope by `userId`; the encrypted key is **never** returned to the client.

## Goal

Add the data model, per-user encrypted-key storage, ownership helpers, and the full query/mutation surface for research runs, agents, findings, note templates, credentials, and notifications — everything except the node actions that call Anthropic (that's p4-02) and the UI (p4-03/04/05).

## Schema additions (`src/convex/schema.ts`)

All additive/optional; migration-free. Proposed tables:

- **`ResearchCredentials`** (one per user): `userId`, `ciphertext` (string, base64 AES-GCM), `iv` (string, base64), `last4` (string), `defaultModel?` (string), `updatedAt`. Index `by_user`.
- **`NoteTemplates`** (per user): `userId`, `name`, `body` (markdown with placeholders), `updatedAt`. Index `by_user`. (Presets are code constants, not rows.)
- **`ResearchRuns`**: `userId`, `cardId` (→ Cards), `status` (union: `draft` | `planning` | `awaiting_approval` | `running` | `completed` | `failed` | `canceled`), `mode` (union `orchestrated` | `manual`), `objective` (string), `formContext?` (object: audience/goals/questions/constraints — bounded), `templateId?` (→ NoteTemplates) or `templateBody?` (inline snapshot), `webSearch` (boolean), `limits` (object: `maxAgents`, `maxSubagents`, `maxWebSearchesPerAgent`, `tokenBudget`), `costEstimate?` (object: `low`/`high`/`currency`), `notifyEmail?` (string, snapshotted from Clerk identity at creation for the auth-less finalizer), `error?` (string), `startedAt?`, `completedAt?`. Indexes `by_user`, `by_card`, `by_user_status`.
- **`ResearchAgents`** (child of a run): `userId`, `runId` (→ ResearchRuns), `cardId`, `parentAgentId?` (→ ResearchAgents, hierarchy for subagents), `role` (string), `task` (string), `provider` (union `anthropic` | `ollama`), `model` (string), `domainMode` (union `none` | `allow` | `block`), `domains` (array of strings — bare hostnames), `maxWebSearches` (number), `maxTokens?` (number — this agent's slice of the run `tokenBudget`, the hard `max_tokens` cap set at approve time; see p4-02 budget note), `status` (union `proposed` | `pending` | `running` | `completed` | `failed` | `canceled` | `skipped` — **Fable-required:** `canceled`/`skipped` were missing and their writes would fail the validator), `order` (number), `tokensUsed?` (number), `error?` (string), `startedAt?`, `completedAt?`. Indexes `by_run`, `by_user`.
- **`ResearchFindings`** (child): `userId`, `runId`, `agentId` (→ ResearchAgents), `cardId`, `title` (string), `contentMarkdown` (string, <1MB), `sources` (array of `{ url, title? }`, bounded), `exportedAt?` (number). Indexes `by_run`, `by_agent`, `by_card`.
- **`Notifications`**: `userId`, `type` (union `research_completed` | `research_failed`), `runId?`, `read` (boolean), `message` (string), `ts` (number). Indexes `by_user`, `by_user_read`.

## Crypto (`src/convex/crypto.ts` — no `"use node"`, uses Web Crypto)

Pure helpers usable from both runtimes:
- `encryptSecret(plaintext): Promise<{ciphertext, iv, last4}>` — AES-GCM with the key from `RESEARCH_ENCRYPTION_KEY` (base64 → `CryptoKey` via `crypto.subtle.importKey`); random 12-byte IV.
- `decryptSecret({ciphertext, iv}): Promise<string>` — inverse; called only from the p4-02 runner action.
- Validate the master key exists at import/use; `ConvexError` if unset (clear operator message).

> **Fable-required — verify runtime first:** `crypto.subtle` / `getRandomValues` availability inside a **mutation** (a deterministic transaction) is not confirmed by the Convex guidelines. As the first implementation step, verify encryption works in a default-runtime mutation. If it does, `setApiKey` can be the mutation below. If it does **not**, make `setApiKey` a default-runtime **`action`** (no `"use node"` — `fetch`/crypto live there per guidelines) that validates + encrypts, then calls an internal upsert mutation. Decryption already happens in the p4-02 node action, so that side is unaffected.

## Ownership helpers (`src/convex/helpers.ts`)

Add `requireOwnedRun`, `requireOwnedAgent`, `requireOwnedFinding`, `requireOwnedTemplate` — same shape as `requireOwnedCard` (`ConvexError("Not found")` for missing/foreign, no existence leak). Add `sanitizeDomains(domains)` — lower-cases, strips scheme/path, rejects malformed hostnames; and `assertDomainMode` — a run/agent may set `domains` only when `domainMode !== "none"`, and never both allow+block (enforced by the single-mode union).

## Functions (`src/convex/Research.ts` — queries + mutations, default runtime)

**Credentials**
- `getCredentialStatus` query `{}` → `{ hasKey: boolean, last4?: string, defaultModel?: string }`. Never returns ciphertext.
- `setApiKey` mutation **(or action — see crypto runtime note above)** `{ key: string, defaultModel?: string }` → validates shape (non-empty, `sk-…`), calls `encryptSecret`, upserts the row. Returns `{ last4 }`.
- `clearApiKey` mutation `{}` → deletes the row.
- *(internal)* `getDecryptedKey` internalQuery `{ userId }` → returns `{ ciphertext, iv }` for the runner action to decrypt (never a public function).

**Templates**
- `listTemplates` query `{}` → user's custom templates (presets are client constants).
- `saveTemplate` mutation `{ id?, name, body }` → validates placeholders against the allow-list `{{title}} {{objective}} {{findings}} {{sources}} {{date}}`; upsert.
- `removeTemplate` mutation `{ id }`.

**Runs / agents / findings (read)**
- `getRun` query `{ runId }` → run + its agents (sorted by `order`) + finding counts. Ownership-checked.
- `listRuns` query `{ cardId }` → runs for a card, newest first, bounded.
- `getFindings` query `{ runId }` → findings for a run.

**Runs (write — no Anthropic calls here)**
- `createRun` mutation `{ cardId, mode, objective, formContext?, templateId?/templateBody?, webSearch, limits, agents? }` → requires the card's `description` non-empty (else `ConvexError`); requires a credential exists; snapshots `notifyEmail` from `ctx.auth.getUserIdentity().email`; enforces `limits` ceilings. For `manual` mode, inserts the provided agents (`status: "proposed"`) and sets run → `awaiting_approval`. For `orchestrated`, sets run → `planning` and schedules `internal.researchExec.planRun` (p4-02). Returns `runId`.
- `approveRun` mutation `{ runId }` → only from `awaiting_approval`; re-validates ceilings and per-agent `domainMode`/`domains`; flips agents `proposed → pending`, run → `running`, schedules the dispatcher (p4-02). Idempotent.
- `updateProposedAgent` / `addProposedAgent` / `removeProposedAgent` mutations — edit the plan while `awaiting_approval` (task, model, `domainMode`, `domains`, `maxWebSearches`). Re-check ceilings.
- `cancelRun` mutation `{ runId }` → allowed from any non-terminal state; marks run + non-terminal agents `canceled`.
- `removeRun` mutation `{ runId }` → cascade-delete agents + findings.

**Internal write helpers (called by p4-02 actions)**
- `setRunPlan` — write proposed agents + `costEstimate`, run → `awaiting_approval`. **Fable-required state-guard:** no-op if the run is no longer `planning` (e.g. canceled mid-plan).
- `markAgentRunning`.
- `recordFinding` — insert a finding. **Fable-required dedupe:** ignore the write if the agent is not `running` (a watchdog/late retry can fire after terminal), and dedupe on `(agentId, title)` so a `pause_turn`/429 resume can't double-insert.
- **`markAgentDone`** — set the agent's terminal `status` + `tokensUsed` + `error`, **and in the same transaction run the finalize check** (if the run is non-terminal and all its agents are terminal → set run `completed`/`failed`, insert the `Notifications` row, schedule `internal.researchExec.sendCompletionEmail`). **Fable-required:** folding finalize into this one mutation closes the durability hole where an action dying between a separate `markAgentDone` and `finalizeRunIfComplete` strands the run in `running` forever. `finalizeRunIfComplete` stays as an internal helper called *inside* `markAgentDone`, never scheduled separately. Idempotent + race-free: competing terminal transitions conflict on the run doc and OCC-retry, so exactly one flips it and inserts one notification.
- **`failStaleAgent`** `{ agentId }` — **Fable-required watchdog target:** scheduled by p4-02 alongside each `runAgent` with a timeout delay; if the agent is still `running` when it fires (action died/timed out — actions aren't durable, only the scheduler is), mark it `failed` and run the same folded finalize. No-op if already terminal.
- `markRunFailed`.

**Notifications**
- `listNotifications` query `{}` → unread + recent, bounded.
- `markNotificationRead` mutation `{ id }` / `markAllRead` mutation `{}`.

**Cascade:** extend `Cards.removeCard` to also delete the card's `ResearchRuns` (and their agents/findings) and any `by_card` findings — batched per the delete-in-batches guideline.

## Acceptance criteria

- Every function requires auth and is userId-scoped; ownership helpers reject foreign/missing with `ConvexError("Not found")`.
- The plaintext key is accepted once, encrypted, and **never** returned by any public function; `getCredentialStatus` exposes only `hasKey`/`last4`.
- `createRun` blocks when the card description is empty or no key is set, and clamps `limits` to the ceilings.
- State machine transitions are enforced (`approveRun` only from `awaiting_approval`, etc.) and idempotent where re-callable.
- `markAgentDone`'s folded finalize is safe under concurrent agent completions (only one transition to terminal; one notification); `failStaleAgent` and `recordFinding` are no-ops against non-`running`/terminal agents.
- convex-test coverage: encrypt/decrypt round-trip; ownership isolation across users; description/key gating; ceiling clamping; state-machine transitions; folded-finalize idempotency under simultaneous completions; watchdog fails a stranded `running` agent and finalizes; `recordFinding` dedupe on `(agentId, title)`; card-delete cascade.

## Out of scope

Anthropic/Resend calls and the agent loop (p4-02). All UI (p4-03/04/05). Ollama execution (schema carries `provider: "ollama"` but no runner path this phase).
