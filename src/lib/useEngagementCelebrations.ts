import React from "react";
import type { CelebrationEvent, Profile } from "./engagement";
import { diffProfiles } from "./engagement";

/**
 * Diffs successive `getProfile` snapshots and queues the celebration events
 * they imply (level-up, achievement, theme unlock), playing them one at a
 * time. Meant to be mounted exactly once, at App level inside
 * `<Authenticated>` — most XP is awarded from CardScreen/CreateCardScreen,
 * so a screen-local snapshot would unmount mid-award and miss deltas.
 *
 * The FIRST non-undefined profile only primes the reference snapshot; it
 * never fires (otherwise every sign-in would replay a lifetime of
 * already-earned achievements). A React StrictMode double-render replays
 * this effect, but priming is idempotent (same profile in, same profile
 * out) so it's harmless.
 */
export function useEngagementCelebrations(profile: Profile | undefined) {
  const prevRef = React.useRef<Profile | undefined>(undefined);
  const primedRef = React.useRef(false);
  const [queue, setQueue] = React.useState<CelebrationEvent[]>([]);

  React.useEffect(() => {
    if (profile === undefined) return;

    if (!primedRef.current) {
      primedRef.current = true;
      prevRef.current = profile;
      return;
    }

    const prev = prevRef.current;
    prevRef.current = profile;
    if (!prev) return;

    const events = diffProfiles(prev, profile);
    if (events.length > 0) {
      setQueue((q) => [...q, ...events]);
    }
  }, [profile]);

  const current = queue[0] ?? null;
  const dismiss = React.useCallback(() => setQueue((q) => q.slice(1)), []);

  return { current, queueLength: queue.length, dismiss };
}
