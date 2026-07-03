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
    test("every ResearchLinks query/mutation throws when unauthenticated", async () => {
        const { t, asA, cardId } = await setup();
        const linkId = await asA.mutation(api.ResearchLinks.addLink, {
            cardId,
            link: "https://example.com",
        });

        await expect(t.query(api.ResearchLinks.getLinks, { cardId })).rejects.toThrow(
            "Not signed in",
        );
        await expect(
            t.mutation(api.ResearchLinks.addLink, { cardId, link: "https://example.com" }),
        ).rejects.toThrow("Not signed in");
        await expect(
            t.mutation(api.ResearchLinks.removeLink, { id: linkId }),
        ).rejects.toThrow("Not signed in");
    });
});

describe("ownership", () => {
    test("queries and mutations on another user's card/link throw Not found", async () => {
        const { asA, asB, cardId } = await setup();
        const linkId = await asA.mutation(api.ResearchLinks.addLink, {
            cardId,
            link: "https://example.com",
        });

        await expect(asB.query(api.ResearchLinks.getLinks, { cardId })).rejects.toThrow(
            "Not found",
        );
        await expect(
            asB.mutation(api.ResearchLinks.addLink, {
                cardId,
                link: "https://example.com",
            }),
        ).rejects.toThrow("Not found");
        await expect(
            asB.mutation(api.ResearchLinks.removeLink, { id: linkId }),
        ).rejects.toThrow("Not found");
    });
});

describe("addLink validation", () => {
    test("accepts obsidian:// and https:// and http:// links", async () => {
        const { asA, cardId } = await setup();
        const obsidian =
            "obsidian://open?vault=Notes&file=Research%2FGroundWork";
        await asA.mutation(api.ResearchLinks.addLink, { cardId, link: obsidian });
        await asA.mutation(api.ResearchLinks.addLink, {
            cardId,
            link: "https://example.com/path?q=1",
        });
        await asA.mutation(api.ResearchLinks.addLink, {
            cardId,
            link: "  http://example.com  ",
        });
        const links = await asA.query(api.ResearchLinks.getLinks, { cardId });
        expect(links.map((l) => l.link).sort()).toEqual(
            ["http://example.com", "https://example.com/path?q=1", obsidian].sort(),
        );
    });

    test("rejects javascript:, data:, and other unsafe or malformed links", async () => {
        const { asA, cardId } = await setup();
        const bad = [
            "javascript:alert(1)",
            "JaVaScRiPt:alert(1)",
            "data:text/html,<script>alert(1)</script>",
            "vbscript:msgbox",
            "file:///etc/passwd",
            "not a url at all",
            "//example.com/protocol-relative",
        ];
        for (const link of bad) {
            await expect(
                asA.mutation(api.ResearchLinks.addLink, { cardId, link }),
            ).rejects.toThrow("Only obsidian://, http:// and https:// links are allowed");
        }
        await expect(
            asA.mutation(api.ResearchLinks.addLink, { cardId, link: "   " }),
        ).rejects.toThrow("must not be empty");
        await expect(
            asA.mutation(api.ResearchLinks.addLink, {
                cardId,
                link: "https://example.com/" + "x".repeat(2000),
            }),
        ).rejects.toThrow("at most 2000");
    });
});

describe("task-scoped links", () => {
    test("addLink with taskId attaches to a task; getLinks stays card-level only", async () => {
        const { asA, cardId } = await setup();
        const taskId = await asA.mutation(api.Tasks.addTask, {
            cardId,
            taskDescription: "t",
            priority: 1,
        });
        await asA.mutation(api.ResearchLinks.addLink, {
            cardId,
            taskId,
            link: "https://example.com/task",
        });
        await asA.mutation(api.ResearchLinks.addLink, {
            cardId,
            link: "https://example.com/card",
        });

        const cardLinks = await asA.query(api.ResearchLinks.getLinks, { cardId });
        expect(cardLinks.map((l) => l.link)).toEqual(["https://example.com/card"]);

        const taskLinks = await asA.query(api.ResearchLinks.getTaskLinks, { taskId });
        expect(taskLinks.map((l) => l.link)).toEqual(["https://example.com/task"]);
    });

    test("addLink rejects a taskId belonging to a different card", async () => {
        const { asA, cardId } = await setup();
        const otherCardId = await asA.mutation(api.Cards.addCard, {
            title: "other",
            description: "",
            phase: "Research",
        });
        const foreignTaskId = await asA.mutation(api.Tasks.addTask, {
            cardId: otherCardId,
            taskDescription: "t",
            priority: 1,
        });
        await expect(
            asA.mutation(api.ResearchLinks.addLink, {
                cardId,
                taskId: foreignTaskId,
                link: "https://example.com",
            }),
        ).rejects.toThrow("Not found");
    });

    test("addLink rejects a taskId owned by another user", async () => {
        const { asA, asB, cardId } = await setup();
        const bCardId = await asB.mutation(api.Cards.addCard, {
            title: "b",
            description: "",
            phase: "Research",
        });
        const bTaskId = await asB.mutation(api.Tasks.addTask, {
            cardId: bCardId,
            taskDescription: "t",
            priority: 1,
        });
        await expect(
            asA.mutation(api.ResearchLinks.addLink, {
                cardId,
                taskId: bTaskId,
                link: "https://example.com",
            }),
        ).rejects.toThrow("Not found");
    });
});

describe("removeLink", () => {
    test("owner can remove their link", async () => {
        const { asA, cardId } = await setup();
        const linkId = await asA.mutation(api.ResearchLinks.addLink, {
            cardId,
            link: "https://example.com",
        });
        await asA.mutation(api.ResearchLinks.removeLink, { id: linkId });
        expect(await asA.query(api.ResearchLinks.getLinks, { cardId })).toHaveLength(0);
    });
});
