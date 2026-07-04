import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "../../lib/theme";
import { KitScope } from "../../lib/themeKit";
import { Progress } from "../../components/Progress";

describe("Progress", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-kit");
  });

  it("exposes role=progressbar with the standard aria triad", () => {
    render(
      <ThemeProvider>
        <Progress value={2} max={4} label="2 of 4 tasks done" />
      </ThemeProvider>
    );
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "50");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar).toHaveAttribute("aria-label", "2 of 4 tasks done");
  });

  it("default kit (free theme) reuses the caller's track/fill classes with no signature-variant class", () => {
    render(
      <ThemeProvider>
        <Progress
          value={1}
          max={2}
          label="1 of 2 tasks done"
          trackClassName="kcard__progress-track"
          fillClassName="kcard__progress-fill"
        />
      </ThemeProvider>
    );
    const bar = screen.getByRole("progressbar");
    expect(bar.className).toContain("progress--default");
    expect(bar.className).toContain("kcard__progress-track");
    expect(bar.className).not.toMatch(/progress--(arc-reactor|command|phosphor)/);
    const fill = bar.querySelector(".kcard__progress-fill") as HTMLElement;
    expect(fill).not.toBeNull();
    expect(fill.style.width).toBe("50%");
  });

  it("renders a circular dial for the arc-reactor kit", () => {
    render(
      <ThemeProvider>
        <KitScope kit="arc-reactor">
          <Progress value={3} max={4} label="3 of 4 tasks done" />
        </KitScope>
      </ThemeProvider>
    );
    const bar = screen.getByRole("progressbar");
    expect(bar.className).toContain("progress--arc-reactor");
    expect(document.querySelector(".progress__dial")).not.toBeNull();
  });

  it("renders a segmented gauge for the command kit", () => {
    render(
      <ThemeProvider>
        <KitScope kit="command">
          <Progress value={5} max={10} label="5 of 10 tasks done" />
        </KitScope>
      </ThemeProvider>
    );
    const bar = screen.getByRole("progressbar");
    expect(bar.className).toContain("progress--command");
    // 5/10 = 50% → half of the 10 segments are "on".
    expect(document.querySelectorAll(".progress__segment--on").length).toBe(5);
  });

  it("renders an ASCII bar for the phosphor kit", () => {
    render(
      <ThemeProvider>
        <KitScope kit="phosphor">
          <Progress value={4} max={10} label="4 of 10 tasks done" />
        </KitScope>
      </ThemeProvider>
    );
    const bar = screen.getByRole("progressbar");
    expect(bar.className).toContain("progress--phosphor");
    // 4/10 = 40% → 4 of 10 ASCII slots filled.
    expect(bar.textContent).toBe("[####------]");
  });

  it("clamps and handles zero-max gracefully", () => {
    render(
      <ThemeProvider>
        <Progress value={0} max={0} label="no tasks" />
      </ThemeProvider>
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });
});
