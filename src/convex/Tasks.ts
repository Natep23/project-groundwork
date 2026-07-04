import { query, mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { priorityValidator } from "./schema";
import {
    applyEngagement,
    assertCardNotLocked,
    dayKeyFromTs,
    requireOwnedCard,
    requireOwnedTask,
} from "./helpers";
import { Doc } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

/** Loads a task's parent card and asserts it isn't a locked Completed card. */
async function assertParentCardNotLocked(
    ctx: QueryCtx | MutationCtx,
    task: Doc<"Tasks">,
): Promise<void> {
    const card = await ctx.db.get(task.cardId);
    if (card === null) {
        throw new ConvexError("Not found");
    }
    assertCardNotLocked(card);
}

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
        dayKey: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const card = await requireOwnedCard(ctx, args.cardId);
        assertCardNotLocked(card);
        const existing = await ctx.db
            .query("Tasks")
            .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
            .collect();
        const maxOrder = existing.reduce((max, task) => Math.max(max, task.order), 0);
        const ts = Date.now();
        const dayKey = args.dayKey ?? dayKeyFromTs(ts);
        const id = await ctx.db.insert("Tasks", {
            taskDescription: validateTaskDescription(args.taskDescription),
            cardId: args.cardId,
            priority: args.priority,
            order: maxOrder + 1,
            done: false,
            userId: card.userId,
        });
        await applyEngagement(ctx, card.userId, {
            xpDelta: 0,
            dayKey,
            event: { type: "task_added", meta: { cardId: args.cardId, taskId: id } },
        });
        return id;
    },
});

export const setDone = mutation({
    args: { id: v.id("Tasks"), done: v.boolean(), dayKey: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const task = await requireOwnedTask(ctx, args.id);
        await assertParentCardNotLocked(ctx, task);
        const ts = Date.now();
        if (args.done) {
            const firstCompletion = !task.everCompleted;
            await ctx.db.patch(args.id, {
                done: true,
                completedAt: ts,
                ...(firstCompletion ? { everCompleted: true } : {}),
            });
            if (firstCompletion) {
                const dayKey = args.dayKey ?? dayKeyFromTs(ts);
                await applyEngagement(ctx, task.userId, {
                    xpDelta: 10,
                    dayKey,
                    event: { type: "task_completed", meta: { cardId: task.cardId, taskId: task._id } },
                });
            }
        } else {
            await ctx.db.patch(args.id, { done: false, completedAt: undefined });
        }
    },
});

export const updateTask = mutation({
    args: {
        id: v.id("Tasks"),
        taskDescription: v.optional(v.string()),
        priority: v.optional(priorityValidator),
    },
    handler: async (ctx, args) => {
        const task = await requireOwnedTask(ctx, args.id);
        await assertParentCardNotLocked(ctx, task);
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
            const task = await requireOwnedTask(ctx, update.id);
            await assertParentCardNotLocked(ctx, task);
        }
        for (const update of args.updates) {
            await ctx.db.patch(update.id, { order: update.order });
        }
    },
});

export const removeTask = mutation({
    args: { id: v.id("Tasks") },
    handler: async (ctx, args) => {
        const task = await requireOwnedTask(ctx, args.id);
        await assertParentCardNotLocked(ctx, task);
        const links = await ctx.db
            .query("ResearchLinks")
            .withIndex("by_task", (q) => q.eq("taskId", args.id))
            .collect();
        for (const link of links) {
            await ctx.db.delete(link._id);
        }
        await ctx.db.delete(args.id);
    },
});
