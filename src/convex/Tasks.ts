import { query, mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { priorityValidator } from "./schema";
import { requireOwnedCard, requireOwnedTask } from "./helpers";

const TASK_MAX = 500;

function validateTaskDescription(taskDescription: string): string {
    const trimmed = taskDescription.trim();
    if (trimmed.length === 0) {
        throw new ConvexError("Task description must not be empty");
    }
    if (trimmed.length > TASK_MAX) {
        throw new ConvexError(`Task description must be at most ${TASK_MAX} characters`);
    }
    return trimmed;
}

export const getTasks = query({
    args: { cardId: v.id("Cards") },
    handler: async (ctx, args) => {
        await requireOwnedCard(ctx, args.cardId);
        const tasks = await ctx.db
            .query("Tasks")
            .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
            .collect();
        return tasks.sort((a, b) => a.order - b.order);
    },
});

export const addTask = mutation({
    args: {
        cardId: v.id("Cards"),
        taskDescription: v.string(),
        priority: priorityValidator,
    },
    handler: async (ctx, args) => {
        const card = await requireOwnedCard(ctx, args.cardId);
        const existing = await ctx.db
            .query("Tasks")
            .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
            .collect();
        const maxOrder = existing.reduce((max, task) => Math.max(max, task.order), 0);
        return await ctx.db.insert("Tasks", {
            taskDescription: validateTaskDescription(args.taskDescription),
            cardId: args.cardId,
            priority: args.priority,
            order: maxOrder + 1,
            done: false,
            userId: card.userId,
        });
    },
});

export const setDone = mutation({
    args: { id: v.id("Tasks"), done: v.boolean() },
    handler: async (ctx, args) => {
        await requireOwnedTask(ctx, args.id);
        await ctx.db.patch(args.id, { done: args.done });
    },
});

export const updateTask = mutation({
    args: {
        id: v.id("Tasks"),
        taskDescription: v.optional(v.string()),
        priority: v.optional(priorityValidator),
    },
    handler: async (ctx, args) => {
        await requireOwnedTask(ctx, args.id);
        await ctx.db.patch(args.id, {
            ...(args.taskDescription !== undefined
                ? { taskDescription: validateTaskDescription(args.taskDescription) }
                : {}),
            ...(args.priority !== undefined ? { priority: args.priority } : {}),
        });
    },
});

export const setOrder = mutation({
    args: {
        updates: v.array(v.object({ id: v.id("Tasks"), order: v.number() })),
    },
    handler: async (ctx, args) => {
        for (const update of args.updates) {
            await requireOwnedTask(ctx, update.id);
        }
        for (const update of args.updates) {
            await ctx.db.patch(update.id, { order: update.order });
        }
    },
});

export const removeTask = mutation({
    args: { id: v.id("Tasks") },
    handler: async (ctx, args) => {
        await requireOwnedTask(ctx, args.id);
        await ctx.db.delete(args.id);
    },
});
