import { ConvexError } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/server";

/**
 * Requires a signed-in user. Returns the Clerk user id (JWT `subject`),
 * which is stored as `userId` on every document.
 */
export async function requireUser(ctx: QueryCtx | MutationCtx): Promise<string> {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
        throw new ConvexError("Not signed in");
    }
    return identity.subject;
}

/**
 * Requires a signed-in user who owns the given card. Throws
 * ConvexError("Not found") for missing or non-owned cards so we
 * don't leak whether the card exists.
 */
export async function requireOwnedCard(
    ctx: QueryCtx | MutationCtx,
    cardId: Id<"Cards">,
): Promise<Doc<"Cards">> {
    const userId = await requireUser(ctx);
    const card = await ctx.db.get(cardId);
    if (card === null || card.userId !== userId) {
        throw new ConvexError("Not found");
    }
    return card;
}

/** Same ownership check as {@link requireOwnedCard}, for a task. */
export async function requireOwnedTask(
    ctx: QueryCtx | MutationCtx,
    taskId: Id<"Tasks">,
): Promise<Doc<"Tasks">> {
    const userId = await requireUser(ctx);
    const task = await ctx.db.get(taskId);
    if (task === null || task.userId !== userId) {
        throw new ConvexError("Not found");
    }
    return task;
}

/** Same ownership check as {@link requireOwnedCard}, for a research link. */
export async function requireOwnedLink(
    ctx: QueryCtx | MutationCtx,
    linkId: Id<"ResearchLinks">,
): Promise<Doc<"ResearchLinks">> {
    const userId = await requireUser(ctx);
    const link = await ctx.db.get(linkId);
    if (link === null || link.userId !== userId) {
        throw new ConvexError("Not found");
    }
    return link;
}
