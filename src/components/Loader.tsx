import React from "react";
import { useThemeKit, isBespokeKit } from "../lib/themeKit";
import { cx } from "../lib/cx";

export type LoaderProps = {
  /** Accessible + visible label, e.g. "Loading the board…". */
  label?: string;
  /** Extra class(es) merged onto the root element — lets call sites keep
   * their existing CSS hook (e.g. `app-loading`, `hq__loading`) so the
   * default kit's rendering is unchanged from before p3-03. */
  className?: string;
  style?: React.CSSProperties;
  /** Root tag — defaults to `span` (inline spinners); pass `"div"` for the
   * full-page loading states that used to be a bare `.app-loading` div. */
  as?: "div" | "span" | "p";
};

/**
 * Kit-aware loading indicator, `role="status"` for a11y. The **default**
 * variant (free themes / no bespoke kit) renders the exact markup the app
 * shipped before p3-03 — a labelled element whose descendant `<span>` gets
 * the existing `.app-loading span` pulse animation — so free themes are
 * pixel-identical. Bespoke kits (arc-reactor/command/phosphor) render a
 * signature glyph ahead of the label; all glyph motion sits behind
 * `prefers-reduced-motion: no-preference` (see components.css), collapsing
 * to a static glyph otherwise.
 */
export function Loader({ label = "Loading…", className, style, as: Tag = "span" }: LoaderProps) {
  const kit = useThemeKit();
  const bespoke = isBespokeKit(kit) ? kit : undefined;

  return (
    <Tag
      className={cx("loader", bespoke ? `loader--${bespoke}` : "loader--default", className)}
      style={style}
      role="status"
    >
      {bespoke === "arc-reactor" && (
        <span className="loader__glyph loader__glyph--arc-reactor" aria-hidden="true">
          <span className="loader__ring loader__ring--outer" />
          <span className="loader__ring loader__ring--inner" />
          <span className="loader__core" />
        </span>
      )}
      {bespoke === "command" && (
        <span className="loader__glyph loader__glyph--command" aria-hidden="true">
          <span className="loader__radar-sweep" />
        </span>
      )}
      <span className="loader__label">{label}</span>
      {bespoke === "phosphor" && (
        <span className="loader__glyph loader__glyph--phosphor" aria-hidden="true">
          ▊
        </span>
      )}
    </Tag>
  );
}
