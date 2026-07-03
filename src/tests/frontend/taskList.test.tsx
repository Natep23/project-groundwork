import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// --- Mock the Convex React bindings with an in-memory store keyed by the
// real generated function names (via getFunctionName), so TaskList and the
// shared LinkList component exercise their real query/mutation call sites
// against fake data instead of a live backend. ---
vi.mock("convex/react", async () => {
  const React = await import("react");
  const { getFunctionName } = await import("convex/server");
  const { ConvexError } = await import("convex/values");
  const { api } = await import("../../convex/_generated/api");

  const NAMES = {
    getTasks: getFunctionName(api.Tasks.getTasks),
    updateTask: getFunctionName(api.Tasks.updateTask),
    setDone: getFunctionName(api.Tasks.setDone),
    removeTask: getFunctionName(api.Tasks.removeTask),
    setOrder: getFunctionName(api.Tasks.setOrder),
    addTask: getFunctionName(api.Tasks.addTask),
    getTaskLinks: getFunctionName(api.ResearchLinks.getTaskLinks),
    getLinks: getFunctionName(api.ResearchLinks.getLinks),
    addLink: getFunctionName(api.ResearchLinks.addLink),
    removeLink: getFunctionName(api.ResearchLinks.removeLink),
  };

  const store: {
    tasks: any[];
    links: any[];
    failNextAddLink: boolean;
  } = { tasks: [], links: [], failNextAddLink: false };

  (globalThis as any).__mockStore = store;

  const listeners = new Set<() => void>();
  function notify() {
    listeners.forEach((l) => l());
  }

  function useQuery(ref: any, args: any) {
    const [, force] = React.useReducer((c: number) => c + 1, 0);
    React.useEffect(() => {
      listeners.add(force);
      return () => {
        listeners.delete(force);
      };
    }, [force]);
    if (args === "skip") return undefined;
    const name = getFunctionName(ref);
    if (name === NAMES.getTasks) {
      return store.tasks
        .filter((t) => t.cardId === args.cardId)
        .slice()
        .sort((a, b) => a.order - b.order);
    }
    if (name === NAMES.getTaskLinks) {
      return store.links.filter((l) => l.taskId === args.taskId);
    }
    if (name === NAMES.getLinks) {
      return store.links.filter((l) => l.cardId === args.cardId && l.taskId === undefined);
    }
    return undefined;
  }

  function useMutation(ref: any) {
    const name = getFunctionName(ref);
    const fn = async (args: any) => {
      if (name === NAMES.updateTask) {
        const t = store.tasks.find((x) => x._id === args.id);
        if (t) {
          if (args.taskDescription !== undefined) t.taskDescription = args.taskDescription;
          if (args.priority !== undefined) t.priority = args.priority;
        }
      } else if (name === NAMES.setDone) {
        const t = store.tasks.find((x) => x._id === args.id);
        if (t) {
          t.done = args.done;
          t.completedAt = args.done ? Date.now() : undefined;
        }
      } else if (name === NAMES.removeTask) {
        store.tasks = store.tasks.filter((x) => x._id !== args.id);
        store.links = store.links.filter((l) => l.taskId !== args.id);
      } else if (name === NAMES.addTask) {
        store.tasks.push({
          _id: `task-${store.tasks.length + 1}`,
          _creationTime: Date.now(),
          cardId: args.cardId,
          taskDescription: args.taskDescription,
          priority: args.priority,
          order: store.tasks.length + 1,
          done: false,
        });
      } else if (name === NAMES.setOrder) {
        // not exercised in this suite
      } else if (name === NAMES.addLink) {
        if (store.failNextAddLink) {
          store.failNextAddLink = false;
          throw new ConvexError("Only obsidian://, http:// and https:// links are allowed");
        }
        store.links.push({
          _id: `link-${store.links.length + 1}`,
          cardId: args.cardId,
          taskId: args.taskId,
          link: args.link,
        });
      } else if (name === NAMES.removeLink) {
        store.links = store.links.filter((l) => l._id !== args.id);
      }
      notify();
    };
    (fn as any).withOptimisticUpdate = () => fn;
    return fn;
  }

  return { useQuery, useMutation };
});

import { TaskList } from "../../components/TaskList";
import { ToastProvider } from "../../lib/toast";

const CARD_ID = "card-1" as any;

function seedTask(overrides: Partial<any> = {}) {
  const task = {
    _id: "task-1",
    _creationTime: new Date("2026-06-01T00:00:00Z").getTime(),
    cardId: CARD_ID,
    taskDescription: "Write the spec",
    priority: 2,
    order: 1,
    done: false,
    ...overrides,
  };
  (globalThis as any).__mockStore.tasks = [task];
  return task;
}

function renderTaskList() {
  return render(
    <ToastProvider>
      <TaskList cardId={CARD_ID} />
    </ToastProvider>
  );
}

describe("TaskList expandable rows", () => {
  beforeEach(() => {
    (globalThis as any).__mockStore.tasks = [];
    (globalThis as any).__mockStore.links = [];
    (globalThis as any).__mockStore.failNextAddLink = false;
  });

  it("expands and collapses via an accessible disclosure control", async () => {
    const user = userEvent.setup();
    seedTask();
    renderTaskList();

    const toggle = screen.getByRole("button", { name: "Expand task details" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(screen.getByRole("button", { name: "Collapse task details" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByText(/Added/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Collapse task details" }));
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
  });

  it("edits title and priority via updateTask, and reflects immediately", async () => {
    const user = userEvent.setup();
    seedTask();
    renderTaskList();

    await user.click(screen.getByRole("button", { name: "Expand task details" }));

    const titleInput = screen.getByDisplayValue("Write the spec");
    await user.clear(titleInput);
    await user.type(titleInput, "Write the final spec");
    await user.tab(); // blur -> commit

    expect(await screen.findByText("Write the final spec")).toBeInTheDocument();

    const prioritySelect = screen.getAllByRole("combobox").find((el) => el.closest(".task-detail"))!;
    await user.selectOptions(prioritySelect, "1");
    expect(await screen.findByText("High", { selector: ".prio" })).toBeInTheDocument();
  });

  it("shows a Completed date when done, and hides it when un-done", async () => {
    const user = userEvent.setup();
    seedTask();
    renderTaskList();

    await user.click(screen.getByRole("checkbox", { name: /Mark .* done/ }));
    await user.click(screen.getByRole("button", { name: "Expand task details" }));
    expect(screen.getByText(/Completed/)).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /Mark .* not done/ }));
    expect(screen.queryByText(/Completed/)).not.toBeInTheDocument();
  });

  it("adds and deletes a task-scoped research link, empty state first", async () => {
    const user = userEvent.setup();
    seedTask();
    renderTaskList();

    await user.click(screen.getByRole("button", { name: "Expand task details" }));
    expect(screen.getByText("No research yet")).toBeInTheDocument();

    const linkInput = screen.getByLabelText("New research link");
    await user.type(linkInput, "https://example.com/notes");
    await user.click(within(linkInput.closest(".add-row") as HTMLElement).getByRole("button", { name: /Add/ }));

    expect(await screen.findByTitle("https://example.com/notes")).toBeInTheDocument();
    expect((globalThis as any).__mockStore.links).toHaveLength(1);
    expect((globalThis as any).__mockStore.links[0].taskId).toBe("task-1");

    await user.click(screen.getByRole("button", { name: /Delete link/ }));
    expect(screen.queryByTitle("https://example.com/notes")).not.toBeInTheDocument();
    expect((globalThis as any).__mockStore.links).toHaveLength(0);
  });

  it("surfaces a backend scheme error inline without adding the link", async () => {
    const user = userEvent.setup();
    seedTask();
    (globalThis as any).__mockStore.failNextAddLink = true;
    renderTaskList();

    await user.click(screen.getByRole("button", { name: "Expand task details" }));
    const linkInput = screen.getByLabelText("New research link");
    await user.type(linkInput, "ftp://bad-scheme");
    await user.click(within(linkInput.closest(".add-row") as HTMLElement).getByRole("button", { name: /Add/ }));

    expect(
      await screen.findByText("Only obsidian://, http:// and https:// links are allowed")
    ).toBeInTheDocument();
    expect((globalThis as any).__mockStore.links).toHaveLength(0);
  });
});
