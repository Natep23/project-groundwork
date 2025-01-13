import {query, mutation} from "./_generated/server";
import {v} from "convex/values";


export const getDevCards = query({
    handler: async (ctx) => {
        return await ctx.db
        .query("Cards")
        .filter(q => q.eq(q.field("phase"), "In Progress"))
        .order("asc")
        .collect();
    }
})

export const getResearchCards = query({
    handler: async (ctx) => {
        return await ctx.db
        .query("Cards")
        .filter(q => q.eq(q.field("phase"), "Research"))
        .order("asc")
        .collect();
    }
})

export const getCompletedCards = query({
    handler: async (ctx) => {
        return await ctx.db
        .query("Cards")
        .filter(q => q.eq(q.field("phase"), "Completed"))
        .order("asc")
        .collect();
    }
})

export const getCard = query({
    args: {title: v.string()},
    handler: async (ctx, args) => {
        return await ctx.db.query("Cards").filter(q => q.eq(q.field("title"), args.title)).first();
    }
})

export const addCard = mutation({
    args: {title: v.string(), description: v.string(), color: v.optional(v.string()), phase: v.string()},
    handler: async (ctx, args) => {
        await ctx.db.insert("Cards", args);
    }
})

export const removeCard = mutation({
    args:{id: v.id("Cards")},
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
        console.log(args.id + " deleted");   
    }
})

export const getCardDetails = query({
    args: {id: v.id("Cards")},
    handler: async (ctx, args) => {
        const cardDetails : string[] = await ctx.db.get(args.id).then(card => 
            [
                card?.title ?? "Title not found", 
                card?.description ?? "Description not found",
            ]);
        return cardDetails;
    }
})

export const changePhase = mutation({
    args: {id: v.id("Cards"), phase: v.string()},
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {phase: args.phase});
    }
})

