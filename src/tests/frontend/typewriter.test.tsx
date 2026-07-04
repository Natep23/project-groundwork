import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "../../lib/theme";
import { KitScope } from "../../lib/themeKit";
import { SectionHeading } from "../../components/Typewriter";

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

describe("SectionHeading (phosphor typewriter reveal)", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-kit");
    mockMatchMedia(false);
  });

  it("default kit (free theme) renders the plain heading with no overlay markup", () => {
    render(
      <ThemeProvider>
        <SectionHeading className="hq__section-title">Achievements</SectionHeading>
      </ThemeProvider>
    );
    const heading = screen.getByText("Achievements");
    expect(heading.tagName).toBe("H3");
    expect(heading.className).toBe("hq__section-title");
    expect(document.querySelector(".typewriter__overlay")).toBeNull();
  });

  it("phosphor kit renders an aria-hidden animated overlay while keeping the full text in the a11y tree", () => {
    render(
      <ThemeProvider>
        <KitScope kit="phosphor">
          <SectionHeading className="hq__section-title">Weekly velocity</SectionHeading>
        </KitScope>
      </ThemeProvider>
    );
    // The real text is still findable by its accessible text content.
    expect(screen.getByText("Weekly velocity", { selector: ".typewriter__text" })).toBeInTheDocument();
    const overlay = document.querySelector(".typewriter__overlay");
    expect(overlay).not.toBeNull();
    expect(overlay).toHaveAttribute("aria-hidden", "true");
    expect(overlay?.textContent).toBe("Weekly velocity");
  });

  it("falls back to the plain heading under reduced motion, even for the phosphor kit", () => {
    mockMatchMedia(true);
    render(
      <ThemeProvider>
        <KitScope kit="phosphor">
          <SectionHeading className="hq__section-title">Achievements</SectionHeading>
        </KitScope>
      </ThemeProvider>
    );
    expect(document.querySelector(".typewriter__overlay")).toBeNull();
    expect(screen.getByText("Achievements")).toBeInTheDocument();
  });

  it("other bespoke kits (arc-reactor, command) render the plain heading too", () => {
    render(
      <ThemeProvider>
        <KitScope kit="command">
          <SectionHeading className="hq__section-title">Achievements</SectionHeading>
        </KitScope>
      </ThemeProvider>
    );
    expect(document.querySelector(".typewriter__overlay")).toBeNull();
    expect(screen.getByText("Achievements")).toBeInTheDocument();
  });
});
