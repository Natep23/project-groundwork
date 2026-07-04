import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// HQConsole only reads api.Profile.getActivity; stub it out so the
// component renders without a live Convex client.
vi.mock("convex/react", () => ({
  useQuery: () => [] as unknown[],
}));

import { HQConsole } from "../../components/HQConsole";
import { ThemeProvider } from "../../lib/theme";
import { ACHIEVEMENTS, type Profile } from "../../lib/engagement";

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    userId: "user_1",
    xp: 500,
    level: 3,
    currentStreak: 4,
    longestStreak: 9,
    lastActiveDay: "2026-07-03",
    unlockedThemes: ["arc-reactor"],
    achievements: ["first_task", "streak_3"],
    totalTasksCompleted: 6,
    totalProjectsCreated: 2,
    totalProjectsShipped: 1,
    ...overrides,
  } as Profile;
}

describe("HQConsole achievements grid", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-kit");
  });

  it("renders one entry per catalog achievement, earned and locked distinguished", () => {
    const profile = makeProfile();
    render(
      <ThemeProvider>
        <HQConsole open profile={profile} onClose={vi.fn()} />
      </ThemeProvider>
    );

    for (const ach of ACHIEVEMENTS) {
      const name = screen.getByText(ach.name);
      expect(name).toBeInTheDocument();
      const row = name.closest("li");
      expect(row).not.toBeNull();
      const earned = profile.achievements.includes(ach.id);
      if (earned) {
        expect(row).toHaveClass("hq__achievement--earned");
        expect(row?.textContent).toContain(`+${ach.reward} xp`);
      } else {
        expect(row).toHaveClass("hq__achievement--locked");
        expect(row?.textContent).toContain(ach.condition);
      }
    }
  });

  it("renders nothing when closed", () => {
    render(
      <ThemeProvider>
        <HQConsole open={false} profile={makeProfile()} onClose={vi.fn()} />
      </ThemeProvider>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
