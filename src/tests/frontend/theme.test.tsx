import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme, THEMES } from "../../lib/theme";

function Probe() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="current">{theme}</span>
      {THEMES.map((t) => (
        <button key={t.id} onClick={() => setTheme(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("defaults to daylight and applies data-theme to <html>", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId("current")).toHaveTextContent("daylight");
    expect(document.documentElement.getAttribute("data-theme")).toBe("daylight");
  });

  it("switches theme and persists the choice", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    await user.click(screen.getByRole("button", { name: "Blueprint" }));
    expect(document.documentElement.getAttribute("data-theme")).toBe("blueprint");
    expect(localStorage.getItem("groundwork-theme")).toBe("blueprint");
  });

  it("migrates the legacy dark value to graphite", () => {
    localStorage.setItem("groundwork-theme", "dark");
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId("current")).toHaveTextContent("graphite");
  });

  it("ignores unknown stored values", () => {
    localStorage.setItem("groundwork-theme", "neon-hacker");
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId("current")).toHaveTextContent("daylight");
  });
});
