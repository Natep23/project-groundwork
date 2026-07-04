import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// HQConsole only reads api.Profile.getActivity; stub it out so the
// component renders without a live Convex client.
vi.mock("convex/react", () => ({
  useQuery: () => [] as unknown[],
}));

import { HQConsole } from "../../components/HQConsole";
import { ThemeProvider } from "../../lib/theme";
import { KitScope } from "../../lib/themeKit";
import type { Profile } from "../../lib/engagement";

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

describe("HQConsole signature set-pieces (p3-04)", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-kit");
  });

  it("default kit (free theme) still renders the linear XP bar via Progress, unchanged", () => {
    render(
      <ThemeProvider>
        <HQConsole open profile={makeProfile()} onClose={vi.fn()} />
      </ThemeProvider>
    );
    const bar = screen.getByRole("progressbar");
    expect(bar.className).toContain("progress--default");
    expect(bar.className).toContain("hq__xp-track");
    expect(bar.className).not.toMatch(/progress--(arc-reactor|command|phosphor)/);
    expect(document.querySelector(".progress__dial")).toBeNull();
    expect(document.querySelector(".hq__reactor-label")).toBeNull();
  });

  it("arc-reactor kit renders the reactor dial in place of the linear bar, with the ARC REACTOR label", () => {
    render(
      <ThemeProvider>
        <KitScope kit="arc-reactor">
          <HQConsole open profile={makeProfile()} onClose={vi.fn()} />
        </KitScope>
      </ThemeProvider>
    );
    const bar = screen.getByRole("progressbar");
    expect(bar.className).toContain("progress--arc-reactor");
    expect(document.querySelector(".progress__dial")).not.toBeNull();
    const label = document.querySelector(".hq__reactor-label");
    expect(label).not.toBeNull();
    expect(label).toHaveAttribute("aria-hidden", "true");
    expect(label?.textContent).toMatch(/Arc reactor/i);
    expect(label?.textContent).toMatch(/%/);
  });

  it("keeps the progressbar's accessible name identical across kits", () => {
    const profile = makeProfile();
    const { unmount } = render(
      <ThemeProvider>
        <HQConsole open profile={profile} onClose={vi.fn()} />
      </ThemeProvider>
    );
    const defaultLabel = screen.getByRole("progressbar").getAttribute("aria-label");
    unmount();

    render(
      <ThemeProvider>
        <KitScope kit="arc-reactor">
          <HQConsole open profile={profile} onClose={vi.fn()} />
        </KitScope>
      </ThemeProvider>
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-label", defaultLabel ?? "");
  });
});
