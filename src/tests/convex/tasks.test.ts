// @vitest-environment edge-runtime
import { describe, expect, test } from "vitest";
import { convexTest } from "convex-test";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";

// Note: convex-test docs suggest "../../convex/**/!(*.*.*)*.*s", but Vite's
// glob here doesn't support extglob negation, so exclude *.d.ts explicitly.
const modules = import.meta.glob([
    "../../convex/**/*.{js,ts}",
    "!../../convex/**/*.d.ts",
]);

async function setup() {
    const t = convexTest(schema, modules);
    const asA = t.withIdentity({ subject: "user_a" });
    const asB = t.withIdentity({ subject: "user_b" });
    const cardId = await asA.mutation(api.Cards.addCard, {
        title: "A card",
        description: "",
        phase: "Research",
    });
    return { t, asA, asB, cardId };
}

describe("authentication", () => {
    test("every Tasks query/mutation throws when unauthenticated", async () => {
        const { t, asA, cardId } = await setup();
        const taskId = await asA.mutation(api.Tasks.addTask, {
            cardId,
            taskDescription: "task",
            priority: 1,
        });

        await expect(t.query(api.Tasks.getTasks, { cardId })).rejects.toThrow(
            "Not signed in",
        );
        await expect(
            t.mutation(api.Tasks.addTask, { cardId, taskDescription: "x", priority: 1 }),
        ).rejects.toThrow("Not signed in");
        await expect(
            t.mutation(api.Tasks.setDone, { id: taskId, done: true }),
        ).rejects.toThrow("Not signed in");
        await expect(
            t.mutation(api.Tasks.updateTask, { id: taskId, taskDescription: "y" }),
        ).rejects.toThrow("Not signed in");
        await expect(
            t.mutation(api.Tasks.setOrder, { updates: [{ id: taskId, order: 5 }] }),
        ).rejects.toThrow("Not signed in");
        await expect(t.mutation(api.Tasks.removeTask, { id: taskId })).rejects.toThrow(
            "Not signed in",
        );
    });
});

describe("ownership", () => {
    test("queries and mutations on another user's card/task throw Not found", async () => {
        const { asA, asB, cardId } = await setup();
        const taskId = await asA.mutation(api.Tasks.addTask, {
            cardId,
            taskDescription: "task",
            priority: 1,
        });

        await expect(asB.query(api.Tasks.getTasks, { cardId })).rejects.toThrow(
            "Not found",
        );
        await expect(
            asB.mutation(api.Tasks.addTask, { cardId, taskDescription: "x", priority: 1 }),
        ).rejects.toThrow("Not found");
        await expect(
            asB.mutation(api.Tasks.setDone, { id: taskId, done: true }),
        ).rejects.toThrow("Not found");
        await expect(
            asB.mutation(api.Tasks.updateTask, { id: taskId, taskDescription: "y" }),
        ).rejects.toThrow("Not found");
        await expect(
            asB.mutation(api.Tasks.setOrder, { updates: [{ id: taskId, order: 9 }] }),
        ).rejects.toThrow("Not found");
        await expect(asB.mutation(api.Tasks.removeTask, { id: taskId })).rejects.toThrow(
            "Not found",
        );
    });

    test("setOrder rejects the whole batch if any task is not owned", async () => {
        const { asA, asB, cardId } = await setup();
        const ownTask = await asA.mutation(api.Tasks.addTask, {
            cardId,
            taskDescription: "mine",
            priority: 1,
        });
        const otherCard = await asB.mutation(api.Cards.addCard, {
            title: "B card",
            description: "",
            phase: "Research",
        });
        const otherTask = await asB.mutation(api.Tasks.addTask, {
            cardId: otherCard,
            taskDescription: "theirs",
            priority: 1,
        });
        await expect(
            asA.mutation(api.Tasks.setOrder, {
                updates: [
                    { id: ownTask, order: 10 },
                    { id: otherTask, order: 11 },
                ],
            }),
        ).rejects.toThrow("Not found");
        // Own task order untouched because the batch is checked before writing.
        const tasks = await asA.query(api.Tasks.getTasks, { cardId });
        expect(tasks[0].order).toBe(1);
    });
});

describe("behavior", () => {
    test("addTask assigns incrementing order and done=false; getTasks sorts by order", async () => {
        const { asA, cardId } = await setup();
        await asA.mutation(api.Tasks.addTask, {
            cardId,
            taskDescription: "first",
            priority: 1,
        });
        await asA.mutation(api.Tasks.addTask, {
            cardId,
            taskDescription: "second",
            priority: 2,
        });
        await asA.mutation(api.Tasks.addTask, {
            cardId,
            taskDescription: "  third  ",
            priority: 3,
        });

        const tasks = await asA.query(api.Tasks.getTasks, { cardId });
        expect(tasks.map((t) => t.order)).toEqual([1, 2, 3]);
        expect(tasks.map((t) => t.taskDescription)).toEqual(["first", "second", "third"]);
        expect(tasks.every((t) => t.done === false)).toBe(true);
    });

    test("setDone flips the done flag", async () => {
        const { asA, cardId } = await setup();
        const taskId = await asA.mutation(api.Tasks.addTask, {
            cardId,
            taskDescription: "task",
            priority: 1,
        });
        await asA.mutation(api.Tasks.setDone, { id: taskId, done: true });
        let tasks = await asA.query(api.Tasks.getTasks, { cardId });
        expect(tasks[0].done).toBe(true);
        await asA.mutation(api.Tasks.setDone, { id: taskId, done: false });
        tasks = await asA.query(api.Tasks.getTasks, { cardId });
        expect(tasks[0].done).toBe(false);
    });

    test("setOrder batch-reorders tasks", async () => {
        const { asA, cardId } = await setup();
        const a = await asA.mutation(api.Tasks.addTask, {
            cardId,
            taskDescription: "a",
            priority: 1,
        });
        const b = await asA.mutation(api.Tasks.addTask, {
            cardId,
            taskDescription: "b",
            priority: 1,
        });
        const c = await asA.mutation(api.Tasks.addTask, {
            cardId,
            taskDescription: "c",
            priority: 1,
        });
        await asA.mutation(api.Tasks.setOrder, {
            updates: [
                { id: a, order: 3 },
                { id: b, order: 1 },
                { id: c, order: 2 },
            ],
        });
        const tasks = await asA.query(api.Tasks.getTasks, { cardId });
        expect(tasks.map((t) => t.taskDescription)).toEqual(["b", "c", "a"]);
    });

    test("updateTask validates and patches provided fields", async () => {
        const { asA, cardId } = await setup();
        const taskId = await asA.mutation(api.Tasks.addTask, {
            cardId,
            taskDescription: "before",
            priority: 1,
        });
        await asA.mutation(api.Tasks.updateTask, {
            id: taskId,
            taskDescription: "  after  ",
            priority: 3,
        });
        const tasks = await asA.query(api.Tasks.getTasks, { cardId });
        expect(tasks[0]).toMatchObject({ taskDescription: "after", priority: 3 });

        await expect(
            asA.mutation(api.Tasks.updateTask, { id: taskId, taskDescription: "   " }),
        ).rejects.toThrow("must not be empty");
        await expect(
            asA.mutation(api.Tasks.addTask, {
                cardId,
                taskDescription: "x".repeat(501),
                priority: 1,
            }),
        ).rejects.toThrow("at most 500");
    });

    test("removeTask deletes the task", async () => {
        const { asA, cardId } = await setup();
        const taskId = await asA.mutation(api.Tasks.addTask, {
            cardId,
            taskDescription: "doomed",
            priority: 1,
        });
        await asA.mutation(api.Tasks.removeTask, { id: taskId });
        expect(await asA.query(api.Tasks.getTasks, { cardId })).toHaveLength(0);
    });
});
