import { query, mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { requireOwnedCard, requireOwnedLink } from "./helpers";

const LINK_MAX = 2000;
const ALLOWED_SCHEMES = new Set(["obsidian:", "http:", "https:"]);
const SCHEME_ERROR = "Only obsidian://, http:// and https:// links are allowed";

function validateLink(link: string): string {
    const trimmed = link.trim();
    if (trimmed.length === 0) {
        throw new ConvexError("Link must not be empty");
    }
    if (trimmed.length > LINK_MAX) {
        throw new ConvexError(`Link must be at most ${LINK_MAX} characters`);
    }
    let parsed: URL;
    try {
        parsed = new URL(trimmed);
    } catch {
        throw new ConvexError(SCHEME_ERROR);
    }
    if (!ALLOWED_SCHEMES.has(parsed.protocol.toLowerCase())) {
        throw new ConvexError(SCHEME_ERROR);
    }
    return trimmed;
}

export const getLinks = query({
    args: { cardId: v.id("Cards") },
    handler: async (ctx, args) => {
        await requireOwnedCard(ctx, args.cardId);
        return await ctx.db
            .query("ResearchLinks")
            .withIndex("by_card", (q) => q.eq("cardId", args.cardId))
            .collect();
    },
});

export const addLink = mutation({
    args: { cardId: v.id("Cards"), link: v.string() },
    handler: async (ctx, args) => {
        const card = await requireOwnedCard(ctx, args.cardId);
        return await ctx.db.insert("ResearchLinks", {
            link: validateLink(args.link),
            cardId: args.cardId,
            userId: card.userId,
        });
    },
});

export const removeLink = mutation({
    args: { id: v.id("ResearchLinks") },
    handler: async (ctx, args) => {
        await requireOwnedLink(ctx, args.id);
        await ctx.db.delete(args.id);
    },
});
