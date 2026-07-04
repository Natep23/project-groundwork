import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { ModalShell } from "./Modals";
import { FlameIcon, LockIcon, TrophyIcon } from "./icons";
import { Loader } from "./Loader";
import { Progress } from "./Progress";
import { SectionHeading } from "./Typewriter";
import { useThemeKit } from "../lib/themeKit";
import {
  ACHIEVEMENTS,
  buildHeatmap,
  buildWeeklyVelocity,
  levelProgress,
  type Profile,
} from "../lib/engagement";

const HEATMAP_WEEKS = 12;
const VELOCITY_WEEKS = 8;

function heatLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

export type HQConsoleProps = {
  open: boolean;
  profile: Profile;
  onClose: () => void;
};

/**
 * The HQ console: a slide-over (reuses `ModalShell`'s focus trap / Escape /
 * scrim semantics) showing level progress, streaks, the achievements grid,
 * a ~12-week activity heatmap, and weekly velocity.
 */
export function HQConsole({ open, profile, onClose }: HQConsoleProps) {
  // Server defaults `sinceDayKey` to today-90d, which comfortably covers the
  // 12-week heatmap and 8-week velocity window this panel renders.
  const activity = useQuery(api.Profile.getActivity, open ? {} : "skip");
  const kit = useThemeKit();

  if (!open) return null;

  const progress = levelProgress(profile.xp);
  const heatmap = activity ? buildHeatmap(activity, HEATMAP_WEEKS) : [];
  const velocity = activity ? buildWeeklyVelocity(activity, VELOCITY_WEEKS) : [];
  const maxVelocity = Math.max(1, ...velocity.map((w) => w.tasksCompleted + w.projectsShipped));

  // Chunk the flat oldest->newest day list into 7-day columns for the grid.
  const heatColumns: typeof heatmap[] = [];
  for (let i = 0; i < heatmap.length; i += 7) heatColumns.push(heatmap.slice(i, i + 7));

  return (
    <ModalShell title="HQ Console" onClose={onClose} variant="slideover">
      <div className="hq">
        <section className="hq__section" aria-label="Level and XP">
          <div className="hq__level-row">
            <span className="hq__level-badge">L{progress.level}</span>
            <div className="hq__level-detail">
              {kit === "arc-reactor" && (
                <span className="hq__reactor-label mono" aria-hidden="true">
                  Arc reactor — {progress.pct}%
                </span>
              )}
              <Progress
                value={progress.pct}
                max={100}
                label={`${progress.xpIntoLevel} of ${progress.xpForNextLevel} XP to level ${progress.level + 1}`}
                trackClassName="briefing__xp-track hq__xp-track"
                fillClassName="briefing__xp-fill"
              />
              <span className="mono hq__xp-label">
                {progress.xpIntoLevel}/{progress.xpForNextLevel} XP to Level {progress.level + 1}
              </span>
            </div>
          </div>
        </section>

        <section className="hq__section hq__streaks" aria-label="Streaks">
          <div className="hq__stat">
            <FlameIcon className={profile.currentStreak > 0 ? "briefing__flame briefing__flame--lit" : "briefing__flame"} />
            <span className="hq__stat-value">{profile.currentStreak}</span>
            <span className="hq__stat-label">Current streak</span>
          </div>
          <div className="hq__stat">
            <TrophyIcon className="hq__stat-icon" />
            <span className="hq__stat-value">{profile.longestStreak}</span>
            <span className="hq__stat-label">Longest streak</span>
          </div>
        </section>

        <section className="hq__section" aria-label="Achievements">
          <SectionHeading className="hq__section-title">Achievements</SectionHeading>
          <ul className="hq__achievements">
            {ACHIEVEMENTS.map((ach) => {
              const earned = profile.achievements.includes(ach.id);
              return (
                <li
                  key={ach.id}
                  className={earned ? "hq__achievement hq__achievement--earned" : "hq__achievement hq__achievement--locked"}
                  title={earned ? ach.name : ach.condition}
                >
                  {earned ? <TrophyIcon aria-hidden="true" /> : <LockIcon aria-hidden="true" />}
                  <span className="hq__achievement-name">{ach.name}</span>
                  <span className="hq__achievement-condition mono">
                    {earned ? `+${ach.reward} xp` : ach.condition}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="hq__section" aria-label="Activity heatmap">
          <SectionHeading className="hq__section-title">{`Activity (last ${HEATMAP_WEEKS} weeks)`}</SectionHeading>
          {activity === undefined ? (
            <Loader as="p" className="mono hq__loading" label="Loading…" />
          ) : (
            <div className="hq__heatmap" role="img" aria-label={`Activity heatmap for the last ${HEATMAP_WEEKS} weeks`}>
              {heatColumns.map((col, i) => (
                <div className="hq__heatmap-col" key={i}>
                  {col.map((day) => (
                    <span
                      key={day.dayKey}
                      className={`hq__heatmap-cell hq__heatmap-cell--${heatLevel(day.count)}`}
                      title={`${day.dayKey}: ${day.count} event${day.count === 1 ? "" : "s"}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="hq__section" aria-label="Weekly velocity">
          <SectionHeading className="hq__section-title">Weekly velocity</SectionHeading>
          {activity === undefined ? (
            <Loader as="p" className="mono hq__loading" label="Loading…" />
          ) : (
            <div className="hq__velocity">
              {velocity.map((w) => (
                <div className="hq__velocity-col" key={w.weekStart} title={`Week of ${w.weekStart}`}>
                  <div className="hq__velocity-bars">
                    <span
                      className="hq__velocity-bar hq__velocity-bar--tasks"
                      style={{ height: `${(w.tasksCompleted / maxVelocity) * 100}%` }}
                    />
                    <span
                      className="hq__velocity-bar hq__velocity-bar--ships"
                      style={{ height: `${(w.projectsShipped / maxVelocity) * 100}%` }}
                    />
                  </div>
                  <span className="hq__velocity-total mono">{w.tasksCompleted + w.projectsShipped}</span>
                </div>
              ))}
            </div>
          )}
          <div className="hq__legend mono">
            <span><span className="hq__legend-swatch hq__legend-swatch--tasks" /> tasks completed</span>
            <span><span className="hq__legend-swatch hq__legend-swatch--ships" /> projects shipped</span>
          </div>
        </section>
      </div>
    </ModalShell>
  );
}
