import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { ConvexError } from "convex/values";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import type { Phase } from "../convex/schema";
import { BoardCard, CardGhost, PHASES } from "../components/card";
import { BoardColumn } from "../components/BoardColumn";
import { BriefingBar } from "../components/BriefingBar";
import { HQConsole } from "../components/HQConsole";
import { ConfirmDeleteModal } from "../components/Modals";
import { PlusIcon, SearchIcon } from "../components/icons";
import { Loader } from "../components/Loader";
import { useToast } from "../lib/toast";
import { logger } from "../lib/logger";
import { localDayKey } from "../lib/dayKey";
import {
  applyDragOver,
  Columns,
  findContainer,
  planCardDrop,
  sortBoard,
} from "../lib/boardDnd";

const emptyColumns = (): Columns => ({ Research: [], "In Progress": [], Completed: [] });

export default function DashboardScreen() {
  const board = useQuery(api.Cards.getBoard);
  const profile = useQuery(api.Profile.getProfile);
  const removeCard = useMutation(api.Cards.removeCard);
  const [hqOpen, setHqOpen] = React.useState(false);

  const changePhase = useMutation(api.Cards.changePhase).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.Cards.getBoard, {});
      if (current === undefined) return;
      localStore.setQuery(
        api.Cards.getBoard,
        {},
        sortBoard(
          current.map((card) =>
            card._id === args.id ? { ...card, phase: args.phase } : card
          )
        )
      );
    }
  );

  const moveCard = useMutation(api.Cards.moveCard).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.Cards.getBoard, {});
    if (current === undefined) return;
    localStore.setQuery(
      api.Cards.getBoard,
      {},
      sortBoard(
        current.map((card) =>
          card._id === args.id ? { ...card, phase: args.toPhase, order: args.order } : card
        )
      )
    );
  });

  const setCardOrder = useMutation(api.Cards.setCardOrder).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.Cards.getBoard, {});
      if (current === undefined) return;
      const orderById = new Map(args.updates.map((u) => [u.id, u.order]));
      localStore.setQuery(
        api.Cards.getBoard,
        {},
        sortBoard(
          current.map((card) => ({ ...card, order: orderById.get(card._id) ?? card.order }))
        )
      );
    }
  );

  const { toast, toastError } = useToast();
  const [query, setQuery] = React.useState("");
  const [activeCard, setActiveCard] = React.useState<BoardCard | null>(null);
  // Local column snapshot held only for the duration of a drag gesture, so
  // reactive getBoard updates don't fight the in-flight reorder.
  const [dragColumns, setDragColumns] = React.useState<Columns | null>(null);
  // Completing a project (from the → arrow or a cross-phase drag) is gated
  // behind a blocking confirm; this stashes which card and which mutation
  // call to run once the user confirms. Unifies both entry points through
  // one modal.
  const [pendingComplete, setPendingComplete] = React.useState<{
    card: BoardCard;
    run: () => void;
  } | null>(null);

  const searchActive = query.trim().length > 0;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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

  const byPhase = React.useMemo<Columns>(() => {
    const groups = emptyColumns();
    for (const card of filtered ?? []) groups[card.phase].push(card);
    return groups;
  }, [filtered]);

  // While dragging use the local snapshot; otherwise the reactive board.
  const columns = dragColumns ?? byPhase;

  const runChangePhase = async (id: Id<"Cards">, phase: Phase) => {
    try {
      await changePhase({ id, phase, dayKey: localDayKey() });
      toast(`Moved to ${phase}`);
    } catch (err) {
      logger.error("changePhase failed", err);
      const message = err instanceof ConvexError ? String(err.data) : undefined;
      toastError(message ?? "Couldn't move the card. Try again.");
    }
  };

  const handleMove = (id: Id<"Cards">, phase: Phase) => {
    if (phase === "Completed") {
      const card = (board ?? []).find((c) => c._id === id);
      if (!card) return;
      if (card.taskCount !== card.doneCount) {
        toastError("Complete or delete this project's unfinished tasks before finishing it.");
        return;
      }
      setPendingComplete({ card, run: () => void runChangePhase(id, "Completed") });
      return;
    }
    void runChangePhase(id, phase);
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
    setDragColumns(byPhase);
  };

  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    setDragColumns((prev) => (prev ? applyDragOver(prev, active.id, over.id) : prev));
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    const snapshot = dragColumns;
    const started = activeCard;
    setActiveCard(null);
    setDragColumns(null);
    if (!over || !snapshot || !started) return;

    const activeId = active.id as Id<"Cards">;
    if (!findContainer(snapshot, over.id)) return;

    // The snapshot already reflects the final layout (onDragOver owns all
    // reordering), so we just read it here to decide what to persist.
    const plan = planCardDrop({
      activeId,
      fromPhase: started.phase,
      finalColumns: snapshot,
      boardByPhase: byPhase,
    });
    if (!plan) return;

    if (plan.kind === "reorder") {
      void setCardOrder({ updates: plan.updates }).catch((err) => {
        logger.error("setCardOrder failed", err);
        toastError("Couldn't reorder the cards. Try again.");
      });
    } else if (plan.toPhase === "Completed") {
      // Completing via drag is gated + confirmed exactly like the → arrow.
      // No mutation has run yet, so clearing dragColumns above already lets
      // the reactive `byPhase` (unchanged) repaint the card back in place —
      // nothing to revert here.
      if (started.taskCount !== started.doneCount) {
        toastError("Complete or delete this project's unfinished tasks before finishing it.");
        return;
      }
      const { id, toPhase, order } = plan;
      setPendingComplete({
        card: started,
        run: () =>
          void moveCard({ id, toPhase, order, dayKey: localDayKey() }).catch((err) => {
            logger.error("moveCard failed", err);
            const message = err instanceof ConvexError ? String(err.data) : undefined;
            toastError(message ?? "Couldn't move the card. Try again.");
          }),
      });
    } else {
      void moveCard({
        id: plan.id,
        toPhase: plan.toPhase,
        order: plan.order,
        dayKey: localDayKey(),
      }).catch((err) => {
        logger.error("moveCard failed", err);
        toastError("Couldn't move the card. Try again.");
      });
    }
  };

  if (filtered === undefined) {
    return <Loader as="div" className="app-loading" label="Loading the board…" />;
  }

  return (
    <main className="board-page">
      {profile && (
        <BriefingBar profile={profile} board={board ?? []} onOpenHQ={() => setHqOpen(true)} />
      )}
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
          {searchActive ? " found" : " on plan"}
        </span>
        <Link to="/create-card" className="btn btn--primary">
          <PlusIcon /> New card
        </Link>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => {
          setActiveCard(null);
          setDragColumns(null);
        }}
      >
        <div className="board">
          {PHASES.map((phase) => (
            <BoardColumn
              key={phase}
              phase={phase}
              cards={columns[phase]}
              onMove={handleMove}
              onDelete={handleDelete}
              dragDisabled={searchActive}
            />
          ))}
        </div>
        <DragOverlay>{activeCard && <CardGhost card={activeCard} />}</DragOverlay>
      </DndContext>
      {profile && <HQConsole open={hqOpen} profile={profile} onClose={() => setHqOpen(false)} />}
      <ConfirmDeleteModal
        open={pendingComplete !== null}
        title="Complete this project?"
        body={`Once completed, this project is locked — you won't be able to move it back or edit it (or its tasks), only delete it.`}
        confirmLabel="Complete & lock"
        tone="primary"
        onConfirm={() => {
          pendingComplete?.run();
          setPendingComplete(null);
        }}
        onClose={() => setPendingComplete(null)}
      />
    </main>
  );
}
