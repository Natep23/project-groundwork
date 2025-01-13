import {query, mutation} from "./_generated/server";
import {v} from "convex/values";

export const getTasks = query({
    args: {cardId: v.id("Cards")},
    handler: async ({db}, {cardId}) => {
        return await db.query("Tasks").filter(q => q.eq(q.field("cardId"), cardId)).collect();
    }
})

export const addTask = mutation({
    args: {taskDescription: v.string(), cardId: v.id("Cards"), priority: v.number(), order: v.number()},
    handler: async ({db}, {taskDescription, cardId, priority, order}) => {
        return await db.insert("Tasks", {taskDescription, cardId, priority, order, Draggable: true});
    }
})

export const removeTask = mutation({
    args: {id: v.id("Tasks")},
    handler: async ({db}, {id}) => {
        return await db.delete(id);
    }
})

export const updateTaskOrder = mutation({
    args: {id: v.id("Tasks"), order: v.number()},
    handler: async ({db}, {id, order}) => {
        return await db.patch(id, {order});
    }
})