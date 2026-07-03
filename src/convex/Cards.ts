import { query, mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { phaseValidator } from "./schema";
import { requireOwnedCard, requireUser } from "./helpers";

const TITLE_MAX = 200;
const DESCRIPTION_MAX = 2000;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function validateTitle(title: string): string {
    const trimmed = title.trim();
    if (trimmed.length === 0) {
        throw new ConvexError("Title must not be empty");
    }
    if (trimmed.length > TITLE_MAX) {
        throw new ConvexError(`Title must be at most ${TITLE_MAX} characters`);
    }
    return trimmed;
}

function validateDescription(description: string): string {
    if (description.length > DESCRIPTION_MAX) {
        throw new ConvexError(`Description must be at most ${DESCRIPTION_MAX} characters`);
    }
    return description;
}

function validateColor(color: string): string {
    if (!COLOR_RE.test(color)) {
        throw new ConvexError("Color must be a hex color like #a1b2c3");
    }
    return color;
}

export const getBoard = query({
    args: {},
    handler: async (ctx) => {
        const userId = await requireUser(ctx);
        const cards = await ctx.db
            .query("Cards")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
        return await Promise.all(
            cards.map(async (card) => {
                const tasks = await ctx.db
                    .query("Tasks")
                    .withIndex("by_card", (q) => q.eq("cardId", card._id))
                    .collect();
                return {
                    ...card,
                    taskCount: tasks.length,
                    doneCount: tasks.filter((task) => task.done).length,
                };
            }),
        );
    },
});

export const getCardById = query({
    // Accepts any string so a malformed URL id resolves to null instead of a
    // validator error that would crash the client's reactive query.
    args: { id: v.string() },
    handler: async (ctx, args) => {
        const userId = await requireUser(ctx);
        const id = ctx.db.normalizeId("Cards", args.id);
        if (id === null) {
            return null;
        }
        const card = await ctx.db.get(id);
        if (card === null || card.userId !== userId) {
            return null;
        }
        return card;
    },
});

export const addCard = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        color: v.optional(v.string()),
        phase: phaseValidator,
    },
    handler: async (ctx, args) => {
        const userId = await requireUser(ctx);
        return await ctx.db.insert("Cards", {
            title: validateTitle(args.title),
            description: validateDescription(args.description),
            ...(args.color !== undefined ? { color: validateColor(args.color) } : {}),
            phase: args.phase,
            userId,
        });
    },
});

export const updateCard = mutation({
    args: {
        id: v.id("Cards"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        color: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireOwnedCard(ctx, args.id);
        await ctx.db.patch(args.id, {
            ...(args.title !== undefined ? { title: validateTitle(args.title) } : {}),
            ...(args.description !== undefined
                ? { description: validateDescription(args.description) }
                : {}),
            ...(args.color !== undefined ? { color: validateColor(args.color) } : {}),
        });
    },
});

export const changePhase = mutation({
    args: { id: v.id("Cards"), phase: phaseValidator },
    handler: async (ctx, args) => {
        await requireOwnedCard(ctx, args.id);
        await ctx.db.patch(args.id, { phase: args.phase });
    },
});

export const removeCard = mutation({
    args: { id: v.id("Cards") },
    handler: async (ctx, args) => {
        await requireOwnedCard(ctx, args.id);
        const tasks = await ctx.db
            .query("Tasks")
            .withIndex("by_card", (q) => q.eq("cardId", args.id))
            .collect();
        for (const task of tasks) {
            await ctx.db.delete(task._id);
        }
        const links = await ctx.db
            .query("ResearchLinks")
            .withIndex("by_card", (q) => q.eq("cardId", args.id))
            .collect();
        for (const link of links) {
            await ctx.db.delete(link._id);
        }
        await ctx.db.delete(args.id);
    },
});
