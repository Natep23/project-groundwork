import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    Cards: defineTable({
        title: v.string(),
        description: v.string(),
        color: v.optional(v.string()),
        phase: v.string(),
    }),
    Tasks: defineTable({
        taskDescription: v.string(),
        cardId: v.id("Cards"),
        priority: v.number(),
        order: v.number(),
        Draggable: v.boolean(),
    }),
    ResearchLinks: defineTable({
        link: v.string(),
        cardId: v.id("Cards"),
    }),
});
