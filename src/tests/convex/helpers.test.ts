import { describe, expect, test } from "vitest";
import { computeLevel, dayDiff, dayKeyFromTs } from "../../convex/helpers";

describe("computeLevel", () => {
    test("matches the threshold table boundaries", () => {
        expect(computeLevel(0)).toBe(1);
        expect(computeLevel(99)).toBe(1);
        expect(computeLevel(100)).toBe(2);
        expect(computeLevel(249)).toBe(2);
        expect(computeLevel(250)).toBe(3);
        expect(computeLevel(449)).toBe(3);
        expect(computeLevel(450)).toBe(4);
        expect(computeLevel(699)).toBe(4);
        expect(computeLevel(700)).toBe(5);
        expect(computeLevel(999)).toBe(5);
        expect(computeLevel(1000)).toBe(6);
        expect(computeLevel(1399)).toBe(6);
        expect(computeLevel(1400)).toBe(7);
        expect(computeLevel(1899)).toBe(7);
        expect(computeLevel(1900)).toBe(8);
        expect(computeLevel(2499)).toBe(8);
        expect(computeLevel(2500)).toBe(9);
        expect(computeLevel(3199)).toBe(9);
        expect(computeLevel(3200)).toBe(10);
    });

    test("extends past the table at +800 xp per level", () => {
        expect(computeLevel(3999)).toBe(10);
        expect(computeLevel(4000)).toBe(11);
        expect(computeLevel(4799)).toBe(11);
        expect(computeLevel(4800)).toBe(12);
    });
});

describe("dayKeyFromTs", () => {
    test("formats a timestamp as a UTC YYYY-MM-DD dayKey", () => {
        expect(dayKeyFromTs(Date.UTC(2026, 6, 3, 23, 59))).toBe("2026-07-03");
        expect(dayKeyFromTs(Date.UTC(2026, 0, 1))).toBe("2026-01-01");
    });
});

describe("dayDiff", () => {
    test("computes calendar-day differences", () => {
        expect(dayDiff("2026-07-03", "2026-07-03")).toBe(0);
        expect(dayDiff("2026-07-04", "2026-07-03")).toBe(1);
        expect(dayDiff("2026-07-10", "2026-07-03")).toBe(7);
        expect(dayDiff("2026-07-02", "2026-07-03")).toBe(-1);
        expect(dayDiff("2026-08-01", "2026-07-31")).toBe(1);
    });
});
