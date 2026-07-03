import React from "react";
import { createPortal } from "react-dom";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Doc } from "../convex/_generated/dataModel";
import { ColorSwatches, DEFAULT_FLAG } from "./ColorSwatches";
import { useToast } from "../lib/toast";
import { logger } from "../lib/logger";

type ModalShellProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** "slideover" pins the panel to the right edge (used by the HQ console); "dialog" (default) centers it. */
  variant?: "dialog" | "slideover";
};

/* Shared dialog shell: scrim, Escape/scrim-click close, focus containment. */
export function ModalShell({ title, onClose, children, variant = "dialog" }: ModalShellProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  React.useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const firstField = panel?.querySelector<HTMLElement>(
      "input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])"
    );
    (firstField ?? panel)?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
      if (e.key === "Tab" && panel) {
        const focusables = panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!panel.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  /*
   * Portaled to <body> for stacking, and every pointer/click event is stopped
   * at the scrim: modals can be owned by draggable, clickable cards, and React
   * portals still bubble synthetic events through the component tree — without
   * this, pressing Cancel inside the dialog would also "click" the card.
   */
  return createPortal(
    <div
      className={variant === "slideover" ? "modal-scrim modal-scrim--slideover" : "modal-scrim"}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
        e.stopPropagation();
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div
        ref={panelRef}
        className={variant === "slideover" ? "modal modal--slideover" : "modal"}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <h2 className="modal__title" id={titleId}>
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body
  );
}

type ConfirmDeleteProps = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDeleteModal({ open, title, body, confirmLabel, onConfirm, onClose }: ConfirmDeleteProps) {
  if (!open) return null;
  return (
    <ModalShell title={title} onClose={onClose}>
      <p className="modal__body">{body}</p>
      <div className="modal__actions">
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn--danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}

type EditCardModalProps = {
  open: boolean;
  card: Doc<"Cards">;
  onClose: () => void;
};

export function EditCardModal({ open, card, onClose }: EditCardModalProps) {
  const updateCard = useMutation(api.Cards.updateCard);
  const { toast, toastError } = useToast();

  const [title, setTitle] = React.useState(card.title);
  const [description, setDescription] = React.useState(card.description);
  const [color, setColor] = React.useState(card.color ?? DEFAULT_FLAG);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setTitle(card.title);
      setDescription(card.description);
      setColor(card.color ?? DEFAULT_FLAG);
      setError(null);
    }
  }, [open, card]);

  if (!open) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Give the card a title.");
      return;
    }
    try {
      await updateCard({ id: card._id, title: title.trim(), description, color });
      toast("Card saved");
      onClose();
    } catch (err) {
      logger.error("updateCard failed", err);
      toastError("Couldn't save the card. Try again.");
    }
  };

  return (
    <ModalShell title="Edit card" onClose={onClose}>
      <form onSubmit={handleSave}>
        <div className="field">
          <label htmlFor="edit-title">Title</label>
          <input
            id="edit-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
          {error && <span className="field__error">{error}</span>}
        </div>
        <div className="field">
          <label htmlFor="edit-desc">Description</label>
          <textarea
            id="edit-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
          />
        </div>
        <div className="field">
          <label>Flag color</label>
          <ColorSwatches value={color} onChange={setColor} />
        </div>
        <div className="modal__actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary">
            Save changes
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
