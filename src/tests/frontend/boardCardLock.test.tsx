import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/* Card is a dnd-kit sortable item; stub useSortable so we can render it
 * outside a live DndContext and inspect the `disabled` flag it was given. */
const sortable = vi.hoisted(() => ({ lastDisabled: undefined as boolean | undefined }));

vi.mock("@dnd-kit/sortable", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@dnd-kit/sortable")>();
  return {
    ...actual,
    useSortable: (opts: { disabled?: boolean }) => {
      sortable.lastDisabled = opts.disabled;
      return {
        attributes: {},
        listeners: {},
        setNodeRef: () => {},
        transform: null,
        transition: undefined,
        isDragging: false,
      };
    },
  };
});

import { Card, BoardCard } from "../../components/card";
import { ThemeProvider } from "../../lib/theme";

function renderCard(card: BoardCard) {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Card card={card} onMove={() => {}} onDelete={() => {}} />
      </ThemeProvider>
    </MemoryRouter>
  );
}

function makeCard(overrides: Partial<BoardCard> = {}): BoardCard {
  return {
    _id: "card-1" as any,
    _creationTime: 1,
    title: "Ship the widget",
    description: "",
    phase: "In Progress",
    userId: "u",
    taskCount: 2,
    doneCount: 2,
    ...overrides,
  } as BoardCard;
}

describe("Card — completed phase is a locked terminal state", () => {
  it("renders no phase arrows, a disabled grip, a strikethrough class, a lock badge, and still Delete", () => {
    renderCard(makeCard({ phase: "Completed" }));

    expect(screen.queryByRole("button", { name: /Move .* to/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reorder card/ })).toBeDisabled();
    expect(sortable.lastDisabled).toBe(true);
    expect(screen.getByText("Locked")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Delete card/ })).toBeInTheDocument();

    const { container } = render(
      <MemoryRouter>
        <ThemeProvider>
          <Card card={makeCard({ phase: "Completed" })} onMove={() => {}} onDelete={() => {}} />
        </ThemeProvider>
      </MemoryRouter>
    );
    expect(container.querySelector(".kcard--completed")).toBeInTheDocument();
  });

  it("a non-completed card keeps its move-forward arrow and an enabled grip", () => {
    renderCard(makeCard({ phase: "In Progress" }));

    expect(screen.getByRole("button", { name: /Move .* to Completed/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reorder card/ })).not.toBeDisabled();
    expect(sortable.lastDisabled).toBe(false);
  });
});
