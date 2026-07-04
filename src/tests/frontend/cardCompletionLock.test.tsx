import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

/* CardScreen's lock behavior for a Completed card: read-only phase select, no
 * Edit, an inert TaskList, but Delete still works. We mock convex/react with
 * a tiny in-memory store keyed by the real generated function names so the
 * component's real query/mutation call sites drive against fake data. */
vi.mock("convex/react", async () => {
  const { getFunctionName } = await import("convex/server");
  const { api } = await import("../../convex/_generated/api");

  const NAMES = {
    getCardById: getFunctionName(api.Cards.getCardById),
    changePhase: getFunctionName(api.Cards.changePhase),
    removeCard: getFunctionName(api.Cards.removeCard),
    getTasks: getFunctionName(api.Tasks.getTasks),
    getLinks: getFunctionName(api.ResearchLinks.getLinks),
    getTaskLinks: getFunctionName(api.ResearchLinks.getTaskLinks),
  };

  const store: { card: any; tasks: any[] } = { card: null, tasks: [] };
  (globalThis as any).__mockStore = store;

  function useQuery(ref: any, args: any) {
    if (args === "skip") return undefined;
    const name = getFunctionName(ref);
    if (name === NAMES.getCardById) return store.card;
    if (name === NAMES.getTasks) return store.tasks;
    if (name === NAMES.getLinks) return [];
    if (name === NAMES.getTaskLinks) return [];
    return undefined;
  }

  function useMutation(_ref: any) {
    const fn = async () => {};
    (fn as any).withOptimisticUpdate = () => fn;
    return fn;
  }

  return { useQuery, useMutation };
});

import CardScreen from "../../screens/CardScreen";
import { ToastProvider } from "../../lib/toast";

const CARD_ID = "card-1";

function seed(phase: "Research" | "In Progress" | "Completed", tasks: any[] = []) {
  (globalThis as any).__mockStore.card = {
    _id: CARD_ID,
    _creationTime: Date.now(),
    title: "Ship the widget",
    description: "",
    phase,
    color: "#336699",
    userId: "u",
  };
  (globalThis as any).__mockStore.tasks = tasks;
}

function renderCardScreen() {
  return render(
    <MemoryRouter initialEntries={[`/card/${CARD_ID}`]}>
      <ToastProvider>
        <Routes>
          <Route path="/card/:id" element={<CardScreen />} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>
  );
}

describe("CardScreen — completed card is locked", () => {
  beforeEach(() => {
    (globalThis as any).__mockStore.card = null;
    (globalThis as any).__mockStore.tasks = [];
  });

  it("disables the phase select, hides Edit, keeps Delete, and locks the task list", async () => {
    seed("Completed", [
      { _id: "t1", _creationTime: 1, cardId: CARD_ID, taskDescription: "Do it", priority: 2, order: 1, done: true },
    ]);
    renderCardScreen();

    expect(await screen.findByText("Ship the widget")).toBeInTheDocument();

    const select = screen.getByRole("combobox", { name: "Phase" });
    expect(select).toBeDisabled();

    expect(screen.queryByRole("button", { name: /Edit/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Delete$/ })).toBeInTheDocument();

    // TaskList: no add-task form, and the existing row's checkbox is disabled.
    expect(screen.queryByPlaceholderText("Add a task…")).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeDisabled();

    expect(screen.getByText(/Completed & locked/)).toBeInTheDocument();
  });

  it("a non-completed card keeps the select enabled, Edit visible, and the add-task form", async () => {
    seed("In Progress", []);
    renderCardScreen();

    expect(await screen.findByText("Ship the widget")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Phase" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /Edit/ })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Add a task…")).toBeInTheDocument();
  });
});
