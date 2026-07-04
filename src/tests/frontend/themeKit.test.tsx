import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "../../lib/theme";
import { useThemeKit, KitScope, isBespokeKit } from "../../lib/themeKit";

function Probe() {
  const kit = useThemeKit();
  const { setTheme } = useTheme();
  return (
    <div>
      <span data-testid="kit">{kit}</span>
      <button onClick={() => setTheme("command")}>Command</button>
    </div>
  );
}

describe("useThemeKit", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-kit");
  });

  it("derives the kit from the active theme when there's no override", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId("kit")).toHaveTextContent("daylight");
    await user.click(screen.getByRole("button", { name: "Command" }));
    expect(screen.getByTestId("kit")).toHaveTextContent("command");
  });

  it("KitScope overrides the kit for its subtree regardless of the active theme", () => {
    render(
      <ThemeProvider>
        <KitScope kit="phosphor">
          <Probe />
        </KitScope>
      </ThemeProvider>
    );
    // Active theme is still "daylight" — only the kit is overridden.
    expect(screen.getByTestId("kit")).toHaveTextContent("phosphor");
    expect(document.documentElement.getAttribute("data-theme")).toBe("daylight");
  });

  it("a nested KitScope overrides an outer one", () => {
    render(
      <ThemeProvider>
        <KitScope kit="command">
          <KitScope kit="arc-reactor">
            <Probe />
          </KitScope>
        </KitScope>
      </ThemeProvider>
    );
    expect(screen.getByTestId("kit")).toHaveTextContent("arc-reactor");
  });

  it("isBespokeKit only recognizes the three unlockable kits", () => {
    expect(isBespokeKit("arc-reactor")).toBe(true);
    expect(isBespokeKit("command")).toBe(true);
    expect(isBespokeKit("phosphor")).toBe(true);
    expect(isBespokeKit("daylight")).toBe(false);
    expect(isBespokeKit("blueprint")).toBe(false);
  });
});
