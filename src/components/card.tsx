import React from "react";
import { useNavigate } from "react-router-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Doc, Id } from "../convex/_generated/dataModel";
import type { Phase } from "../convex/schema";
import { ArrowLeftIcon, ArrowRightIcon, GripIcon, LockIcon, TrashIcon } from "./icons";
import { ConfirmDeleteModal } from "./Modals";
import { Progress } from "./Progress";

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
        <CardProgress card={card} />
      </div>
    </div>
  );
}

function CardProgress({ card }: { card: BoardCard }) {
  if (card.taskCount === 0) {
    return <span className="kcard__progress">no tasks</span>;
  }
  return (
    <span className="kcard__progress">
      {card.doneCount}/{card.taskCount}
      <Progress
        value={card.doneCount}
        max={card.taskCount}
        label={`${card.doneCount} of ${card.taskCount} tasks done`}
        trackClassName="kcard__progress-track"
        fillClassName="kcard__progress-fill"
      />
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
  const isCompleted = card.phase === "Completed";
  const noDrag = dragDisabled || isCompleted;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card._id,
    data: { card, phase: card.phase },
    disabled: noDrag,
  });

  const phaseIndex = PHASES.indexOf(card.phase);
  // A completed card is a locked terminal state: no arrows in either
  // direction (it can only be deleted, never moved).
  const prevPhase = isCompleted ? undefined : PHASES[phaseIndex - 1];
  const nextPhase = isCompleted ? undefined : PHASES[phaseIndex + 1];

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
      className={`kcard${isDragging ? " kcard--dragging" : ""}${isCompleted ? " kcard--completed" : ""}`}
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
      {isCompleted && (
        <span className="kcard__lock" aria-label="Completed and locked">
          <LockIcon /> Locked
        </span>
      )}
      {card.description && <p className="kcard__desc">{card.description}</p>}
      <div className="kcard__footer">
        <button
          className="icon-btn kcard__grip"
          aria-label={`Reorder card "${card.title}"`}
          title="Drag to reorder"
          disabled={noDrag}
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripIcon />
        </button>
        <CardProgress card={card} />
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
