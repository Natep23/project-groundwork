/* Pure helpers for the dashboard's multi-container card drag-and-drop.
 *
 * Kept out of the component so the drop-decision logic (same-column reorder vs
 * cross-phase move) is unit-testable without simulating a real dnd gesture. */
import { arrayMove } from "@dnd-kit/sortable";
import type { Id } from "../convex/_generated/dataModel";
import type { Phase } from "../convex/schema";
import { PHASES, type BoardCard } from "../components/card";

export type Columns = Record<Phase, BoardCard[]>;

/** Effective sort key: explicit `order`, falling back to `_creationTime` for
 * legacy/unmigrated cards — mirrors `Cards.getBoard`'s comparator. */
export const cardOrder = (card: BoardCard): number => card.order ?? card._creationTime;

const PHASE_INDEX: Record<Phase, number> = { Research: 0, "In Progress": 1, Completed: 2 };

/** Re-sort a flat board the same way the backend `getBoard` query does. */
export function sortBoard<T extends BoardCard>(cards: T[]): T[] {
  return [...cards].sort((a, b) => {
    const phaseDiff = PHASE_INDEX[a.phase] - PHASE_INDEX[b.phase];
    if (phaseDiff !== 0) return phaseDiff;
    return cardOrder(a) - cardOrder(b);
  });
}

export function isPhase(id: string | number): id is Phase {
  return (PHASES as string[]).includes(id as string);
}

/** Which column an id belongs to: a column id resolves to itself; a card id is
 * looked up in the current column snapshot. */
export function findContainer(columns: Columns, id: string | number): Phase | null {
  if (isPhase(id)) return id;
  for (const phase of PHASES) {
    if (columns[phase].some((c) => c._id === id)) return phase;
  }
  return null;
}

/**
 * Update the live snapshot for a drag-over. Owns *all* reordering (both
 * within-column sorting and cross-column moves) so `onDragEnd` can simply read
 * the final snapshot — no risk of double-applying an arrayMove.
 */
export function applyDragOver(
  columns: Columns,
  activeId: string | number,
  overId: string | number
): Columns {
  const activeContainer = findContainer(columns, activeId);
  const overContainer = isPhase(overId) ? overId : findContainer(columns, overId);
  if (!activeContainer || !overContainer) return columns;

  const activeItems = columns[activeContainer];
  const activeIndex = activeItems.findIndex((c) => c._id === activeId);
  if (activeIndex < 0) return columns;
  const moved = activeItems[activeIndex];

  // Within the same column: reorder to track the hovered item.
  if (activeContainer === overContainer) {
    if (isPhase(overId)) return columns; // hovering the column body, not an item
    const overIndex = activeItems.findIndex((c) => c._id === overId);
    if (overIndex < 0 || overIndex === activeIndex) return columns;
    return { ...columns, [activeContainer]: arrayMove(activeItems, activeIndex, overIndex) };
  }

  // Cross-column: pull the card out of its source and splice it into the dest.
  const overItems = columns[overContainer];
  let insertIndex: number;
  if (isPhase(overId)) {
    insertIndex = overItems.length; // dropped on the column itself → append
  } else {
    const idx = overItems.findIndex((c) => c._id === overId);
    insertIndex = idx >= 0 ? idx : overItems.length;
  }

  return {
    ...columns,
    [activeContainer]: activeItems.filter((c) => c._id !== activeId),
    [overContainer]: [
      ...overItems.slice(0, insertIndex),
      { ...moved, phase: overContainer },
      ...overItems.slice(insertIndex),
    ],
  };
}

export type DropPlan =
  | { kind: "reorder"; phase: Phase; updates: { id: Id<"Cards">; order: number }[] }
  | { kind: "move"; id: Id<"Cards">; toPhase: Phase; order: number }
  | null;

/**
 * Decide what to persist after a drag settles.
 * - Same column → a `setCardOrder` batch renumbering that column 1..n.
 * - Cross column → a single `moveCard` with an order that slots the card
 *   between its new neighbors (midpoint of their effective orders).
 * Returns null when nothing changed (dropped in place).
 *
 * @param finalColumns snapshot reflecting the final *visual* layout (after any
 *        within-column arrayMove already applied by the caller).
 * @param boardByPhase the reactive board grouped by phase, holding real order
 *        values — used to compute neighbor orders for a cross-phase insert.
 */
export function planCardDrop(params: {
  activeId: Id<"Cards">;
  fromPhase: Phase;
  finalColumns: Columns;
  boardByPhase: Columns;
  now?: number;
}): DropPlan {
  const { activeId, fromPhase, finalColumns, boardByPhase } = params;
  const destPhase = findContainer(finalColumns, activeId);
  if (!destPhase) return null;

  if (destPhase === fromPhase) {
    const list = finalColumns[destPhase];
    const original = boardByPhase[destPhase];
    const unchanged =
      list.length === original.length && list.every((c, i) => c._id === original[i]?._id);
    if (unchanged) return null;
    return {
      kind: "reorder",
      phase: destPhase,
      updates: list.map((c, i) => ({ id: c._id, order: i + 1 })),
    };
  }

  // Cross-phase: the destination column's real neighbors (active lived in a
  // different phase, so boardByPhase[destPhase] excludes it).
  const destList = finalColumns[destPhase];
  const insertIndex = destList.findIndex((c) => c._id === activeId);
  const neighbors = boardByPhase[destPhase];
  const before = insertIndex > 0 ? neighbors[insertIndex - 1] : undefined;
  const after = neighbors[insertIndex];

  let order: number;
  if (before && after) order = (cardOrder(before) + cardOrder(after)) / 2;
  else if (after) order = cardOrder(after) - 1;
  else if (before) order = cardOrder(before) + 1;
  else order = params.now ?? Date.now();

  return { kind: "move", id: activeId, toPhase: destPhase, order };
}

// Re-export so the component and tests share one source of `arrayMove`.
export { arrayMove };
