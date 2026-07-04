import { useThemeKit, isBespokeKit } from "../lib/themeKit";
import { cx } from "../lib/cx";

export type ProgressProps = {
  value: number;
  max: number;
  /** Accessible label, e.g. "3 of 5 tasks done". */
  label: string;
  /** Extra class(es) for the default-kit track element — lets call sites
   * keep their existing CSS hook (e.g. `kcard__progress-track`,
   * `briefing__xp-track`) so the default kit's rendering is unchanged from
   * before p3-03. Ignored by bespoke kits (they own their own visual). */
  trackClassName?: string;
  /** Extra class(es) for the default-kit fill element (e.g.
   * `kcard__progress-fill`, `briefing__xp-fill`). */
  fillClassName?: string;
};

const SEGMENT_COUNT = 10;
const ASCII_WIDTH = 10;
const DIAL_RADIUS = 15;
const DIAL_CIRCUMFERENCE = 2 * Math.PI * DIAL_RADIUS;

function pctOf(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((value / max) * 100)));
}

/**
 * Kit-aware progress indicator, `role="progressbar"` + the standard aria
 * triad. The **default** variant (free themes) renders the exact linear
 * track/fill markup the app shipped before p3-03 — pass `trackClassName`/
 * `fillClassName` matching the call site's existing classes so its CSS
 * keeps matching unchanged. Bespoke kits render a signature visual (arc-
 * reactor circular dial, command segmented gauge, phosphor ASCII bar)
 * instead, ignoring those class props.
 */
export function Progress({ value, max, label, trackClassName, fillClassName }: ProgressProps) {
  const kit = useThemeKit();
  const pct = pctOf(value, max);
  const a11y = {
    role: "progressbar" as const,
    "aria-valuenow": pct,
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-label": label,
  };

  if (!isBespokeKit(kit)) {
    return (
      <span className={cx("progress", "progress--default", trackClassName)} {...a11y}>
        <span className={cx("progress__fill", fillClassName)} style={{ width: `${pct}%` }} />
      </span>
    );
  }

  if (kit === "arc-reactor") {
    const offset = DIAL_CIRCUMFERENCE * (1 - pct / 100);
    return (
      <span className="progress progress--arc-reactor" {...a11y}>
        <svg viewBox="0 0 36 36" className="progress__dial" aria-hidden="true">
          <circle className="progress__dial-track" cx="18" cy="18" r={DIAL_RADIUS} />
          <circle
            className="progress__dial-fill"
            cx="18"
            cy="18"
            r={DIAL_RADIUS}
            style={{
              strokeDasharray: DIAL_CIRCUMFERENCE,
              strokeDashoffset: offset,
            }}
          />
        </svg>
        <span className="progress__value mono" aria-hidden="true">
          {pct}%
        </span>
      </span>
    );
  }

  if (kit === "command") {
    const onCount = Math.round((pct / 100) * SEGMENT_COUNT);
    return (
      <span className="progress progress--command" {...a11y}>
        {Array.from({ length: SEGMENT_COUNT }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={cx("progress__segment", i < onCount && "progress__segment--on")}
          />
        ))}
      </span>
    );
  }

  // phosphor
  const filled = Math.round((pct / 100) * ASCII_WIDTH);
  const bar = `[${"#".repeat(filled)}${"-".repeat(ASCII_WIDTH - filled)}]`;
  return (
    <span className="progress progress--phosphor mono" {...a11y}>
      <span aria-hidden="true">{bar}</span>
    </span>
  );
}
