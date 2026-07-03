# 04 — Task Depth UI

**Owner:** Sonnet 5 · **Depends on:** `02` (`completedAt`, `updateTask`, task-scoped links)

## Goal
Turn task rows from checkable one-liners into small project-progress records: editable, dated, and
able to hold their own research links — filling the sparse card-detail space in the process.

## Scope / deliverables
- **Expandable task rows** in `TaskList`: a disclosure control expands a row in place (no navigation) into a detail panel showing:
  - **Editable title** (inline text → `updateTask`) and **priority** selector.
  - **Added** date (from `_creationTime`) and, when done, **Completed** date (from `completedAt`).
  - A **per-task research links** mini-panel: list + add + delete, scoped to the task (`getTaskLinks`, `addLink({taskId})`, `removeLink`). Reuse the `ResearchList` link parsing/handling (`linkTitle`, obsidian/web icons, `noopener,noreferrer`).
- Keep drag-reorder, check-off, and delete working on the collapsed row; expansion must not interfere with the sortable grip.
- Empty state for a task with no links; toasts + `logger.error` on mutation failure (project convention).

## Acceptance criteria
- Editing a title/priority persists and reflects immediately.
- Completing a task shows a Completed date; un-completing hides it.
- Adding an obsidian/web link to a task shows it under that task only (not the card-level list); a bad scheme surfaces the backend message inline.
- Deleting a task removes its links (verified in `02`; UI just reflects).
- Expand/collapse is keyboard-accessible (`aria-expanded`, focusable trigger) and doesn't trigger drag or navigation.
- Vitest: task row expand + edit + link add/delete against a mocked Convex layer; typecheck/tests/build green.

## Out of scope
Card-level links (unchanged). Backend (in `02`). Gamification visuals (in `05`).

## Notes
- Factor the link-list into a shared component parameterized by `{cardId}` or `{cardId, taskId}` so card-detail and task-detail reuse it rather than duplicating.
- Mind the sortable: the expand toggle and inputs must `stopPropagation` on pointer-down so they don't start a task drag.
