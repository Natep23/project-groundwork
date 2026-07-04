import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Phase } from "../convex/schema";
import { PHASES } from "../components/card";

// A card can't be *created* already finished: "Completed" is a locked terminal
// state you can only reach through the gated, confirmed completion flow (which
// also awards ship XP). So it's not offered as a starting phase.
const START_PHASES: Phase[] = PHASES.filter((p) => p !== "Completed");
import { ColorSwatches, DEFAULT_FLAG } from "../components/ColorSwatches";
import { ArrowLeftIcon } from "../components/icons";
import { useToast } from "../lib/toast";
import { logger } from "../lib/logger";
import { localDayKey } from "../lib/dayKey";

export default function CreateCardScreen() {
  const addCard = useMutation(api.Cards.addCard);
  const navigate = useNavigate();
  const { toast, toastError } = useToast();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [color, setColor] = React.useState<string>(DEFAULT_FLAG);
  const [phase, setPhase] = React.useState<Phase>("Research");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Give the card a title.");
      return;
    }
    setSaving(true);
    try {
      await addCard({ title: title.trim(), description, color, phase, dayKey: localDayKey() });
      toast("Card added to the board");
      navigate("/");
    } catch (err) {
      logger.error("addCard failed", err);
      toastError("Couldn't create the card. Try again.");
      setSaving(false);
    }
  };

  return (
    <main className="create-page">
      <Link to="/" className="back-link">
        <ArrowLeftIcon /> Back to board
      </Link>
      <h1 className="page-title">New card</h1>
      <div className="create-grid">
        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="new-title">Title</label>
            <input
              id="new-title"
              type="text"
              placeholder="What are you building?"
              value={title}
              maxLength={200}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
            />
            {error && <span className="field__error">{error}</span>}
          </div>
          <div className="field">
            <label htmlFor="new-desc">Description</label>
            <textarea
              id="new-desc"
              placeholder="A sentence on what this project is and why."
              value={description}
              maxLength={2000}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Flag color</label>
            <ColorSwatches value={color} onChange={setColor} />
          </div>
          <div className="field">
            <label htmlFor="new-phase">Starting phase</label>
            <select id="new-phase" value={phase} onChange={(e) => setPhase(e.target.value as Phase)}>
              {START_PHASES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? "Creating…" : "Create card"}
          </button>
        </form>

        <div>
          <div className="eyebrow preview-label">Preview</div>
          <div className="preview-well">
            <div className="kcard" style={{ "--flag": color, cursor: "default" } as React.CSSProperties}>
              <h3 className="kcard__title">{title.trim() || "Untitled card"}</h3>
              <p className="kcard__desc">{description || "No description yet."}</p>
              <div className="kcard__footer">
                <span className="kcard__progress">no tasks</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
