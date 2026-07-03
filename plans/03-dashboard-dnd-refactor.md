# 03 — Dashboard Drag-and-Drop Refactor

**Owner:** Opus 4.8 (the one major refactor) · **Depends on:** `02` (`Cards.order`, `setCardOrder`, sorted `getBoard`)

## Goal
Let cards be **reordered within a phase** by dragging (like the task list) **in addition to** moving
between phases — in one coherent dnd-kit sortable system, replacing the Phase 1
`useDraggable`/`useDroppable` approach.

## Scope / deliverables
- Rebuild `DashboardScreen` + `BoardColumn` + `card.tsx` drag wiring as a **multi-container sortable**:
  each column is a `SortableContext`; cards are sortable items; a `DragOverlay` shows the ghost.
- `onDragEnd`:
  - **same column** → compute new order via `arrayMove`, persist with `setCardOrder` (optimistic).
  - **cross column** → a single `moveCard({ id, toPhase, order })` mutation (atomic phase + order, one optimistic update — do **not** chain `changePhase` + `setCardOrder`, which race on `getBoard`).
- Preserve everything the current cards do: click-to-open (title button), phase arrows, delete, progress. Drag must not fire on button taps (keep the mouse/touch/pointer-down stop guards).
- Sensors: Mouse (distance), Touch (delay+tolerance), **Keyboard** (sortable coordinates) so cards are keyboard-reorderable too.
- Empty columns remain valid drop targets.

## Acceptance criteria
- Reorder within a column persists across reload; cross-phase move persists and lands in the intended position.
- No snap-back flicker (optimistic updates cover both mutations).
- Keyboard: focus a card, lift, move within and across columns, drop.
- Touch drag works; tapping a card's buttons never starts a drag.
- Dragging is disabled while a search filter is active (no order scramble of hidden cards).
- Vitest: a component test asserting `onDragEnd` maps same-column vs cross-column to the right mutation calls (mock the mutations).
- Typecheck/tests/build green.

## Out of scope
Backend (done in `02`). Task-list DnD (already sortable). Visual restyle beyond what the new structure needs — themes/motion polish is `06`.

## Notes
- **Not isolated from `05`:** `05` later edits `card.tsx` / `DashboardScreen.tsx` / `header.tsx` too, so `05` is sequenced **after** `03` (see `00`). Keep board grid markup stable to ease that merge.
- **Search × reorder:** disable card dragging while a search query is active — the filtered subset would otherwise rewrite orders for only-visible cards and scramble the hidden ones. (In acceptance criteria.)
- **Drag with a local container copy:** hold a local column-state snapshot during the gesture, mutate it in `onDragOver`, commit on `onDragEnd` — don't fight reactive `getBoard` updates mid-drag.
- Watch the classic multi-container pitfalls: item vs container `over` ids, empty-container drops, and stale index math after optimistic reorder.
