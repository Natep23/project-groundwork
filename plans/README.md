# Plans index

Build specs for GroundWork, by phase. Each file is one unit of work. Workflow (planning → Fable review + model assignment → build → Opus review → Fable sign-off) is documented in the root `CLAUDE.md`.

## Checklist

**Completed**
- [x] Phase 1 — Modernization (CRA→Vite, secured backend, 4-theme design system) — `2dcb1cf`
- [x] Phase 2 — Engagement & Depth (`00`–`07`): engine, sortable board, task depth, HQ/analytics, 3 unlockable themes, QA — `07fd598`

**Completed (cont.)**
- [x] Phase 3 — Theme Previews, Signature Components & Remix (`p3-01`–`p3-06`): server-authoritative remix unlock, theme gallery + preview/trial, component-kit registry, per-theme signature set-pieces, mix mode, QA — on `Fable5_2026_Revamp`

## Phase 1 — Modernization
Toolchain (CRA→Vite), secured Convex backend, token-based 4-theme design system. **✅ SHIPPED** — commit `2dcb1cf`. (No plan files; predates the plans folder.)

## Phase 2 — Engagement & Depth
| File | Workstream | Status |
|---|---|---|
| `00-overview.md` | Overview, sequencing, risks | ✅ Shipped (`07fd598`) |
| `01-api-contract.md` | Backend API contract | ✅ Shipped |
| `02-engagement-backend.md` | Engagement engine + tests | ✅ Shipped |
| `03-dashboard-dnd-refactor.md` | Multi-container sortable board | ✅ Shipped |
| `04-task-depth-ui.md` | Editable/expandable tasks, per-task links | ✅ Shipped |
| `05-engagement-ui-analytics.md` | Briefing bar, HQ console, heatmap | ✅ Shipped |
| `06-themes-and-motion.md` | 3 unlockable themes, boot sequence | ✅ Shipped |
| `07-qa-and-review.md` | QA + Fable sign-off | ✅ Shipped |

Deferred follow-ups (noted at Phase 2 sign-off): `lastActiveDay` far-future clamp; `getActivity` cap tuning.

## Phase 3 — Theme Previews, Signature Components & Remix
Fable-reviewed; model assignments filled. Build order: **p3-01 ∥ p3-03 → p3-02 → p3-04 → p3-05 → p3-06.**

| File | Workstream | Model | Status |
|---|---|---|---|
| `p3-00-overview.md` | Overview, sequencing, decisions | — | ✅ Shipped |
| `p3-01-backend-remix-unlock.md` | Server-authoritative "remix" unlock | Sonnet | ✅ Shipped |
| `p3-02-theme-gallery-preview.md` | Theme gallery + preview/trial of locked themes | Sonnet | ✅ Shipped |
| `p3-03-theme-kits.md` | Theme-kit registry + core signature components | Sonnet | ✅ Shipped |
| `p3-04-signature-set-pieces.md` | Per-theme set-pieces (reactor dial, topo map, CRT) | Sonnet | ✅ Shipped |
| `p3-05-mix-mode.md` | Mix palette ⊗ component-kit (unlockable) | Opus | ✅ Shipped |
| `p3-06-qa-review.md` | QA audit (+ Opus review + Fable sign-off) | Sonnet | ✅ Shipped |

Legend: ✅ shipped · 🟡 in progress · 🔵 planned (awaiting go-ahead).
