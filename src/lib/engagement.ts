/*
 * Client-side mirror of the engagement engine defined in
 * `src/convex/helpers.ts` (XP curve, achievements catalog, theme unlocks).
 * The server is the source of truth for every award; this file exists only
 * so the UI can render progress/labels without round-tripping computation.
 * Keep these tables in sync with `plans/01-api-contract.md` and
 * `src/convex/helpers.ts` if either changes.
 */
import type { FunctionReturnType } from "convex/server";
import { api } from "../convex/_generated/api";
import { localDayKey } from "./dayKey";

export type Profile = FunctionReturnType<typeof api.Profile.getProfile>;
export type ActivityEvent = FunctionReturnType<typeof api.Profile.getActivity>[number];

/** Cumulative XP thresholds (index = level-1) for L1..L10. */
export const XP_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200];
const XP_PER_LEVEL_BEYOND_TABLE = 800;

/** Mirrors `computeLevel` in `src/convex/helpers.ts`. */
export function computeLevel(xp: number): number {
  const lastThreshold = XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
  if (xp < lastThreshold) {
    let level = 1;
    for (let i = 1; i < XP_THRESHOLDS.length; i++) {
      if (xp >= XP_THRESHOLDS[i]) level = i + 1;
    }
    return level;
  }
  const extra = xp - lastThreshold;
  return XP_THRESHOLDS.length + Math.floor(extra / XP_PER_LEVEL_BEYOND_TABLE);
}

/** Cumulative xp required to reach `level` (level 1 == 0). */
export function xpForLevel(level: number): number {
  if (level <= XP_THRESHOLDS.length) {
    return XP_THRESHOLDS[Math.max(0, level - 1)];
  }
  const extraLevels = level - XP_THRESHOLDS.length;
  return XP_THRESHOLDS[XP_THRESHOLDS.length - 1] + extraLevels * XP_PER_LEVEL_BEYOND_TABLE;
}

export type LevelProgress = {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  xpRemaining: number;
  pct: number; // 0..100
};

/** XP-bar math: how far into the current level, and how much is left. */
export function levelProgress(xp: number): LevelProgress {
  const level = computeLevel(xp);
  const floor = xpForLevel(level);
  const ceiling = xpForLevel(level + 1);
  const span = Math.max(1, ceiling - floor);
  const xpIntoLevel = Math.max(0, xp - floor);
  const pct = Math.min(100, Math.round((xpIntoLevel / span) * 100));
  return {
    level,
    xpIntoLevel,
    xpForNextLevel: span,
    xpRemaining: Math.max(0, ceiling - xp),
    pct,
  };
}

export type AchievementDef = {
  id: string;
  name: string;
  condition: string;
  reward: number;
  theme?: string;
};

/** Mirrors the achievements catalog in `plans/01-api-contract.md`. */
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_task", name: "First Blood", condition: "Complete your first task", reward: 20 },
  {
    id: "first_ship",
    name: "Shipped It",
    condition: "Ship your first project",
    reward: 30,
    theme: "arc-reactor",
  },
  { id: "streak_3", name: "On a Roll", condition: "3-day streak", reward: 25 },
  {
    id: "streak_7",
    name: "Locked In",
    condition: "7-day streak",
    reward: 50,
    theme: "phosphor",
  },
  { id: "streak_30", name: "Momentum", condition: "30-day streak", reward: 150 },
  { id: "five_in_day", name: "Productive", condition: "Complete 5 tasks in one day", reward: 40 },
  { id: "portfolio_5", name: "Portfolio", condition: "Create 5 projects", reward: 30 },
  { id: "finisher_10", name: "Finisher", condition: "Ship 10 projects", reward: 100 },
  {
    id: "remix_unlocked",
    name: "Master Builder",
    condition: "Unlock all three reward themes",
    reward: 0,
  },
];

/** Derives remix-mode access from server-owned profile fields (no extra round-trip). */
export function canRemix(profile: { achievements: string[] }): boolean {
  return profile.achievements.includes("remix_unlocked");
}

export type ThemeUnlockDef = {
  id: string;
  condition: string;
};

/** Mirrors the theme unlock table in `plans/01-api-contract.md`. */
export const THEME_UNLOCKS: ThemeUnlockDef[] = [
  { id: "arc-reactor", condition: "Reach Level 3, or earn Shipped It" },
  { id: "command", condition: "Reach Level 5" },
  { id: "phosphor", condition: "Reach Level 7, or earn Locked In" },
];

// ---------------------------------------------------------------------------
// Celebration diffing: compares two `getProfile` snapshots and returns the
// events that should be queued and played sequentially. Pure + DB-free so it
// is unit-testable without mounting the hook.
// ---------------------------------------------------------------------------

export type CelebrationEvent =
  | { kind: "level_up"; level: number }
  | { kind: "achievement"; id: string }
  | { kind: "theme_unlock"; themeId: string };

// ---------------------------------------------------------------------------
// HQ console analytics: bucket `getActivity` events for the heatmap and the
// weekly velocity chart. Both are pure functions of (events, today) so they
// can be unit-tested without a clock dependency.
// ---------------------------------------------------------------------------

export type HeatmapDay = { dayKey: string; count: number };

/** Flat, oldest-to-newest list of the last `weeks * 7` local days with their event counts. */
export function buildHeatmap(
  events: Pick<ActivityEvent, "dayKey">[],
  weeks: number,
  today: Date = new Date()
): HeatmapDay[] {
  const counts = new Map<string, number>();
  for (const e of events) counts.set(e.dayKey, (counts.get(e.dayKey) ?? 0) + 1);

  const days = weeks * 7;
  const result: HeatmapDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = localDayKey(d);
    result.push({ dayKey: key, count: counts.get(key) ?? 0 });
  }
  return result;
}

export type WeekVelocity = { weekStart: string; tasksCompleted: number; projectsShipped: number };

/** Oldest-to-newest weekly buckets (7-day windows ending today) of tasks completed / projects shipped. */
export function buildWeeklyVelocity(
  events: Pick<ActivityEvent, "dayKey" | "type">[],
  weeks: number,
  today: Date = new Date()
): WeekVelocity[] {
  const buckets: WeekVelocity[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const end = new Date(today);
    end.setDate(end.getDate() - w * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const startKey = localDayKey(start);
    const endKey = localDayKey(end);

    let tasksCompleted = 0;
    let projectsShipped = 0;
    for (const e of events) {
      if (e.dayKey >= startKey && e.dayKey <= endKey) {
        if (e.type === "task_completed") tasksCompleted += 1;
        if (e.type === "card_shipped") projectsShipped += 1;
      }
    }
    buckets.push({ weekStart: startKey, tasksCompleted, projectsShipped });
  }
  return buckets;
}

export function diffProfiles(prev: Profile, next: Profile): CelebrationEvent[] {
  const events: CelebrationEvent[] = [];
  for (let lvl = prev.level + 1; lvl <= next.level; lvl++) {
    events.push({ kind: "level_up", level: lvl });
  }
  for (const id of next.achievements) {
    if (!prev.achievements.includes(id)) events.push({ kind: "achievement", id });
  }
  for (const id of next.unlockedThemes) {
    if (!prev.unlockedThemes.includes(id)) events.push({ kind: "theme_unlock", themeId: id });
  }
  return events;
}
