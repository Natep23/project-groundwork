import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BriefingBar, type BriefingBarProps } from "../../components/BriefingBar";
import { ThemeProvider } from "../../lib/theme";
import type { Profile } from "../../lib/engagement";
import type { BoardCard } from "../../components/card";

// BriefingBar's XP bar renders <Progress>, which reads the active kit via
// `useThemeKit()` — that needs a `ThemeProvider` ancestor (see themeKit.tsx).
function renderBriefingBar(props: BriefingBarProps) {
  return render(
    <ThemeProvider>
      <BriefingBar {...props} />
    </ThemeProvider>
  );
}

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

function makeCard(overrides: Partial<BoardCard>): BoardCard {
  return {
    _id: "card_1" as BoardCard["_id"],
    _creationTime: 0,
    title: "Card",
    description: "",
    color: undefined,
    phase: "Research",
    userId: "user_1",
    order: 0,
    everShipped: false,
    shippedAt: undefined,
    taskCount: 0,
    doneCount: 0,
    ...overrides,
  } as BoardCard;
}

describe("BriefingBar", () => {
  it("reads as an invitation on a brand-new, level-1, no-history profile", () => {
    renderBriefingBar({ profile: makeProfile(), board: [], onOpenHQ: vi.fn() });
    expect(screen.getByText(/standing by for your first card/i)).toBeInTheDocument();
    expect(screen.getByText(/no projects on the board yet/i)).toBeInTheDocument();
    expect(screen.getByText("Level 1")).toBeInTheDocument();
  });

  it("reports streak, level, and outstanding work from real data", () => {
    // xp=300 falls in level 3's span ([250, 450)) so the displayed level
    // (derived from xp via the curve) matches the stored `level` field.
    const profile = makeProfile({ level: 3, xp: 300, currentStreak: 5, longestStreak: 12 });
    const board = [
      makeCard({ _id: "c1" as BoardCard["_id"], phase: "Research", taskCount: 4, doneCount: 1 }),
      makeCard({ _id: "c2" as BoardCard["_id"], phase: "In Progress", taskCount: 2, doneCount: 2 }),
      makeCard({ _id: "c3" as BoardCard["_id"], phase: "Completed", taskCount: 5, doneCount: 5 }),
    ];
    renderBriefingBar({ profile, board, onOpenHQ: vi.fn() });

    expect(screen.getByText("5 days")).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.textContent === "Level 3")).toBeInTheDocument();
    // 3 outstanding tasks on the Research card, none from Completed; 2 active (non-Completed) projects.
    expect(screen.getByText(/3 tasks need attention/i)).toBeInTheDocument();
    expect(screen.getByText(/2 projects active/i)).toBeInTheDocument();
  });

  it("singularizes streak and counts at exactly one", () => {
    const profile = makeProfile({ currentStreak: 1 });
    const board = [makeCard({ phase: "Research", taskCount: 1, doneCount: 0 })];
    renderBriefingBar({ profile, board, onOpenHQ: vi.fn() });
    expect(screen.getByText("1 day")).toBeInTheDocument();
    expect(screen.getByText(/1 task needs attention/i)).toBeInTheDocument();
    expect(screen.getByText(/1 project active/i)).toBeInTheDocument();
  });
});
