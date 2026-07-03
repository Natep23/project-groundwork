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

function setup() {
    const t = convexTest(schema, modules);
    const asA = t.withIdentity({ subject: "user_a" });
    const asB = t.withIdentity({ subject: "user_b" });
    return { t, asA, asB };
}

describe("authentication", () => {
    test("every Cards query/mutation throws when unauthenticated", async () => {
        const { t, asA } = setup();
        const cardId = await asA.mutation(api.Cards.addCard, {
            title: "Owned",
            description: "",
            phase: "Research",
        });

        await expect(t.query(api.Cards.getBoard, {})).rejects.toThrow("Not signed in");
        await expect(t.query(api.Cards.getCardById, { id: cardId })).rejects.toThrow(
            "Not signed in",
        );
        await expect(
            t.mutation(api.Cards.addCard, { title: "x", description: "", phase: "Research" }),
        ).rejects.toThrow("Not signed in");
        await expect(
            t.mutation(api.Cards.updateCard, { id: cardId, title: "y" }),
        ).rejects.toThrow("Not signed in");
        await expect(
            t.mutation(api.Cards.changePhase, { id: cardId, phase: "Completed" }),
        ).rejects.toThrow("Not signed in");
        await expect(t.mutation(api.Cards.removeCard, { id: cardId })).rejects.toThrow(
            "Not signed in",
        );
    });
});

describe("ownership", () => {
    test("getBoard only returns the calling user's cards", async () => {
        const { asA, asB } = setup();
        await asA.mutation(api.Cards.addCard, {
            title: "A card",
            description: "a",
            phase: "Research",
        });
        await asA.mutation(api.Cards.addCard, {
            title: "A card 2",
            description: "a2",
            phase: "In Progress",
        });
        await asB.mutation(api.Cards.addCard, {
            title: "B card",
            description: "b",
            phase: "Completed",
        });

        const boardA = await asA.query(api.Cards.getBoard, {});
        const boardB = await asB.query(api.Cards.getBoard, {});
        expect(boardA).toHaveLength(2);
        expect(boardA.map((c) => c.title).sort()).toEqual(["A card", "A card 2"]);
        expect(boardB).toHaveLength(1);
        expect(boardB[0].title).toBe("B card");
    });

    test("getBoard enriches cards with taskCount and doneCount", async () => {
        const { asA } = setup();
        const withTasks = await asA.mutation(api.Cards.addCard, {
            title: "With tasks",
            description: "",
            phase: "In Progress",
        });
        const empty = await asA.mutation(api.Cards.addCard, {
            title: "Empty",
            description: "",
            phase: "Research",
        });
        const t1 = await asA.mutation(api.Tasks.addTask, {
            cardId: withTasks,
            taskDescription: "one",
            priority: 1,
        });
        await asA.mutation(api.Tasks.addTask, {
            cardId: withTasks,
            taskDescription: "two",
            priority: 2,
        });
        await asA.mutation(api.Tasks.addTask, {
            cardId: withTasks,
            taskDescription: "three",
            priority: 3,
        });
        await asA.mutation(api.Tasks.setDone, { id: t1, done: true });

        const board = await asA.query(api.Cards.getBoard, {});
        const enrichedWithTasks = board.find((c) => c._id === withTasks);
        const enrichedEmpty = board.find((c) => c._id === empty);
        expect(enrichedWithTasks).toMatchObject({ taskCount: 3, doneCount: 1 });
        expect(enrichedEmpty).toMatchObject({ taskCount: 0, doneCount: 0 });
    });

    test("getCardById returns null for another user's card", async () => {
        const { asA, asB } = setup();
        const cardId = await asA.mutation(api.Cards.addCard, {
            title: "Private",
            description: "",
            phase: "Research",
        });
        expect(await asB.query(api.Cards.getCardById, { id: cardId })).toBeNull();
        expect(await asA.query(api.Cards.getCardById, { id: cardId })).toMatchObject({
            title: "Private",
            userId: "user_a",
        });
    });

    test("getCardById returns null for a malformed id instead of throwing", async () => {
        const { asA } = setup();
        expect(await asA.query(api.Cards.getCardById, { id: "not-a-convex-id" })).toBeNull();
        expect(await asA.query(api.Cards.getCardById, { id: "" })).toBeNull();
    });

    test("mutations on another user's card throw Not found", async () => {
        const { asA, asB } = setup();
        const cardId = await asA.mutation(api.Cards.addCard, {
            title: "Private",
            description: "",
            phase: "Research",
        });
        await expect(
            asB.mutation(api.Cards.updateCard, { id: cardId, title: "hijack" }),
        ).rejects.toThrow("Not found");
        await expect(
            asB.mutation(api.Cards.changePhase, { id: cardId, phase: "Completed" }),
        ).rejects.toThrow("Not found");
        await expect(asB.mutation(api.Cards.removeCard, { id: cardId })).rejects.toThrow(
            "Not found",
        );
        // Still intact for the owner.
        expect(await asA.query(api.Cards.getCardById, { id: cardId })).not.toBeNull();
    });
});

describe("addCard/updateCard validation", () => {
    test("rejects empty and whitespace-only titles", async () => {
        const { asA } = setup();
        await expect(
            asA.mutation(api.Cards.addCard, { title: "", description: "", phase: "Research" }),
        ).rejects.toThrow("Title must not be empty");
        await expect(
            asA.mutation(api.Cards.addCard, {
                title: "   \t ",
                description: "",
                phase: "Research",
            }),
        ).rejects.toThrow("Title must not be empty");
    });

    test("trims the title and enforces max lengths", async () => {
        const { asA } = setup();
        const cardId = await asA.mutation(api.Cards.addCard, {
            title: "  Trimmed  ",
            description: "d",
            phase: "Research",
        });
        const card = await asA.query(api.Cards.getCardById, { id: cardId });
        expect(card?.title).toBe("Trimmed");

        await expect(
            asA.mutation(api.Cards.addCard, {
                title: "x".repeat(201),
                description: "",
                phase: "Research",
            }),
        ).rejects.toThrow("at most 200");
        await expect(
            asA.mutation(api.Cards.addCard, {
                title: "ok",
                description: "x".repeat(2001),
                phase: "Research",
            }),
        ).rejects.toThrow("at most 2000");
    });

    test("rejects malformed colors and accepts valid hex", async () => {
        const { asA } = setup();
        for (const bad of ["red", "#fff", "#12345g", "123456", "#1234567"]) {
            await expect(
                asA.mutation(api.Cards.addCard, {
                    title: "c",
                    description: "",
                    color: bad,
                    phase: "Research",
                }),
            ).rejects.toThrow("hex color");
        }
        const cardId = await asA.mutation(api.Cards.addCard, {
            title: "c",
            description: "",
            color: "#A1b2C3",
            phase: "Research",
        });
        const card = await asA.query(api.Cards.getCardById, { id: cardId });
        expect(card?.color).toBe("#A1b2C3");

        await expect(
            asA.mutation(api.Cards.updateCard, { id: cardId, color: "blue" }),
        ).rejects.toThrow("hex color");
        await expect(
            asA.mutation(api.Cards.updateCard, { id: cardId, title: "  " }),
        ).rejects.toThrow("Title must not be empty");
    });

    test("updateCard patches only provided fields", async () => {
        const { asA } = setup();
        const cardId = await asA.mutation(api.Cards.addCard, {
            title: "Before",
            description: "keep me",
            phase: "Research",
        });
        await asA.mutation(api.Cards.updateCard, { id: cardId, title: "  After  " });
        const card = await asA.query(api.Cards.getCardById, { id: cardId });
        expect(card?.title).toBe("After");
        expect(card?.description).toBe("keep me");
    });
});

describe("card order", () => {
    test("addCard assigns increasing order within a phase", async () => {
        const { asA } = setup();
        const first = await asA.mutation(api.Cards.addCard, {
            title: "first",
            description: "",
            phase: "Research",
        });
        const second = await asA.mutation(api.Cards.addCard, {
            title: "second",
            description: "",
            phase: "Research",
        });
        const board = await asA.query(api.Cards.getBoard, {});
        const firstCard = board.find((c) => c._id === first);
        const secondCard = board.find((c) => c._id === second);
        expect(firstCard?.order).toBeDefined();
        expect(secondCard?.order).toBeDefined();
        expect((secondCard!.order as number)).toBeGreaterThanOrEqual(firstCard!.order as number);
        expect(board.map((c) => c._id)).toEqual([first, second]);
    });

    test("setCardOrder batch aborts entirely on a foreign id", async () => {
        const { asA, asB } = setup();
        const ownCard = await asA.mutation(api.Cards.addCard, {
            title: "mine",
            description: "",
            phase: "Research",
        });
        const otherCard = await asB.mutation(api.Cards.addCard, {
            title: "theirs",
            description: "",
            phase: "Research",
        });
        await expect(
            asA.mutation(api.Cards.setCardOrder, {
                updates: [
                    { id: ownCard, order: 100 },
                    { id: otherCard, order: 200 },
                ],
            }),
        ).rejects.toThrow("Not found");
        const card = await asA.query(api.Cards.getCardById, { id: ownCard });
        expect(card?.order).not.toBe(100);
    });

    test("setCardOrder reorders owned cards", async () => {
        const { asA } = setup();
        const a = await asA.mutation(api.Cards.addCard, {
            title: "a",
            description: "",
            phase: "Research",
        });
        const b = await asA.mutation(api.Cards.addCard, {
            title: "b",
            description: "",
            phase: "Research",
        });
        await asA.mutation(api.Cards.setCardOrder, {
            updates: [
                { id: a, order: 20 },
                { id: b, order: 10 },
            ],
        });
        const board = await asA.query(api.Cards.getBoard, {});
        expect(board.map((c) => c._id)).toEqual([b, a]);
    });
});

describe("moveCard", () => {
    test("moveCard atomically sets phase + order and requires ownership", async () => {
        const { asA, asB } = setup();
        const cardId = await asA.mutation(api.Cards.addCard, {
            title: "c",
            description: "",
            phase: "Research",
        });
        await asA.mutation(api.Cards.moveCard, {
            id: cardId,
            toPhase: "In Progress",
            order: 5,
        });
        const card = await asA.query(api.Cards.getCardById, { id: cardId });
        expect(card?.phase).toBe("In Progress");
        expect(card?.order).toBe(5);

        await expect(
            asB.mutation(api.Cards.moveCard, { id: cardId, toPhase: "Completed", order: 1 }),
        ).rejects.toThrow("Not found");
    });
});

describe("changePhase and removeCard", () => {
    test("changePhase updates the phase for the owner", async () => {
        const { asA } = setup();
        const cardId = await asA.mutation(api.Cards.addCard, {
            title: "c",
            description: "",
            phase: "Research",
        });
        await asA.mutation(api.Cards.changePhase, { id: cardId, phase: "In Progress" });
        const card = await asA.query(api.Cards.getCardById, { id: cardId });
        expect(card?.phase).toBe("In Progress");
    });

    test("removeCard cascades tasks and links", async () => {
        const { t, asA } = setup();
        const cardId = await asA.mutation(api.Cards.addCard, {
            title: "c",
            description: "",
            phase: "Research",
        });
        const otherCardId = await asA.mutation(api.Cards.addCard, {
            title: "other",
            description: "",
            phase: "Research",
        });
        await asA.mutation(api.Tasks.addTask, {
            cardId,
            taskDescription: "t1",
            priority: 1,
        });
        await asA.mutation(api.Tasks.addTask, {
            cardId,
            taskDescription: "t2",
            priority: 2,
        });
        await asA.mutation(api.Tasks.addTask, {
            cardId: otherCardId,
            taskDescription: "keep",
            priority: 1,
        });
        await asA.mutation(api.ResearchLinks.addLink, {
            cardId,
            link: "https://example.com",
        });
        await asA.mutation(api.ResearchLinks.addLink, {
            cardId: otherCardId,
            link: "https://keep.example.com",
        });

        await asA.mutation(api.Cards.removeCard, { id: cardId });

        expect(await asA.query(api.Cards.getCardById, { id: cardId })).toBeNull();
        await t.run(async (ctx) => {
            const tasks = await ctx.db.query("Tasks").collect();
            const links = await ctx.db.query("ResearchLinks").collect();
            expect(tasks).toHaveLength(1);
            expect(tasks[0].taskDescription).toBe("keep");
            expect(links).toHaveLength(1);
            expect(links[0].link).toBe("https://keep.example.com");
        });
    });
});
