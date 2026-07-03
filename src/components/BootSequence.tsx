import React from "react";
import { usePrefersReducedMotion } from "../lib/usePrefersReducedMotion";

const BOOT_LINES = [
  "GROUNDWORK OS // COLD START",
  "MOUNTING PLAN TABLE",
  "SYNCING TASK LEDGER",
  "AWAITING UPLINK",
];

const LINE_INTERVAL_MS = 380;

export type BootSequenceProps = {
  /** Live status text, e.g. "Checking credentials…"; defaults to a generic idle line. */
  statusLabel?: string;
};

/**
 * Cosmetic-only cinematic boot screen. Serves two spots that both render
 * before there's anything real to show: the pre-Clerk-key bootstrap
 * placeholder in `index.tsx` (no ThemeProvider/Router yet — this component
 * must not depend on either) and the `<AuthLoading>` state in `App.tsx`.
 * Never reads authed data (`getProfile` needs auth, and during both of
 * these windows the Clerk round-trip hasn't resolved) — it doesn't know
 * what's unlocked and must not gate on it.
 *
 * Skippable by click or any keypress. Collapses instantly to the resolved
 * state under `prefers-reduced-motion`. All boot lines are rendered from
 * the first paint (visibility toggled via a class, not mount/unmount) so
 * revealing them causes no layout shift.
 */
export function BootSequence({ statusLabel }: BootSequenceProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [skipped, setSkipped] = React.useState(false);
  const [revealed, setRevealed] = React.useState(reducedMotion ? BOOT_LINES.length : 0);

  const done = reducedMotion || skipped || revealed >= BOOT_LINES.length;

  React.useEffect(() => {
    if (done) return;
    const timer = window.setTimeout(() => setRevealed((n) => n + 1), LINE_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [done, revealed]);

  const skip = React.useCallback(() => setSkipped(true), []);

  React.useEffect(() => {
    if (done) return;
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, [done, skip]);

  return (
    <div className={done ? "boot boot--done" : "boot"} onClick={skip}>
      <div className="boot__frame">
        <span className="eyebrow boot__eyebrow">GroundWork HQ</span>
        <ul className="boot__lines" aria-hidden="true">
          {BOOT_LINES.map((line, i) => (
            <li key={line} className={i < revealed || done ? "boot__line boot__line--on" : "boot__line"}>
              {line}
            </li>
          ))}
        </ul>
        <p className="mono boot__status" role="status" aria-live="polite">
          {statusLabel ?? (done ? "Standing by" : "Booting…")}
        </p>
        {!done && (
          <span className="mono boot__skip" aria-hidden="true">
            Click or press any key to skip
          </span>
        )}
      </div>
    </div>
  );
}
