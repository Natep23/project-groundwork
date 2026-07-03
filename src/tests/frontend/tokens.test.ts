import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const STYLES_DIR = path.resolve(__dirname, "../../styles");
const tokensCss = fs.readFileSync(path.join(STYLES_DIR, "tokens.css"), "utf8");
const baseCss = fs.readFileSync(path.join(STYLES_DIR, "base.css"), "utf8");
const componentsCss = fs.readFileSync(path.join(STYLES_DIR, "components.css"), "utf8");

/**
 * `--flag` is the one documented exception to the "components consume only
 * tokens" rule (see src/CLAUDE.md): it's set inline per-card in card.tsx and
 * falls back to var(--accent), so it never appears as a definition in
 * tokens.css.
 */
const DOCUMENTED_EXCEPTIONS = new Set(["--flag"]);

/** The full theme contract from the tokens.css header comment: every block
 * selected by `[data-theme="..."]` (plus the `:root` defaults) must define
 * all of these. Mirrors the token names actually consumed across
 * base.css/components.css (verified below), minus the always-`:root`-only
 * globals (fonts, spacing scale, header height). */
const CORE_THEME_TOKENS = [
  "--bg",
  "--grid-line",
  "--grid-line-major",
  "--surface",
  "--surface-2",
  "--scrim",
  "--ink",
  "--ink-muted",
  "--ink-faint",
  "--line",
  "--line-strong",
  "--accent",
  "--accent-ink",
  "--accent-soft",
  "--danger",
  "--danger-ink",
  "--ok",
  "--shadow-1",
  "--shadow-2",
  "--radius",
  "--border-w",
  "--column-border-style",
];

function extractThemeBlocks(css: string): Map<string, string> {
  // tokens.css has no nested braces, so a flat "selector { body }" scan is
  // enough. A rule can target several ids at once (`:root, [data-theme=
  // "daylight"] { ... }`), so pull every id out of the selector text rather
  // than assuming a fixed order/shape.
  const blocks = new Map<string, string>();
  const ruleRe = /([^{}]+)\{([^}]*)\}/g;
  let rule: RegExpExecArray | null;
  while ((rule = ruleRe.exec(css))) {
    const [, selector, body] = rule;
    const ids: string[] = [];
    if (/:root\b/.test(selector)) ids.push("root");
    const idRe = /data-theme="([a-z-]+)"/g;
    let idMatch: RegExpExecArray | null;
    while ((idMatch = idRe.exec(selector))) ids.push(idMatch[1]);
    for (const id of ids) blocks.set(id, (blocks.get(id) ?? "") + body);
  }
  return blocks;
}

function definedProps(body: string): Set<string> {
  const props = new Set<string>();
  const re = /(--[a-zA-Z0-9-]+)\s*:/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body))) props.add(match[1]);
  return props;
}

function usedVars(css: string): Set<string> {
  const vars = new Set<string>();
  const re = /var\((--[a-zA-Z0-9-]+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css))) vars.add(match[1]);
  return vars;
}

describe("theme token contract", () => {
  const blocks = extractThemeBlocks(tokensCss);
  const themeIds = [
    "daylight",
    "blueprint",
    "graphite",
    "jobsite",
    "arc-reactor",
    "command",
    "phosphor",
  ];

  it("finds all seven themes in tokens.css", () => {
    for (const id of themeIds) {
      expect(blocks.has(id), `expected a [data-theme="${id}"] block`).toBe(true);
    }
  });

  it.each(themeIds)("theme '%s' defines the full core token set", (id) => {
    const props = definedProps(blocks.get(id) ?? "");
    for (const token of CORE_THEME_TOKENS) {
      expect(props.has(token), `[data-theme="${id}"] is missing ${token}`).toBe(true);
    }
  });

  it("every var(--x) referenced in base.css/components.css is defined somewhere in tokens.css", () => {
    const rootProps = definedProps(blocks.get("root") ?? "");
    const used = new Set([...usedVars(baseCss), ...usedVars(componentsCss)]);
    const definedAnywhere = new Set<string>(rootProps);
    for (const id of themeIds) {
      for (const p of definedProps(blocks.get(id) ?? "")) definedAnywhere.add(p);
    }

    const missing = [...used].filter(
      (name) => !definedAnywhere.has(name) && !DOCUMENTED_EXCEPTIONS.has(name)
    );
    expect(missing, `undefined tokens referenced: ${missing.join(", ")}`).toEqual([]);
  });
});
