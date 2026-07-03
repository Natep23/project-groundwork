import { query, mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { applyEngagement, DAY_KEY_RE, dayKeyFromTs, requireUser } from "./helpers";

const ACTIVITY_LOOKBACK_DAYS = 90;
const ACTIVITY_LIMIT = 1000;

export const getProfile = query({
    args: {},
    handler: async (ctx) => {
        const userId = await requireUser(ctx);
        const profile = await ctx.db
            .query("UserProfile")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .unique();
        if (profile !== null) {
            return profile;
        }
        // Synthesized default: no doc exists yet, and this read never writes one.
        return {
            userId,
            xp: 0,
            level: 1,
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDay: undefined as string | undefined,
            unlockedThemes: [] as string[],
            achievements: [] as string[],
            totalTasksCompleted: 0,
            totalProjectsCreated: 0,
            totalProjectsShipped: 0,
        };
    },
});

export const recordDailyVisit = mutation({
    args: { dayKey: v.string() },
    handler: async (ctx, args) => {
        const userId = await requireUser(ctx);
        if (!DAY_KEY_RE.test(args.dayKey)) {
            throw new ConvexError("dayKey must match YYYY-MM-DD");
        }
        const dayKey = args.dayKey;
        const todayEvents = await ctx.db
            .query("Events")
            .withIndex("by_user_day", (q) => q.eq("userId", userId).eq("dayKey", dayKey))
            .collect();
        const alreadyVisitedToday = todayEvents.some((event) => event.type === "daily_visit");
        if (alreadyVisitedToday) {
            // Idempotent: same dayKey called twice is a strict noop.
            return;
        }
        await applyEngagement(ctx, userId, {
            xpDelta: 15,
            dayKey,
            event: { type: "daily_visit" },
        });
    },
});

export const getActivity = query({
    args: { sinceDayKey: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const userId = await requireUser(ctx);
        const sinceDayKey =
            args.sinceDayKey ??
            dayKeyFromTs(Date.now() - ACTIVITY_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
        const events = await ctx.db
            .query("Events")
            .withIndex("by_user_day", (q) =>
                q.eq("userId", userId).gte("dayKey", sinceDayKey),
            )
            .order("desc")
            .take(ACTIVITY_LIMIT);
        return events;
    },
});
