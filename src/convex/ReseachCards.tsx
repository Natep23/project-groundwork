import {query, mutation} from "./_generated/server";
import {v} from "convex/values";

export const getResearchCards = query({
    handler: async (ctx) => {
        const devProjectList = await ctx.db
        .query("Research")
        .order("asc")
        .collect()

        return devProjectList
    }
})

export const addCard = mutation({
    args: {title: v.string(), description: v.string(), color: v.optional(v.string()), phase: v.string()},
    handler: async (ctx, args) => {
        await ctx.db.insert("Research", args);
    }
})

export const setPreviousPhase = mutation({
    args: { id: v.id("Research"), previousPhase: v.string()},
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {previousPhase: args.previousPhase});
    }
})

export const removeCard = mutation({
    args:{id: v.id("Research")},
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
        
    }
})