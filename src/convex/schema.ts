import { defineSchema, defineTable } from "convex/server";
import { v, Infer } from "convex/values";

export const phaseValidator = v.union(
    v.literal("Research"),
    v.literal("In Progress"),
    v.literal("Completed"),
);
export type Phase = Infer<typeof phaseValidator>;

export const priorityValidator = v.union(v.literal(1), v.literal(2), v.literal(3));

export const eventTypeValidator = v.union(
    v.literal("task_completed"),
    v.literal("task_added"),
    v.literal("card_created"),
    v.literal("card_shipped"),
    v.literal("level_up"),
    v.literal("achievement"),
    v.literal("daily_visit"),
);
export type EventType = Infer<typeof eventTypeValidator>;

export default defineSchema({
    Cards: defineTable({
        title: v.string(),
        description: v.string(),
        color: v.optional(v.string()),
        phase: phaseValidator,
        userId: v.string(),
        order: v.optional(v.number()),
        everShipped: v.optional(v.boolean()),
        shippedAt: v.optional(v.number()),
    })
        .index("by_user", ["userId"])
        .index("by_user_phase", ["userId", "phase"]),
    Tasks: defineTable({
        taskDescription: v.string(),
        cardId: v.id("Cards"),
        priority: priorityValidator,
        order: v.number(),
        done: v.boolean(),
        userId: v.string(),
        completedAt: v.optional(v.number()),
        everCompleted: v.optional(v.boolean()),
    })
        .index("by_card", ["cardId"])
        .index("by_user", ["userId"]),
    ResearchLinks: defineTable({
        link: v.string(),
        cardId: v.id("Cards"),
        userId: v.string(),
        taskId: v.optional(v.id("Tasks")),
    })
        .index("by_card", ["cardId"])
        .index("by_user", ["userId"])
        .index("by_task", ["taskId"]),
    UserProfile: defineTable({
        userId: v.string(),
        xp: v.number(),
        level: v.number(),
        currentStreak: v.number(),
        longestStreak: v.number(),
        lastActiveDay: v.optional(v.string()),
        unlockedThemes: v.array(v.string()),
        achievements: v.array(v.string()),
        totalTasksCompleted: v.number(),
        totalProjectsCreated: v.number(),
        totalProjectsShipped: v.number(),
    }).index("by_user", ["userId"]),
    Events: defineTable({
        userId: v.string(),
        type: eventTypeValidator,
        ts: v.number(),
        dayKey: v.string(),
        meta: v.optional(
            v.object({
                label: v.optional(v.string()),
                cardId: v.optional(v.string()),
                taskId: v.optional(v.string()),
            }),
        ),
    })
        .index("by_user", ["userId"])
        .index("by_user_day", ["userId", "dayKey"]),
});
