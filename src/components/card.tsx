import React from "react";
import { useNavigate } from "react-router-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Doc, Id } from "../convex/_generated/dataModel";
import type { Phase } from "../convex/schema";
import { ArrowLeftIcon, ArrowRightIcon, GripIcon, TrashIcon } from "./icons";
import { ConfirmDeleteModal } from "./Modals";

export type BoardCard = Doc<"Cards"> & {
  taskCount: number;
  doneCount: number;
};

export const PHASES: Phase[] = ["Research", "In Progress", "Completed"];

type CardActions = {
  onMove: (id: Id<"Cards">, phase: Phase) => void;
  onDelete: (id: Id<"Cards">) => void;
};

function CardBody({ card }: { card: BoardCard }) {
  return (
    <>
      <h3 className="kcard__title">{card.title}</h3>
      {card.description && <p className="kcard__desc">{card.description}</p>}
    </>
  );
}

/* Keeps taps/clicks on a card's inner controls from starting a drag. */
const stopDragActivation = {
  onMouseDown: (e: React.SyntheticEvent) => e.stopPropagation(),
  onTouchStart: (e: React.SyntheticEvent) => e.stopPropagation(),
  onPointerDown: (e: React.SyntheticEvent) => e.stopPropagation(),
};

/* Static rendering used inside the DragOverlay while a card is lifted. */
export function CardGhost({ card }: { card: BoardCard }) {
  return (
    <div className="kcard kcard--overlay" style={{ "--flag": card.color } as React.CSSProperties}>
      <CardBody card={card} />
      <div className="kcard__footer">
        <Progress card={card} />
      </div>
    </div>
  );
}

function Progress({ card }: { card: BoardCard }) {
  if (card.taskCount === 0) {
    return <span className="kcard__progress">no tasks</span>;
  }
  const pct = Math.round((card.doneCount / card.taskCount) * 100);
  return (
    <span className="kcard__progress" aria-label={`${card.doneCount} of ${card.taskCount} tasks done`}>
      {card.doneCount}/{card.taskCount}
      <span className="kcard__progress-track" aria-hidden="true">
        <span className="kcard__progress-fill" style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}

export function Card({
  card,
  onMove,
  onDelete,
  dragDisabled = false,
}: { card: BoardCard; dragDisabled?: boolean } & CardActions) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = React.useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card._id,
    data: { card, phase: card.phase },
    disabled: dragDisabled,
  });

  const phaseIndex = PHASES.indexOf(card.phase);
  const prevPhase = PHASES[phaseIndex - 1];
  const nextPhase = PHASES[phaseIndex + 1];

  const open = () => navigate(`/card/${card._id}`);

  /*
   * The wrapper div is a pointer convenience (click-to-open); it deliberately
   * carries no drag attributes/role, so it isn't a redundant tab stop with a
   * concatenated accessible name. Dragging goes through the dedicated grip
   * handle (like the task list); the title button is the accessible way in,
   * and the arrow buttons are the keyboard path for moving phases.
   */
  return (
    <div
      ref={setNodeRef}
      className={isDragging ? "kcard kcard--dragging" : "kcard"}
      style={
        {
          "--flag": card.color,
          transform: CSS.Transform.toString(transform),
          transition,
        } as React.CSSProperties
      }
      onClick={open}
    >
      <h3 className="kcard__title">
        <button
          className="kcard__open"
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
        >
          {card.title}
        </button>
      </h3>
      {card.description && <p className="kcard__desc">{card.description}</p>}
      <div className="kcard__footer">
        <button
          className="icon-btn kcard__grip"
          aria-label={`Reorder card "${card.title}"`}
          title="Drag to reorder"
          disabled={dragDisabled}
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripIcon />
        </button>
        <Progress card={card} />
        <div className="kcard__actions">
          {prevPhase && (
            <button
              className="icon-btn"
              aria-label={`Move "${card.title}" to ${prevPhase}`}
              title={`Move to ${prevPhase}`}
              onClick={(e) => {
                e.stopPropagation();
                onMove(card._id, prevPhase);
              }}
              {...stopDragActivation}
            >
              <ArrowLeftIcon />
            </button>
          )}
          {nextPhase && (
            <button
              className="icon-btn"
              aria-label={`Move "${card.title}" to ${nextPhase}`}
              title={`Move to ${nextPhase}`}
              onClick={(e) => {
                e.stopPropagation();
                onMove(card._id, nextPhase);
              }}
              {...stopDragActivation}
            >
              <ArrowRightIcon />
            </button>
          )}
          <button
            className="icon-btn icon-btn--danger"
            aria-label={`Delete card "${card.title}"`}
            title="Delete card"
            onClick={(e) => {
              e.stopPropagation();
              setConfirming(true);
            }}
            {...stopDragActivation}
          >
            <TrashIcon />
          </button>
        </div>
      </div>
      {confirming && (
        <ConfirmDeleteModal
          open
          title="Delete this card?"
          body={`"${card.title}" and all of its tasks and research links will be deleted. This can't be undone.`}
          confirmLabel="Delete card"
          onConfirm={() => {
            setConfirming(false);
            onDelete(card._id);
          }}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
