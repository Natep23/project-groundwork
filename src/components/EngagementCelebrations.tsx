import React from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useEngagementCelebrations } from "../lib/useEngagementCelebrations";
import { useEngagementVisuals } from "../lib/engagementTheme";
import { XIcon } from "./icons";

const AUTO_DISMISS_MS = 4200;

/**
 * Mounted exactly once at App level, inside `<Authenticated>`. Watches
 * `getProfile` and plays a queued celebration (level-up / achievement /
 * theme-unlock) whenever the profile changes in a way that implies one —
 * see `useEngagementCelebrations` for the diffing/priming rules. A screen
 * can't own this because most XP is awarded from CardScreen/CreateCardScreen
 * and would unmount before the celebration fires.
 */
export function EngagementCelebrations() {
  const profile = useQuery(api.Profile.getProfile);
  const { current, dismiss } = useEngagementCelebrations(profile);
  const visuals = useEngagementVisuals();

  React.useEffect(() => {
    if (!current) return;
    const timer = window.setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [current, dismiss]);

  if (!current) return null;

  return (
    <div className="celebration-stack" role="status" aria-live="polite">
      <div className={["celebration", visuals.className?.(current)].filter(Boolean).join(" ")}>
        <span className="celebration__icon" aria-hidden="true">
          {visuals.icon(current)}
        </span>
        <span className="celebration__title">{visuals.title(current)}</span>
        <button
          type="button"
          className="celebration__dismiss"
          aria-label="Dismiss celebration"
          onClick={dismiss}
        >
          <XIcon />
        </button>
      </div>
    </div>
  );
}
