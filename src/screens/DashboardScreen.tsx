import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import type { Phase } from "../convex/schema";
import { BoardCard, CardGhost, PHASES } from "../components/card";
import { BoardColumn } from "../components/BoardColumn";
import { PlusIcon, SearchIcon } from "../components/icons";
import { useToast } from "../lib/toast";
import { logger } from "../lib/logger";

export default function DashboardScreen() {
  const board = useQuery(api.Cards.getBoard);
  const removeCard = useMutation(api.Cards.removeCard);
  const changePhase = useMutation(api.Cards.changePhase).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.Cards.getBoard, {});
      if (current === undefined) return;
      localStore.setQuery(
        api.Cards.getBoard,
        {},
        current.map((card) => (card._id === args.id ? { ...card, phase: args.phase } : card))
      );
    }
  );

  const { toast, toastError } = useToast();
  const [query, setQuery] = React.useState("");
  const [activeCard, setActiveCard] = React.useState<BoardCard | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  const filtered = React.useMemo(() => {
    if (board === undefined) return undefined;
    const q = query.trim().toLowerCase();
    if (!q) return board;
    return board.filter(
      (card) =>
        card.title.toLowerCase().includes(q) || card.description.toLowerCase().includes(q)
    );
  }, [board, query]);

  const byPhase = React.useMemo(() => {
    const groups: Record<Phase, BoardCard[]> = { Research: [], "In Progress": [], Completed: [] };
    for (const card of filtered ?? []) groups[card.phase].push(card);
    return groups;
  }, [filtered]);

  const handleMove = async (id: Id<"Cards">, phase: Phase) => {
    try {
      await changePhase({ id, phase });
      toast(`Moved to ${phase}`);
    } catch (err) {
      logger.error("changePhase failed", err);
      toastError("Couldn't move the card. Try again.");
    }
  };

  const handleDelete = async (id: Id<"Cards">) => {
    try {
      await removeCard({ id });
      toast("Card deleted");
    } catch (err) {
      logger.error("removeCard failed", err);
      toastError("Couldn't delete the card. Try again.");
    }
  };

  const onDragStart = (e: DragStartEvent) => {
    setActiveCard((e.active.data.current?.card as BoardCard) ?? null);
  };

  const onDragEnd = (e: DragEndEvent) => {
    const card = activeCard;
    setActiveCard(null);
    const target = e.over?.id as Phase | undefined;
    if (!card || !target || target === card.phase) return;
    void handleMove(card._id, target);
  };

  if (filtered === undefined) {
    return (
      <div className="app-loading" role="status">
        <span>Loading the board…</span>
      </div>
    );
  }

  return (
    <main className="board-page">
      <div className="board-toolbar">
        <div className="board-search">
          <SearchIcon />
          <input
            type="search"
            placeholder="Find a card…"
            aria-label="Find a card by title or description"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span className="board-count" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "card" : "cards"}
          {query.trim() ? " found" : " on plan"}
        </span>
        <Link to="/create-card" className="btn btn--primary">
          <PlusIcon /> New card
        </Link>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveCard(null)}
      >
        <div className="board">
          {PHASES.map((phase) => (
            <BoardColumn
              key={phase}
              phase={phase}
              cards={byPhase[phase]}
              onMove={handleMove}
              onDelete={handleDelete}
            />
          ))}
        </div>
        <DragOverlay>{activeCard && <CardGhost card={activeCard} />}</DragOverlay>
      </DndContext>
    </main>
  );
}
