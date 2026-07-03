import type { Profile } from "../lib/engagement";
import { levelProgress } from "../lib/engagement";
import { FlameIcon } from "./icons";
import type { BoardCard } from "./card";

function greeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export type BriefingBarProps = {
  profile: Profile;
  board: BoardCard[];
  onOpenHQ: () => void;
};

/**
 * The dashboard's top-of-plan status line: greeting, streak, level/XP, and a
 * one-line brief on what's outstanding. Reads as an invitation rather than a
 * blank on a brand-new, level-1, no-history profile.
 */
export function BriefingBar({ profile, board, onOpenHQ }: BriefingBarProps) {
  const progress = levelProgress(profile.xp);
  const tasksNeedingAttention = board
    .filter((card) => card.phase !== "Completed")
    .reduce((sum, card) => sum + Math.max(0, card.taskCount - card.doneCount), 0);
  const projectsActive = board.filter((card) => card.phase !== "Completed").length;

  const isFirstRun =
    profile.level === 1 && profile.xp === 0 && profile.lastActiveDay === undefined && board.length === 0;

  return (
    <section className="briefing" aria-label="Daily briefing">
      <div className="briefing__row">
        <div className="briefing__greeting">
          <span className="eyebrow">Briefing</span>
          <h2 className="briefing__headline">
            {greeting(new Date())}. {isFirstRun ? "Standing by for your first card." : "Systems nominal."}
          </h2>
        </div>

        <div className="briefing__streak" title={`Longest streak: ${profile.longestStreak} days`}>
          <FlameIcon
            className={profile.currentStreak > 0 ? "briefing__flame briefing__flame--lit" : "briefing__flame"}
          />
          <span className="briefing__streak-value">
            {profile.currentStreak} day{profile.currentStreak === 1 ? "" : "s"}
          </span>
        </div>

        <button type="button" className="briefing__level" onClick={onOpenHQ}>
          <span className="briefing__level-label">Level {progress.level}</span>
          <span
            className="briefing__xp-track"
            role="progressbar"
            aria-valuenow={progress.pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${progress.xpIntoLevel} of ${progress.xpForNextLevel} XP to level ${progress.level + 1}`}
          >
            <span className="briefing__xp-fill" style={{ width: `${progress.pct}%` }} />
          </span>
          <span className="briefing__xp-label mono">
            {progress.xpIntoLevel}/{progress.xpForNextLevel} XP
          </span>
        </button>
      </div>

      <p className="briefing__status mono">
        {isFirstRun ? (
          "No projects on the board yet — create one to start logging progress."
        ) : (
          <>
            {tasksNeedingAttention} task{tasksNeedingAttention === 1 ? "" : "s"}{" "}
            {tasksNeedingAttention === 1 ? "needs" : "need"} attention ·{" "}
            {projectsActive} project{projectsActive === 1 ? "" : "s"} active
          </>
        )}
      </p>
    </section>
  );
}
