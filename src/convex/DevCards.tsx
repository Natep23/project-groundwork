import {query, mutation} from "./_generated/server";
import {v} from "convex/values";

export const getDevCards = query({
    handler: async (ctx) => {
        const devProjectList = await ctx.db
        .query("Development")
        .order("asc")
        .collect()

        return devProjectList
    }
})

export const getCardId = query({
    handler: async (ctx) => {
        const selectedCard = await ctx.db
        .query("Development")
        .filter(q => q.eq(q.field("_id"), q.field("_id")))
        .first() 

        return selectedCard
}})

export const addCard = mutation({
    args: {title: v.string(), description: v.string(), color: v.optional(v.string()), phase: v.string()},
    handler: async (ctx, args) => {
        await ctx.db.insert("Development", args);
    }
})


export const setPreviousPhase = mutation({
    args: { id: v.id("Development"), previousPhase: v.string()},
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {previousPhase: args.previousPhase});
    }
})

export const removeCard = mutation({
    args:{id: v.id("Development")},
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    }
})
