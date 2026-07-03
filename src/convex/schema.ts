import { defineSchema, defineTable } from "convex/server";
import { v, Infer } from "convex/values";

export const phaseValidator = v.union(
    v.literal("Research"),
    v.literal("In Progress"),
    v.literal("Completed"),
);
export type Phase = Infer<typeof phaseValidator>;

export const priorityValidator = v.union(v.literal(1), v.literal(2), v.literal(3));

export default defineSchema({
    Cards: defineTable({
        title: v.string(),
        description: v.string(),
        color: v.optional(v.string()),
        phase: phaseValidator,
        userId: v.string(),
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
    })
        .index("by_card", ["cardId"])
        .index("by_user", ["userId"]),
    ResearchLinks: defineTable({
        link: v.string(),
        cardId: v.id("Cards"),
        userId: v.string(),
    })
        .index("by_card", ["cardId"])
        .index("by_user", ["userId"]),
});
