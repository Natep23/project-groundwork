import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Phase } from "../convex/schema";
import { PHASES } from "../components/card";
import { TaskList } from "../components/TaskList";
import { ResearchList } from "../components/ResearchList";
import { ConfirmDeleteModal, EditCardModal } from "../components/Modals";
import { ArrowLeftIcon, PencilIcon, TrashIcon } from "../components/icons";
import { useToast } from "../lib/toast";
import { logger } from "../lib/logger";
import { localDayKey } from "../lib/dayKey";
import { Loader } from "../components/Loader";

export default function CardScreen() {
  const { id } = useParams<{ id: string }>();
  // getCardById takes a plain string and resolves malformed ids to null,
  // so a bad URL lands on the not-found state instead of crashing the query.
  const card = useQuery(api.Cards.getCardById, { id: id ?? "" });
  const changePhase = useMutation(api.Cards.changePhase);
  const removeCard = useMutation(api.Cards.removeCard);
  const navigate = useNavigate();
  const { toast, toastError } = useToast();

  const [editing, setEditing] = React.useState(false);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  if (card === undefined) {
    return <Loader as="div" className="app-loading" label="Loading the card…" />;
  }

  if (card === null) {
    return (
      <main className="detail-page">
        <Link to="/" className="back-link">
          <ArrowLeftIcon /> Back to board
        </Link>
        <div className="empty" style={{ maxWidth: 480 }}>
          <span className="empty__title">Card not found</span>
          <span className="empty__hint">
            It may have been deleted. Head back to the board to see what's on the plan.
          </span>
        </div>
      </main>
    );
  }

  const handlePhaseChange = async (phase: Phase) => {
    try {
      await changePhase({ id: card._id, phase, dayKey: localDayKey() });
      toast(`Moved to ${phase}`);
    } catch (err) {
      logger.error("changePhase failed", err);
      toastError("Couldn't move the card. Try again.");
    }
  };

  const handleDelete = async () => {
    try {
      await removeCard({ id: card._id });
      toast("Card deleted");
      navigate("/");
    } catch (err) {
      logger.error("removeCard failed", err);
      toastError("Couldn't delete the card. Try again.");
    }
  };

  const created = new Date(card._creationTime).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  return (
    <main className="detail-page">
      <Link to="/" className="back-link">
        <ArrowLeftIcon /> Back to board
      </Link>

      <div className="detail-head" style={{ "--flag": card.color } as React.CSSProperties}>
        <div className="detail-head__row">
          <h1 className="detail-title">{card.title}</h1>
          <div className="detail-head__actions">
            <button className="btn" onClick={() => setEditing(true)}>
              <PencilIcon /> Edit
            </button>
            <button className="btn btn--danger" onClick={() => setConfirmingDelete(true)}>
              <TrashIcon /> Delete
            </button>
          </div>
        </div>
        {card.description && <p className="detail-desc">{card.description}</p>}
        <div className="detail-meta">
          <label>
            Phase{" "}
            <select
              className="theme-select"
              value={card.phase}
              onChange={(e) => void handlePhaseChange(e.target.value as Phase)}
            >
              {PHASES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <span>Started {created}</span>
        </div>
      </div>

      <div className="detail-grid">
        <TaskList cardId={card._id} />
        <ResearchList cardId={card._id} />
      </div>

      <EditCardModal open={editing} card={card} onClose={() => setEditing(false)} />
      <ConfirmDeleteModal
        open={confirmingDelete}
        title="Delete this card?"
        body={`"${card.title}" and all of its tasks and research links will be deleted. This can't be undone.`}
        confirmLabel="Delete card"
        onConfirm={() => void handleDelete()}
        onClose={() => setConfirmingDelete(false)}
      />
    </main>
  );
}
