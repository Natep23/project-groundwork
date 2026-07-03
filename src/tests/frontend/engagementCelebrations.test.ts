import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { diffProfiles, type Profile } from "../../lib/engagement";
import { useEngagementCelebrations } from "../../lib/useEngagementCelebrations";

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    userId: "user_1",
    xp: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDay: undefined,
    unlockedThemes: [],
    achievements: [],
    totalTasksCompleted: 0,
    totalProjectsCreated: 0,
    totalProjectsShipped: 0,
    ...overrides,
  } as Profile;
}

describe("diffProfiles (pure)", () => {
  it("emits nothing when nothing changed", () => {
    const p = makeProfile({ level: 3 });
    expect(diffProfiles(p, p)).toEqual([]);
  });

  it("emits one level_up event per level crossed", () => {
    const prev = makeProfile({ level: 2 });
    const next = makeProfile({ level: 5 });
    expect(diffProfiles(prev, next)).toEqual([
      { kind: "level_up", level: 3 },
      { kind: "level_up", level: 4 },
      { kind: "level_up", level: 5 },
    ]);
  });

  it("emits achievement events only for newly-earned ids", () => {
    const prev = makeProfile({ achievements: ["first_task"] });
    const next = makeProfile({ achievements: ["first_task", "streak_3"] });
    expect(diffProfiles(prev, next)).toEqual([{ kind: "achievement", id: "streak_3" }]);
  });

  it("emits theme_unlock events only for newly-unlocked themes", () => {
    const prev = makeProfile({ unlockedThemes: [] });
    const next = makeProfile({ unlockedThemes: ["arc-reactor"] });
    expect(diffProfiles(prev, next)).toEqual([{ kind: "theme_unlock", themeId: "arc-reactor" }]);
  });

  it("queues all simultaneous events from a single mutation", () => {
    // e.g. shipping a project can award first_ship (+theme) and a level-up
    // in the very same profile write.
    const prev = makeProfile({ level: 2, achievements: [], unlockedThemes: [] });
    const next = makeProfile({
      level: 3,
      achievements: ["first_ship"],
      unlockedThemes: ["arc-reactor"],
    });
    const events = diffProfiles(prev, next);
    expect(events).toHaveLength(3);
    expect(events).toContainEqual({ kind: "level_up", level: 3 });
    expect(events).toContainEqual({ kind: "achievement", id: "first_ship" });
    expect(events).toContainEqual({ kind: "theme_unlock", themeId: "arc-reactor" });
  });
});

describe("useEngagementCelebrations", () => {
  it("does not fire on the first non-undefined profile (priming)", () => {
    const { result, rerender } = renderHook(
      ({ profile }: { profile: Profile | undefined }) => useEngagementCelebrations(profile),
      { initialProps: { profile: undefined as Profile | undefined } }
    );
    expect(result.current.current).toBeNull();

    const alreadyLeveled = makeProfile({ level: 4, achievements: ["first_task"] });
    act(() => rerender({ profile: alreadyLeveled }));
    // Even though this "first" profile already has level 4 and an
    // achievement, it must not replay them as celebrations.
    expect(result.current.current).toBeNull();
  });

  it("fires and queues on a real delta after priming, and dismiss advances the queue", () => {
    const { result, rerender } = renderHook(
      ({ profile }: { profile: Profile | undefined }) => useEngagementCelebrations(profile),
      { initialProps: { profile: undefined as Profile | undefined } }
    );

    const initial = makeProfile({ level: 1, xp: 0 });
    act(() => rerender({ profile: initial }));
    expect(result.current.current).toBeNull();

    const leveledAndShipped = makeProfile({
      level: 2,
      xp: 150,
      achievements: ["first_ship"],
      unlockedThemes: ["arc-reactor"],
    });
    act(() => rerender({ profile: leveledAndShipped }));

    expect(result.current.queueLength).toBe(3);
    const first = result.current.current;
    expect(first).not.toBeNull();

    act(() => result.current.dismiss());
    expect(result.current.queueLength).toBe(2);
    expect(result.current.current).not.toEqual(first);
  });

  it("does not re-fire when the profile object is unchanged in content but re-rendered", () => {
    const { result, rerender } = renderHook(
      ({ profile }: { profile: Profile | undefined }) => useEngagementCelebrations(profile),
      { initialProps: { profile: undefined as Profile | undefined } }
    );
    const p1 = makeProfile({ level: 2 });
    act(() => rerender({ profile: p1 }));
    const p2 = makeProfile({ level: 2 }); // same values, new object identity
    act(() => rerender({ profile: p2 }));
    expect(result.current.current).toBeNull();
  });
});
