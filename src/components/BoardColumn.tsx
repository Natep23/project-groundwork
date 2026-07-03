import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Id } from "../convex/_generated/dataModel";
import type { Phase } from "../convex/schema";
import { BoardCard, Card } from "./card";

const COLUMN_META: Record<Phase, { number: string; empty: string; hint: string }> = {
  Research: {
    number: "01",
    empty: "Nothing under investigation",
    hint: "Add a card to start digging into an idea.",
  },
  "In Progress": {
    number: "02",
    empty: "Nothing on site",
    hint: "Move a researched card here when you break ground.",
  },
  Completed: {
    number: "03",
    empty: "Nothing signed off",
    hint: "Finished work lands here.",
  },
};

type Props = {
  phase: Phase;
  cards: BoardCard[];
  onMove: (id: Id<"Cards">, phase: Phase) => void;
  onDelete: (id: Id<"Cards">) => void;
  dragDisabled?: boolean;
};

export function BoardColumn({ phase, cards, onMove, onDelete, dragDisabled = false }: Props) {
  // The column is its own droppable (id = phase) so empty columns and the
  // gaps between cards remain valid drop targets for cross-phase moves.
  const { setNodeRef, isOver } = useDroppable({ id: phase, data: { phase } });
  const meta = COLUMN_META[phase];

  return (
    <section
      ref={setNodeRef}
      className={isOver ? "board-column board-column--over" : "board-column"}
      aria-label={`${phase} column`}
    >
      <div className="board-column__header">
        <span className="board-column__phase-no">PHASE {meta.number}</span>
        <h2 className="board-column__title">{phase}</h2>
        <span className="board-column__count">{cards.length}</span>
      </div>
      <div className="board-column__body">
        <SortableContext items={cards.map((c) => c._id)} strategy={verticalListSortingStrategy}>
          {cards.length === 0 ? (
            <div className="empty">
              <span className="empty__title">{meta.empty}</span>
              <span className="empty__hint">{meta.hint}</span>
            </div>
          ) : (
            cards.map((card) => (
              <Card
                key={card._id}
                card={card}
                onMove={onMove}
                onDelete={onDelete}
                dragDisabled={dragDisabled}
              />
            ))
          )}
        </SortableContext>
      </div>
    </section>
  );
}
