import {query, mutation} from "./_generated/server";
import {v} from "convex/values";


export const getLinks = query({
    args: {cardId: v.id("Cards")},
    handler: async ({db}, {cardId}) => {
        return await db.query("ResearchLinks").filter(q => q.eq(q.field("cardId"), cardId)).collect();
    }
})

export const addLink = mutation({
    args: {link: v.string(), cardId: v.id("Cards")},
    handler: async ({db}, {link, cardId}) => {
        return await db.insert("ResearchLinks", {link, cardId});
    }
})

export const removeLink = mutation({
    args: {id: v.id("ResearchLinks")},
    handler: async ({db}, {id}) => {
        return await db.delete(id);
    }
})