// @vitest-environment edge-runtime
import { describe, expect, test } from "vitest";
import { convexTest } from "convex-test";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";
import { applyEngagement } from "../../convex/helpers";

const modules = import.meta.glob([
    "../../convex/**/*.{js,ts}",
    "!../../convex/**/*.d.ts",
]);

function setup() {
    const t = convexTest(schema, modules);
    const asA = t.withIdentity({ subject: "user_a" });
    const asB = t.withIdentity({ subject: "user_b" });
    return { t, asA, asB };
}

async function addCard(asA: ReturnType<typeof setup>["asA"], dayKey?: string, phase: "Research" | "In Progress" | "Completed" = "Research") {
    return await asA.mutation(api.Cards.addCard, {
        title: "c",
        description: "",
        phase,
        ...(dayKey !== undefined ? { dayKey } : {}),
    });
}

describe("task completion XP anti-farm", () => {
    test("completing a task awards +10 once; un-done -> re-done does not re-award", async () => {
        const { asA } = setup();
        const cardId = await addCard(asA, "2026-01-01");
        const taskId = await asA.mutation(api.Tasks.addTask, {
            cardId,
            taskDescription: "t",
            priority: 1,
            dayKey: "2026-01-01",
        });

        await asA.mutation(api.Tasks.setDone, { id: taskId, done: true, dayKey: "2026-01-01" });
        let profile = await asA.query(api.Profile.getProfile, {});
        const xpAfterFirstComplete = profile.xp;
        expect(profile.totalTasksCompleted).toBe(1);
        expect(xpAfterFirstComplete).toBeGreaterThanOrEqual(10);

        await asA.mutation(api.Tasks.setDone, { id: taskId, done: false, dayKey: "2026-01-01" });
        await asA.mutation(api.Tasks.setDone, { id: taskId, done: true, dayKey: "2026-01-01" });

        profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.xp).toBe(xpAfterFirstComplete);
        expect(profile.totalTasksCompleted).toBe(1);
    });
});

describe("ship XP anti-farm", () => {
    test("first ship awards +50 once; un-ship -> re-ship does not re-award; counter never decrements", async () => {
        const { asA } = setup();
        const cardId = await addCard(asA, "2026-01-01");

        await asA.mutation(api.Cards.changePhase, {
            id: cardId,
            phase: "Completed",
            dayKey: "2026-01-01",
        });
        let profile = await asA.query(api.Profile.getProfile, {});
        const xpAfterShip = profile.xp;
        expect(profile.totalProjectsShipped).toBe(1);

        // Un-ship then re-ship.
        await asA.mutation(api.Cards.changePhase, {
            id: cardId,
            phase: "Research",
            dayKey: "2026-01-01",
        });
        await asA.mutation(api.Cards.changePhase, {
            id: cardId,
            phase: "Completed",
            dayKey: "2026-01-01",
        });

        profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.xp).toBe(xpAfterShip);
        expect(profile.totalProjectsShipped).toBe(1);
    });

    test("first_ship achievement fires once and unlocks arc-reactor", async () => {
        const { asA } = setup();
        const cardId = await addCard(asA, "2026-01-01");
        await asA.mutation(api.Cards.changePhase, {
            id: cardId,
            phase: "Completed",
            dayKey: "2026-01-01",
        });
        const profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.achievements).toContain("first_ship");
        expect(profile.unlockedThemes).toContain("arc-reactor");
    });

    test("moveCard shares the same ship-award path (atomic phase + order)", async () => {
        const { asA } = setup();
        const cardId = await addCard(asA, "2026-01-01");
        await asA.mutation(api.Cards.moveCard, {
            id: cardId,
            toPhase: "Completed",
            order: 42,
            dayKey: "2026-01-01",
        });
        const card = await asA.query(api.Cards.getCardById, { id: cardId });
        expect(card?.order).toBe(42);
        expect(card?.everShipped).toBe(true);
        const profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.totalProjectsShipped).toBe(1);

        // Re-shipping via moveCard again should not re-award.
        await asA.mutation(api.Cards.changePhase, { id: cardId, phase: "Research" });
        await asA.mutation(api.Cards.moveCard, {
            id: cardId,
            toPhase: "Completed",
            order: 99,
            dayKey: "2026-01-01",
        });
        const profile2 = await asA.query(api.Profile.getProfile, {});
        expect(profile2.totalProjectsShipped).toBe(1);
    });
});

describe("streak advancement", () => {
    test("same-day noop, next-day +1, gap resets to 1, backwards is a noop", async () => {
        const { t, asA } = setup();
        await asA.mutation(api.Profile.recordDailyVisit, { dayKey: "2026-01-01" });
        let profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.currentStreak).toBe(1);

        // Same-day: noop.
        await t.run(async (ctx) => {
            await applyEngagement(ctx, "user_a", {
                xpDelta: 0,
                dayKey: "2026-01-01",
                event: { type: "task_added" },
            });
        });
        profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.currentStreak).toBe(1);

        // Next day: +1.
        await asA.mutation(api.Profile.recordDailyVisit, { dayKey: "2026-01-02" });
        profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.currentStreak).toBe(2);
        expect(profile.longestStreak).toBe(2);

        // Gap (skip a day): reset to 1.
        await asA.mutation(api.Profile.recordDailyVisit, { dayKey: "2026-01-05" });
        profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.currentStreak).toBe(1);
        expect(profile.longestStreak).toBe(2);

        // Backwards dayKey: noop.
        await asA.mutation(api.Profile.recordDailyVisit, { dayKey: "2026-01-04" });
        profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.currentStreak).toBe(1);
        expect(profile.lastActiveDay).toBe("2026-01-05");
    });

    test("an action taken on a new day also advances the streak, not only recordDailyVisit", async () => {
        const { asA } = setup();
        const cardId = await addCard(asA, "2026-01-01");
        let profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.currentStreak).toBe(1);

        await asA.mutation(api.Tasks.addTask, {
            cardId,
            taskDescription: "t",
            priority: 1,
            dayKey: "2026-01-02",
        });
        profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.currentStreak).toBe(2);
    });

    test("streak_3 and streak_7 achievements fire exactly once with rewards", async () => {
        const { asA } = setup();
        const days = [
            "2026-01-01",
            "2026-01-02",
            "2026-01-03",
            "2026-01-04",
            "2026-01-05",
            "2026-01-06",
            "2026-01-07",
        ];
        for (const day of days) {
            await asA.mutation(api.Profile.recordDailyVisit, { dayKey: day });
        }
        const profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.currentStreak).toBe(7);
        expect(profile.achievements).toContain("streak_3");
        expect(profile.achievements).toContain("streak_7");
        expect(profile.unlockedThemes).toContain("phosphor");
        // Each fires exactly once.
        expect(profile.achievements.filter((a) => a === "streak_3")).toHaveLength(1);
        expect(profile.achievements.filter((a) => a === "streak_7")).toHaveLength(1);
    });
});

describe("recordDailyVisit idempotency + validation", () => {
    test("two calls with the same dayKey award daily xp once, one event, streak unchanged", async () => {
        const { asA } = setup();
        await asA.mutation(api.Profile.recordDailyVisit, { dayKey: "2026-01-01" });
        const profileAfterFirst = await asA.query(api.Profile.getProfile, {});

        await asA.mutation(api.Profile.recordDailyVisit, { dayKey: "2026-01-01" });
        const profileAfterSecond = await asA.query(api.Profile.getProfile, {});

        expect(profileAfterSecond.xp).toBe(profileAfterFirst.xp);
        expect(profileAfterSecond.currentStreak).toBe(profileAfterFirst.currentStreak);

        const activity = await asA.query(api.Profile.getActivity, { sinceDayKey: "2020-01-01" });
        const dailyVisits = activity.filter((e) => e.type === "daily_visit");
        expect(dailyVisits).toHaveLength(1);
    });

    test("rejects a malformed dayKey", async () => {
        const { asA } = setup();
        await expect(
            asA.mutation(api.Profile.recordDailyVisit, { dayKey: "01-01-2026" }),
        ).rejects.toThrow();
        await expect(
            asA.mutation(api.Profile.recordDailyVisit, { dayKey: "2026/01/01" }),
        ).rejects.toThrow();
        await expect(
            asA.mutation(api.Profile.recordDailyVisit, { dayKey: "not-a-date" }),
        ).rejects.toThrow();
    });
});

describe("five_in_day off-by-one", () => {
    test("completing the 5th task in a dayKey fires the achievement exactly once", async () => {
        const { asA } = setup();
        const cardId = await addCard(asA, "2026-01-01");
        const taskIds: string[] = [];
        for (let i = 0; i < 6; i++) {
            const taskId = await asA.mutation(api.Tasks.addTask, {
                cardId,
                taskDescription: `t${i}`,
                priority: 1,
                dayKey: "2026-01-01",
            });
            taskIds.push(taskId);
        }

        for (let i = 0; i < 4; i++) {
            await asA.mutation(api.Tasks.setDone, {
                id: taskIds[i] as any,
                done: true,
                dayKey: "2026-01-01",
            });
        }
        let profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.achievements).not.toContain("five_in_day");

        // 5th completion fires it.
        await asA.mutation(api.Tasks.setDone, {
            id: taskIds[4] as any,
            done: true,
            dayKey: "2026-01-01",
        });
        profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.achievements).toContain("five_in_day");
        expect(profile.achievements.filter((a) => a === "five_in_day")).toHaveLength(1);

        // 6th completion doesn't re-fire it.
        await asA.mutation(api.Tasks.setDone, {
            id: taskIds[5] as any,
            done: true,
            dayKey: "2026-01-01",
        });
        profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.achievements.filter((a) => a === "five_in_day")).toHaveLength(1);
    });
});

describe("malformed dayKey is sanitized on the action path", () => {
    test("a malformed dayKey falls back to a valid day and never pollutes Events", async () => {
        const { asA } = setup();
        // Must not throw, and must not write a garbage dayKey the heatmap
        // range query would choke on.
        await addCard(asA, "not-a-date");
        const activity = await asA.query(api.Profile.getActivity, { sinceDayKey: "2000-01-01" });
        expect(activity.length).toBeGreaterThan(0);
        for (const event of activity) {
            expect(event.dayKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
    });
});

describe("first_task achievement", () => {
    test("fires once on the first completed task ever", async () => {
        const { asA } = setup();
        const cardId = await addCard(asA, "2026-01-01");
        const t1 = await asA.mutation(api.Tasks.addTask, {
            cardId,
            taskDescription: "t1",
            priority: 1,
            dayKey: "2026-01-01",
        });
        const t2 = await asA.mutation(api.Tasks.addTask, {
            cardId,
            taskDescription: "t2",
            priority: 1,
            dayKey: "2026-01-01",
        });
        await asA.mutation(api.Tasks.setDone, { id: t1, done: true, dayKey: "2026-01-01" });
        let profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.achievements.filter((a) => a === "first_task")).toHaveLength(1);

        await asA.mutation(api.Tasks.setDone, { id: t2, done: true, dayKey: "2026-01-01" });
        profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.achievements.filter((a) => a === "first_task")).toHaveLength(1);
    });
});

describe("portfolio_5 and finisher_10 achievements", () => {
    test("portfolio_5 fires on the 5th created project", async () => {
        const { asA } = setup();
        for (let i = 0; i < 4; i++) {
            await addCard(asA, "2026-01-01");
        }
        let profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.achievements).not.toContain("portfolio_5");
        await addCard(asA, "2026-01-01");
        profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.achievements).toContain("portfolio_5");
    });

    test("finisher_10 fires on the 10th shipped project", async () => {
        const { asA } = setup();
        const cardIds: string[] = [];
        for (let i = 0; i < 10; i++) {
            cardIds.push(await addCard(asA, "2026-01-01"));
        }
        for (let i = 0; i < 9; i++) {
            await asA.mutation(api.Cards.changePhase, {
                id: cardIds[i] as any,
                phase: "Completed",
                dayKey: "2026-01-01",
            });
        }
        let profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.achievements).not.toContain("finisher_10");
        await asA.mutation(api.Cards.changePhase, {
            id: cardIds[9] as any,
            phase: "Completed",
            dayKey: "2026-01-01",
        });
        profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.achievements).toContain("finisher_10");
    });
});

describe("theme unlocks by level", () => {
    test("reaching L3/L5/L7 adds the right theme ids", async () => {
        const { t, asA } = setup();

        await t.run(async (ctx) => {
            await applyEngagement(ctx, "user_a", {
                xpDelta: 249,
                dayKey: "2026-01-01",
                event: { type: "task_added" },
            });
        });
        let profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.level).toBe(2);
        expect(profile.unlockedThemes).not.toContain("arc-reactor");

        await t.run(async (ctx) => {
            await applyEngagement(ctx, "user_a", {
                xpDelta: 1,
                dayKey: "2026-01-01",
                event: { type: "task_added" },
            });
        });
        profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.level).toBe(3);
        expect(profile.unlockedThemes).toContain("arc-reactor");
        expect(profile.unlockedThemes).not.toContain("command");

        await t.run(async (ctx) => {
            await applyEngagement(ctx, "user_a", {
                xpDelta: 450,
                dayKey: "2026-01-01",
                event: { type: "task_added" },
            });
        });
        profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.level).toBe(5);
        expect(profile.unlockedThemes).toContain("command");
        expect(profile.unlockedThemes).not.toContain("phosphor");

        await t.run(async (ctx) => {
            await applyEngagement(ctx, "user_a", {
                xpDelta: 700,
                dayKey: "2026-01-01",
                event: { type: "task_added" },
            });
        });
        profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.level).toBe(7);
        expect(profile.unlockedThemes).toContain("phosphor");
    });
});

describe("getActivity default window", () => {
    test("defaults to today-90 days and excludes events older than that", async () => {
        const { t, asA } = setup();
        const todayKey = new Date().toISOString().slice(0, 10);
        await asA.mutation(api.Profile.recordDailyVisit, { dayKey: todayKey });
        await t.run(async (ctx) => {
            await ctx.db.insert("Events", {
                userId: "user_a",
                type: "daily_visit",
                ts: 0,
                dayKey: "2000-01-01",
            });
        });

        const activity = await asA.query(api.Profile.getActivity, {});
        expect(activity.some((e) => e.dayKey === todayKey)).toBe(true);
        expect(activity.some((e) => e.dayKey === "2000-01-01")).toBe(false);
    });
});

describe("profile bootstrap", () => {
    test("getProfile returns a synthesized default with no doc and never writes", async () => {
        const { t, asA } = setup();
        const profile = await asA.query(api.Profile.getProfile, {});
        expect(profile).toMatchObject({
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
        await t.run(async (ctx) => {
            const docs = await ctx.db.query("UserProfile").collect();
            expect(docs).toHaveLength(0);
        });
    });

    test("the first recordDailyVisit creates the profile doc", async () => {
        const { t, asA } = setup();
        await asA.mutation(api.Profile.recordDailyVisit, { dayKey: "2026-01-01" });
        await t.run(async (ctx) => {
            const docs = await ctx.db.query("UserProfile").collect();
            expect(docs).toHaveLength(1);
            expect(docs[0].userId).toBe("user_a");
        });
    });
});

describe("remix_unlocked achievement", () => {
    test("not granted with only 2 of 3 themes unlocked", async () => {
        const { asA } = setup();
        // first_ship unlocks arc-reactor; streak_7 unlocks phosphor. That's 2
        // of 3 (missing "command", which requires level 5).
        const cardId = await addCard(asA, "2026-01-01");
        await asA.mutation(api.Cards.changePhase, {
            id: cardId,
            phase: "Completed",
            dayKey: "2026-01-01",
        });
        const days = [
            "2026-01-02",
            "2026-01-03",
            "2026-01-04",
            "2026-01-05",
            "2026-01-06",
            "2026-01-07",
        ];
        for (const day of days) {
            await asA.mutation(api.Profile.recordDailyVisit, { dayKey: day });
        }
        const profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.unlockedThemes).toContain("arc-reactor");
        expect(profile.unlockedThemes).toContain("phosphor");
        expect(profile.unlockedThemes).not.toContain("command");
        expect(profile.achievements).not.toContain("remix_unlocked");
    });

    test("third theme unlocking via a level-up in the same mutation grants remix_unlocked in that call", async () => {
        const { t, asA } = setup();
        // Get arc-reactor and phosphor via level (3 and 7), leaving "command"
        // (level 5) as the only missing theme. Land exactly at level 5 in a
        // single applyEngagement call that also crosses level 3 and 7 is not
        // possible in one monotonic jump without also hitting 5 first, so
        // instead: get to level 6 (arc-reactor + command both present, but
        // NOT phosphor), then a single xp grant that crosses level 7 should
        // unlock phosphor -> all three present -> remix_unlocked granted in
        // that same call.
        await t.run(async (ctx) => {
            await applyEngagement(ctx, "user_a", {
                xpDelta: 1000, // level 6 (threshold 1000 for L6)
                dayKey: "2026-01-01",
                event: { type: "task_added" },
            });
        });
        let profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.level).toBe(6);
        expect(profile.unlockedThemes).toContain("arc-reactor");
        expect(profile.unlockedThemes).toContain("command");
        expect(profile.unlockedThemes).not.toContain("phosphor");
        expect(profile.achievements).not.toContain("remix_unlocked");

        // This single xp grant crosses the level-7 threshold (cumulative
        // 1400), which unlocks phosphor -> all three themes now present ->
        // remix_unlocked must be granted in this SAME mutation call.
        await t.run(async (ctx) => {
            await applyEngagement(ctx, "user_a", {
                xpDelta: 400, // 1000 + 400 = 1400 -> level 7
                dayKey: "2026-01-01",
                event: { type: "task_added" },
            });
        });
        profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.level).toBe(7);
        expect(profile.unlockedThemes).toContain("phosphor");
        expect(profile.achievements).toContain("remix_unlocked");

        const activity = await asA.query(api.Profile.getActivity, { sinceDayKey: "2020-01-01" });
        const remixEvents = activity.filter(
            (e) => e.type === "achievement" && e.meta?.label === "remix_unlocked",
        );
        expect(remixEvents).toHaveLength(1);
    });

    test("granted on the triggering transition; not re-granted on a subsequent mutation", async () => {
        const { t, asA } = setup();
        await t.run(async (ctx) => {
            await applyEngagement(ctx, "user_a", {
                xpDelta: 1400, // level 7: arc-reactor, command, phosphor all unlock
                dayKey: "2026-01-01",
                event: { type: "task_added" },
            });
        });
        let profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.level).toBe(7);
        expect(profile.achievements.filter((a) => a === "remix_unlocked")).toHaveLength(1);

        // A subsequent mutation must not re-grant it.
        await t.run(async (ctx) => {
            await applyEngagement(ctx, "user_a", {
                xpDelta: 10,
                dayKey: "2026-01-01",
                event: { type: "task_added" },
            });
        });
        profile = await asA.query(api.Profile.getProfile, {});
        expect(profile.achievements.filter((a) => a === "remix_unlocked")).toHaveLength(1);
    });

    test("cross-user isolation: one user earning it does not grant it to another", async () => {
        const { t, asA, asB } = setup();
        await t.run(async (ctx) => {
            await applyEngagement(ctx, "user_a", {
                xpDelta: 1400,
                dayKey: "2026-01-01",
                event: { type: "task_added" },
            });
        });
        const profileA = await asA.query(api.Profile.getProfile, {});
        expect(profileA.achievements).toContain("remix_unlocked");

        const profileB = await asB.query(api.Profile.getProfile, {});
        expect(profileB.achievements).not.toContain("remix_unlocked");
        expect(profileB.unlockedThemes).not.toContain("arc-reactor");
    });
});

describe("cross-user isolation", () => {
    test("profiles, events, and achievements never leak across users", async () => {
        const { asA, asB } = setup();
        const cardIdA = await addCard(asA, "2026-01-01");
        await asA.mutation(api.Cards.changePhase, {
            id: cardIdA,
            phase: "Completed",
            dayKey: "2026-01-01",
        });

        const profileA = await asA.query(api.Profile.getProfile, {});
        const profileB = await asB.query(api.Profile.getProfile, {});
        expect(profileA.xp).toBeGreaterThan(0);
        expect(profileB.xp).toBe(0);
        expect(profileB.achievements).toEqual([]);

        const activityA = await asA.query(api.Profile.getActivity, { sinceDayKey: "2020-01-01" });
        const activityB = await asB.query(api.Profile.getActivity, { sinceDayKey: "2020-01-01" });
        expect(activityA.length).toBeGreaterThan(0);
        expect(activityB).toHaveLength(0);
    });

    test("Profile queries/mutations require auth", async () => {
        const { t } = setup();
        await expect(t.query(api.Profile.getProfile, {})).rejects.toThrow("Not signed in");
        await expect(
            t.mutation(api.Profile.recordDailyVisit, { dayKey: "2026-01-01" }),
        ).rejects.toThrow("Not signed in");
        await expect(t.query(api.Profile.getActivity, {})).rejects.toThrow("Not signed in");
    });
});
