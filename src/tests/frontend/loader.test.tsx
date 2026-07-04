import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "../../lib/theme";
import { KitScope } from "../../lib/themeKit";
import { Loader } from "../../components/Loader";

function mockMatchMedia(reduced: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("reduce") ? reduced : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

describe("Loader", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-kit");
    mockMatchMedia(false);
  });

  it("exposes role=status with the label as its accessible content", () => {
    render(
      <ThemeProvider>
        <Loader label="Loading the board…" />
      </ThemeProvider>
    );
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Loading the board…");
  });

  it("default kit (free theme) renders the plain markup with no signature-variant class", () => {
    render(
      <ThemeProvider>
        <Loader label="Loading…" />
      </ThemeProvider>
    );
    const status = screen.getByRole("status");
    expect(status.className).toContain("loader--default");
    expect(status.className).not.toMatch(/loader--(arc-reactor|command|phosphor)/);
    expect(document.querySelector(".loader__glyph")).toBeNull();
  });

  it("merges an extra className onto the root so call sites keep their existing CSS hook", () => {
    render(
      <ThemeProvider>
        <Loader label="Loading…" className="app-loading" as="div" />
      </ThemeProvider>
    );
    const status = screen.getByRole("status");
    expect(status.tagName).toBe("DIV");
    expect(status.className).toContain("app-loading");
  });

  it("renders the arc-reactor signature glyph when that kit is active", () => {
    render(
      <ThemeProvider>
        <KitScope kit="arc-reactor">
          <Loader label="Loading…" />
        </KitScope>
      </ThemeProvider>
    );
    const status = screen.getByRole("status");
    expect(status.className).toContain("loader--arc-reactor");
    expect(document.querySelector(".loader__glyph--arc-reactor")).not.toBeNull();
  });

  it("renders the command signature glyph when that kit is active", () => {
    render(
      <ThemeProvider>
        <KitScope kit="command">
          <Loader label="Loading…" />
        </KitScope>
      </ThemeProvider>
    );
    expect(document.querySelector(".loader__glyph--command")).not.toBeNull();
  });

  it("renders the phosphor blinking-cursor glyph when that kit is active", () => {
    render(
      <ThemeProvider>
        <KitScope kit="phosphor">
          <Loader label="Loading…" />
        </KitScope>
      </ThemeProvider>
    );
    expect(document.querySelector(".loader__glyph--phosphor")).not.toBeNull();
  });

  it("still renders the glyph structure (motion collapses via CSS) under prefers-reduced-motion", () => {
    mockMatchMedia(true);
    render(
      <ThemeProvider>
        <KitScope kit="arc-reactor">
          <Loader label="Loading…" />
        </KitScope>
      </ThemeProvider>
    );
    // The component itself doesn't unmount the glyph under reduced motion —
    // all animation is gated in CSS via `@media (prefers-reduced-motion:
    // no-preference)`, so the glyph is present but static (jsdom doesn't
    // run animations either way; this asserts the markup doesn't change).
    expect(document.querySelector(".loader__glyph--arc-reactor")).not.toBeNull();
  });
});
