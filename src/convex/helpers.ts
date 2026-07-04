import { ConvexError } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/server";
import { EventType } from "./schema";

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

// ---------------------------------------------------------------------------
// Engagement engine: XP, levels, streaks, achievements, theme unlocks.
// ---------------------------------------------------------------------------

/**
 * Cumulative XP thresholds (index = level-1) for L1..L10. Beyond the table,
 * each additional level adds +800 xp.
 */
export const XP_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200];
const XP_PER_LEVEL_BEYOND_TABLE = 800;

export const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Pure, DB-free: derives the level for a given total xp. */
export function computeLevel(xp: number): number {
    const lastThreshold = XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
    if (xp < lastThreshold) {
        let level = 1;
        for (let i = 1; i < XP_THRESHOLDS.length; i++) {
            if (xp >= XP_THRESHOLDS[i]) {
                level = i + 1;
            }
        }
        return level;
    }
    const extra = xp - lastThreshold;
    return XP_THRESHOLDS.length + Math.floor(extra / XP_PER_LEVEL_BEYOND_TABLE);
}

/** Pure, DB-free: derives a "YYYY-MM-DD" UTC dayKey from an epoch ms timestamp. */
export function dayKeyFromTs(ts: number): string {
    const d = new Date(ts);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function parseDayKeyToEpochDay(dayKey: string): number {
    const [y, m, d] = dayKey.split("-").map(Number);
    return Date.UTC(y, m - 1, d) / 86_400_000;
}

/**
 * Pure, DB-free: calendar-day difference `a - b` between two "YYYY-MM-DD"
 * dayKeys (e.g. dayDiff("2026-07-04", "2026-07-03") === 1).
 */
export function dayDiff(a: string, b: string): number {
    return parseDayKeyToEpochDay(a) - parseDayKeyToEpochDay(b);
}

/**
 * A client-supplied dayKey is trusted only for its format. A malformed value
 * falls back to the server's UTC day so it can never pollute the Events
 * heatmap or corrupt the `by_user_day` lexicographic range query. Per the
 * app's single-user threat model (advisor-confirmed), a validly-formatted but
 * inaccurate local day is left as-is — forging it only skews your own stats,
 * and the backwards-day noop already blocks accidental streak resets.
 */
export function sanitizeDayKey(dayKey: string): string {
    return DAY_KEY_RE.test(dayKey) ? dayKey : dayKeyFromTs(Date.now());
}

async function getOrCreateProfile(
    ctx: MutationCtx,
    userId: string,
): Promise<Doc<"UserProfile">> {
    const existing = await ctx.db
        .query("UserProfile")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();
    if (existing !== null) {
        return existing;
    }
    const id = await ctx.db.insert("UserProfile", {
        userId,
        xp: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        unlockedThemes: [],
        achievements: [],
        totalTasksCompleted: 0,
        totalProjectsCreated: 0,
        totalProjectsShipped: 0,
    });
    const created = await ctx.db.get(id);
    if (created === null) {
        throw new ConvexError("Failed to create profile");
    }
    return created;
}

type EngagementEventMeta = {
    label?: string;
    cardId?: string;
    taskId?: string;
};

export type EngagementEvent = {
    type: EventType;
    meta?: EngagementEventMeta;
};

const ACHIEVEMENTS: Record<string, { reward: number; theme?: string }> = {
    first_task: { reward: 20 },
    first_ship: { reward: 30, theme: "arc-reactor" },
    streak_3: { reward: 25 },
    streak_7: { reward: 50, theme: "phosphor" },
    streak_30: { reward: 150 },
    five_in_day: { reward: 40 },
    portfolio_5: { reward: 30 },
    finisher_10: { reward: 100 },
    // 0 xp: this achievement is itself the gate for remix mode, and giving it
    // 0 xp avoids a second computeLevel recompute after the level-gated theme
    // unlocks below (see the ordering note in applyEngagement).
    remix_unlocked: { reward: 0 },
};

/** The three unlockable (non-free) themes; remix mode requires all three. */
const REMIX_THEMES = ["arc-reactor", "command", "phosphor"];

/**
 * The single mutation path that owns the engagement engine: get-or-creates
 * the profile, applies xp, computes level-ups (emitting `level_up` and
 * unlocking level-gated themes), advances the streak, appends the caller's
 * event, and evaluates/grants achievements (stacking their xp + theme
 * rewards in the same write). Called by every action mutation and by
 * `recordDailyVisit`.
 */
export async function applyEngagement(
    ctx: MutationCtx,
    userId: string,
    { xpDelta, dayKey: rawDayKey, event }: { xpDelta: number; dayKey: string; event: EngagementEvent },
): Promise<void> {
    const profile = await getOrCreateProfile(ctx, userId);
    const ts = Date.now();
    // A malformed client dayKey falls back to the server day so it can't
    // pollute the Events heatmap / by_user_day range index.
    const dayKey = sanitizeDayKey(rawDayKey);

    let xp = profile.xp + xpDelta;
    let totalTasksCompleted = profile.totalTasksCompleted;
    let totalProjectsCreated = profile.totalProjectsCreated;
    let totalProjectsShipped = profile.totalProjectsShipped;
    if (event.type === "task_completed") totalTasksCompleted += 1;
    if (event.type === "card_created") totalProjectsCreated += 1;
    if (event.type === "card_shipped") totalProjectsShipped += 1;

    // Streak advancement: newer dayKey advances (consecutive = +1, gap =
    // reset to 1); dayKey <= lastActiveDay (same day, or backwards/skewed
    // clock) is a same-day noop.
    let currentStreak = profile.currentStreak;
    let lastActiveDay = profile.lastActiveDay;
    if (lastActiveDay === undefined) {
        currentStreak = 1;
        lastActiveDay = dayKey;
    } else {
        const diff = dayDiff(dayKey, lastActiveDay);
        if (diff === 1) {
            currentStreak += 1;
            lastActiveDay = dayKey;
        } else if (diff > 1) {
            currentStreak = 1;
            lastActiveDay = dayKey;
        }
        // diff <= 0: same-day or backwards dayKey -> noop.
    }
    const longestStreak = Math.max(profile.longestStreak, currentStreak);

    const achievements = new Set(profile.achievements);
    const unlockedThemes = new Set(profile.unlockedThemes);

    // Insert the caller's event first so `five_in_day`'s same-day count
    // includes it (count-after-insert, per the contract's off-by-one note).
    await ctx.db.insert("Events", { userId, type: event.type, ts, dayKey, meta: event.meta });

    const candidates: string[] = [];
    if (event.type === "task_completed" && totalTasksCompleted === 1) {
        candidates.push("first_task");
    }
    if (event.type === "task_completed") {
        const todayEvents = await ctx.db
            .query("Events")
            .withIndex("by_user_day", (q) => q.eq("userId", userId).eq("dayKey", dayKey))
            .collect();
        const completedToday = todayEvents.filter((e) => e.type === "task_completed").length;
        if (completedToday === 5) {
            candidates.push("five_in_day");
        }
    }
    if (event.type === "card_shipped" && totalProjectsShipped === 1) {
        candidates.push("first_ship");
    }
    if (event.type === "card_shipped" && totalProjectsShipped === 10) {
        candidates.push("finisher_10");
    }
    if (event.type === "card_created" && totalProjectsCreated === 5) {
        candidates.push("portfolio_5");
    }
    if (currentStreak === 3) candidates.push("streak_3");
    if (currentStreak === 7) candidates.push("streak_7");
    if (currentStreak === 30) candidates.push("streak_30");

    for (const id of candidates) {
        if (achievements.has(id)) continue;
        const def = ACHIEVEMENTS[id];
        achievements.add(id);
        xp += def.reward;
        if (def.theme !== undefined) unlockedThemes.add(def.theme);
        await ctx.db.insert("Events", {
            userId,
            type: "achievement",
            ts,
            dayKey,
            meta: { label: id },
        });
    }

    const oldLevel = profile.level;
    const newLevel = computeLevel(xp);
    if (newLevel > oldLevel) {
        await ctx.db.insert("Events", {
            userId,
            type: "level_up",
            ts,
            dayKey,
            meta: { label: String(newLevel) },
        });
    }
    if (newLevel >= 3) unlockedThemes.add("arc-reactor");
    if (newLevel >= 5) unlockedThemes.add("command");
    if (newLevel >= 7) unlockedThemes.add("phosphor");

    // Evaluated AFTER the level-gated unlocks above (not with the other
    // achievement candidates, which run before computeLevel): the third
    // theme can unlock via a level-up in this very call, so checking here
    // is the only way to catch that same-call transition. Reward is 0 xp,
    // so no second level recompute is needed.
    if (
        !achievements.has("remix_unlocked") &&
        REMIX_THEMES.every((theme) => unlockedThemes.has(theme))
    ) {
        achievements.add("remix_unlocked");
        await ctx.db.insert("Events", {
            userId,
            type: "achievement",
            ts,
            dayKey,
            meta: { label: "remix_unlocked" },
        });
    }

    await ctx.db.patch(profile._id, {
        xp,
        level: newLevel,
        currentStreak,
        longestStreak,
        lastActiveDay,
        totalTasksCompleted,
        totalProjectsCreated,
        totalProjectsShipped,
        unlockedThemes: Array.from(unlockedThemes),
        achievements: Array.from(achievements),
    });
}
