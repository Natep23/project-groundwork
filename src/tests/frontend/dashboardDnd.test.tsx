import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "../../lib/toast";

/* We mock dnd-kit so the DndContext just renders its children and hands us the
 * drag callbacks; then we drive onDragStart/onDragOver/onDragEnd directly and
 * assert which (mocked) Convex mutation the board dispatches. */
const dnd = vi.hoisted(() => ({ handlers: {} as Record<string, (e: unknown) => void> }));
const convex = vi.hoisted(() => ({ calls: [] as Record<string, unknown>[], board: [] as unknown[] }));

vi.mock("@dnd-kit/core", () => ({
  DndContext: (props: { children: React.ReactNode } & Record<string, unknown>) => {
    dnd.handlers = props as never;
    return props.children;
  },
  DragOverlay: (props: { children?: React.ReactNode }) => props.children ?? null,
  MouseSensor: function MouseSensor() {},
  TouchSensor: function TouchSensor() {},
  KeyboardSensor: function KeyboardSensor() {},
  closestCorners: () => [],
  useSensor: () => undefined,
  useSensors: () => [],
  useDroppable: () => ({ setNodeRef: () => {}, isOver: false }),
}));

vi.mock("@dnd-kit/sortable", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@dnd-kit/sortable")>();
  return {
    ...actual,
    SortableContext: (props: { children: React.ReactNode }) => props.children,
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: () => {},
      transform: null,
      transition: undefined,
      isDragging: false,
    }),
  };
});

vi.mock("convex/react", () => ({
  useQuery: () => convex.board,
  useMutation: () => {
    const fn = (args: Record<string, unknown>) => {
      convex.calls.push(args);
      return Promise.resolve();
    };
    fn.withOptimisticUpdate = () => fn;
    return fn;
  },
}));

// Imported after the mocks so it picks them up.
import DashboardScreen from "../../screens/DashboardScreen";

type AnyCard = Record<string, unknown>;
const card = (id: string, phase: string, order: number): AnyCard => ({
  _id: id,
  _creationTime: order,
  title: id.toUpperCase(),
  description: "",
  phase,
  userId: "u",
  order,
  taskCount: 0,
  doneCount: 0,
});

function renderBoard() {
  render(
    <MemoryRouter>
      <ToastProvider>
        <DashboardScreen />
      </ToastProvider>
    </MemoryRouter>
  );
}

const start = (id: string, c: AnyCard) => ({ active: { id, data: { current: { card: c } } } });
const over = (id: string, overId: string) => ({ active: { id }, over: { id: overId } });

describe("DashboardScreen drag-and-drop mapping", () => {
  beforeEach(() => {
    convex.calls = [];
  });

  it("same-column drag persists via setCardOrder (not moveCard)", () => {
    const r1 = card("r1", "Research", 1);
    const r2 = card("r2", "Research", 2);
    convex.board = [r1, r2, card("p1", "In Progress", 1)];
    renderBoard();

    act(() => dnd.handlers.onDragStart(start("r1", r1)));
    act(() => dnd.handlers.onDragOver(over("r1", "r2")));
    act(() => dnd.handlers.onDragEnd(over("r1", "r2")));

    const reorder = convex.calls.find((c) => Array.isArray(c.updates));
    const move = convex.calls.find((c) => typeof c.toPhase === "string");
    expect(move).toBeUndefined();
    expect(reorder?.updates).toEqual([
      { id: "r2", order: 1 },
      { id: "r1", order: 2 },
    ]);
  });

  it("cross-column drag persists via a single moveCard with a dayKey (not setCardOrder)", () => {
    const p1 = card("p1", "In Progress", 1);
    convex.board = [card("r1", "Research", 1), p1];
    renderBoard();

    act(() => dnd.handlers.onDragStart(start("p1", p1)));
    act(() => dnd.handlers.onDragOver(over("p1", "Completed")));
    act(() => dnd.handlers.onDragEnd(over("p1", "Completed")));

    const reorder = convex.calls.find((c) => Array.isArray(c.updates));
    const move = convex.calls.find((c) => typeof c.toPhase === "string");
    expect(reorder).toBeUndefined();
    expect(move).toMatchObject({ id: "p1", toPhase: "Completed" });
    expect(typeof move?.order).toBe("number");
    expect(move?.dayKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("dropping in place persists nothing", () => {
    const r1 = card("r1", "Research", 1);
    convex.board = [r1, card("r2", "Research", 2)];
    renderBoard();

    act(() => dnd.handlers.onDragStart(start("r1", r1)));
    act(() => dnd.handlers.onDragEnd(over("r1", "r1")));

    expect(convex.calls.length).toBe(0);
  });
});
