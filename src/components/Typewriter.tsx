import { useThemeKit } from "../lib/themeKit";
import { usePrefersReducedMotion } from "../lib/usePrefersReducedMotion";
import { cx } from "../lib/cx";

export type SectionHeadingProps = {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
};

/**
 * Kit-aware heading wrapper (p3-04 signature set-piece: phosphor typewriter
 * reveal). The full text is ALWAYS present in the DOM/accessibility tree —
 * per Fable issue #5, this never drives a per-character `aria-live` region.
 *
 * Only under the phosphor kit, and only when motion is allowed, does this
 * render a second layer: the real text gets `opacity: 0` (invisible but
 * still in the accessibility tree — unlike `visibility`/`display`, opacity
 * doesn't remove a node from the a11y tree), and an `aria-hidden` sibling
 * overlays the same text with a CSS width-reveal "typewriter" animation
 * timed in character-sized `steps()` for a chunky terminal feel, plus a
 * trailing blinking cursor.
 *
 * Every other kit, and phosphor under reduced-motion, renders the plain
 * heading — byte-identical to pre-p3-04 markup (no free-theme regression).
 */
export function SectionHeading({ children, className, as: Tag = "h3" }: SectionHeadingProps) {
  const kit = useThemeKit();
  const reducedMotion = usePrefersReducedMotion();
  const animate = kit === "phosphor" && !reducedMotion;

  if (!animate) {
    return <Tag className={className}>{children}</Tag>;
  }

  const steps = Math.max(children.length, 1);

  return (
    <Tag className={cx(className, "typewriter")}>
      <span className="typewriter__text">{children}</span>
      <span
        className="typewriter__overlay"
        aria-hidden="true"
        style={{ animationTimingFunction: `steps(${steps}, end)` }}
      >
        {children}
      </span>
    </Tag>
  );
}
