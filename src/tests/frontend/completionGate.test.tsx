import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "../../lib/toast";
import { ThemeProvider } from "../../lib/theme";

/* Completing a card via the board's → arrow is gated (unfinished tasks block
 * it) and, once eligible, confirmed through a blocking modal before the
 * mutation fires. We mock dnd-kit down to pass-through wrappers (no real
 * drag gesture is exercised here) and convex/react with a name-keyed mutation
 * spy so we can assert exactly which mutation (if any) was called. */
vi.mock("@dnd-kit/core", () => ({
  DndContext: (props: { children: React.ReactNode }) => props.children,
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

vi.mock("convex/react", async () => {
  const { getFunctionName } = await import("convex/server");
  const { api } = await import("../../convex/_generated/api");

  const NAMES = {
    getBoard: getFunctionName(api.Cards.getBoard),
    getProfile: getFunctionName(api.Profile.getProfile),
    changePhase: getFunctionName(api.Cards.changePhase),
    moveCard: getFunctionName(api.Cards.moveCard),
    setCardOrder: getFunctionName(api.Cards.setCardOrder),
    removeCard: getFunctionName(api.Cards.removeCard),
  };

  const store: { board: any[]; calls: { name: string; args: unknown }[] } = { board: [], calls: [] };
  (globalThis as any).__mockStore = store;

  function useQuery(ref: any) {
    const name = getFunctionName(ref);
    if (name === NAMES.getBoard) return store.board;
    if (name === NAMES.getProfile) return undefined;
    return undefined;
  }

  function useMutation(ref: any) {
    const name = getFunctionName(ref);
    const fn = async (args: unknown) => {
      store.calls.push({ name, args });
    };
    (fn as any).withOptimisticUpdate = () => fn;
    return fn;
  }

  return { useQuery, useMutation };
});

import DashboardScreen from "../../screens/DashboardScreen";

function card(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    _id: "c1",
    _creationTime: 1,
    title: "Ship the widget",
    description: "",
    phase: "In Progress",
    userId: "u",
    order: 1,
    taskCount: 2,
    doneCount: 1,
    ...overrides,
  };
}

function renderBoard() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <ToastProvider>
          <DashboardScreen />
        </ToastProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe("Completing a project via the board arrow is gated + confirmed", () => {
  beforeEach(() => {
    (globalThis as any).__mockStore.board = [];
    (globalThis as any).__mockStore.calls = [];
  });

  it("blocks completion with unfinished tasks: instructive toast, no confirm, no mutation", async () => {
    const user = userEvent.setup();
    (globalThis as any).__mockStore.board = [card({ taskCount: 2, doneCount: 1 })];
    renderBoard();

    await user.click(screen.getByRole("button", { name: /Move .* to Completed/ }));

    expect(
      await screen.findByText(/Complete or delete this project's unfinished tasks/)
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect((globalThis as any).__mockStore.calls).toHaveLength(0);
  });

  it("an all-done card opens the confirm modal; confirming calls changePhase, canceling calls nothing", async () => {
    const user = userEvent.setup();
    (globalThis as any).__mockStore.board = [card({ taskCount: 2, doneCount: 2 })];
    renderBoard();

    await user.click(screen.getByRole("button", { name: /Move .* to Completed/ }));

    const dialog = await screen.findByRole("dialog", { name: "Complete this project?" });
    expect(dialog).toBeInTheDocument();
    expect((globalThis as any).__mockStore.calls).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect((globalThis as any).__mockStore.calls).toHaveLength(0);
  });

  it("confirming completes the card via changePhase", async () => {
    const user = userEvent.setup();
    (globalThis as any).__mockStore.board = [card({ taskCount: 2, doneCount: 2 })];
    renderBoard();

    await user.click(screen.getByRole("button", { name: /Move .* to Completed/ }));
    await screen.findByRole("dialog", { name: "Complete this project?" });
    await user.click(screen.getByRole("button", { name: "Complete & lock" }));

    const calls = (globalThis as any).__mockStore.calls as { name: string; args: any }[];
    expect(calls).toHaveLength(1);
    expect(calls[0].args).toMatchObject({ id: "c1", phase: "Completed" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
