import { describe, it, expect } from "vitest";
import { computeLevel, xpForLevel, levelProgress, XP_THRESHOLDS } from "../../lib/engagement";

describe("computeLevel", () => {
  it("is level 1 at 0 xp", () => {
    expect(computeLevel(0)).toBe(1);
  });

  it("matches each table threshold exactly", () => {
    XP_THRESHOLDS.forEach((threshold, i) => {
      expect(computeLevel(threshold)).toBe(i + 1);
    });
  });

  it("stays at the lower level just below a threshold", () => {
    expect(computeLevel(XP_THRESHOLDS[1] - 1)).toBe(1);
    expect(computeLevel(XP_THRESHOLDS[2] - 1)).toBe(2);
  });

  it("adds a level every +800xp beyond the table", () => {
    const lastThreshold = XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
    const lastLevel = XP_THRESHOLDS.length;
    expect(computeLevel(lastThreshold + 800)).toBe(lastLevel + 1);
    expect(computeLevel(lastThreshold + 1599)).toBe(lastLevel + 1);
    expect(computeLevel(lastThreshold + 1600)).toBe(lastLevel + 2);
  });
});

describe("xpForLevel / levelProgress", () => {
  it("xpForLevel(1) is 0 and matches the table for in-range levels", () => {
    expect(xpForLevel(1)).toBe(0);
    XP_THRESHOLDS.forEach((threshold, i) => {
      expect(xpForLevel(i + 1)).toBe(threshold);
    });
  });

  it("computes 0% progress right at a level floor", () => {
    const progress = levelProgress(XP_THRESHOLDS[2]);
    expect(progress.level).toBe(3);
    expect(progress.xpIntoLevel).toBe(0);
    expect(progress.pct).toBe(0);
  });

  it("computes partial progress toward the next level", () => {
    // Level 2 spans [100, 250) -> 150xp wide. 175 is 75 in, 50% through.
    const progress = levelProgress(175);
    expect(progress.level).toBe(2);
    expect(progress.xpIntoLevel).toBe(75);
    expect(progress.xpForNextLevel).toBe(150);
    expect(progress.pct).toBe(50);
    expect(progress.xpRemaining).toBe(75);
  });

  it("computes progress beyond the table using the flat +800 span", () => {
    const lastThreshold = XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
    const progress = levelProgress(lastThreshold + 400);
    // Still level 10 (the table's last level) until a full +800 is earned;
    // the level only increments once that span is complete.
    expect(progress.level).toBe(XP_THRESHOLDS.length);
    expect(progress.xpIntoLevel).toBe(400);
    expect(progress.xpForNextLevel).toBe(800);
    expect(progress.pct).toBe(50);
  });

  it("increments the level once a full +800 span beyond the table is earned", () => {
    const lastThreshold = XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
    const progress = levelProgress(lastThreshold + 800);
    expect(progress.level).toBe(XP_THRESHOLDS.length + 1);
    expect(progress.xpIntoLevel).toBe(0);
    expect(progress.pct).toBe(0);
  });
});
