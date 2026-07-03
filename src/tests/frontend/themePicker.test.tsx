import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/* Header's theme picker gates *selection* on `free ∪ profile.unlockedThemes`.
 * We mock convex/react so we can drive the profile the gate sees without a
 * live Convex client, and @clerk/clerk-react since UserButton needs a
 * ClerkProvider we don't want to stand up here. */
const state = vi.hoisted(() => ({
  isAuthenticated: true,
  isLoading: false,
  profile: undefined as { unlockedThemes: string[] } | undefined,
}));

vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: state.isAuthenticated, isLoading: state.isLoading }),
  useQuery: (_fn: unknown, args: unknown) =>
    args === "skip" || !state.isAuthenticated ? undefined : state.profile,
  Authenticated: ({ children }: { children: React.ReactNode }) =>
    state.isAuthenticated ? <>{children}</> : null,
}));

vi.mock("@clerk/clerk-react", () => ({
  UserButton: () => null,
}));

import { ThemeProvider } from "../../lib/theme";
import { Header } from "../../components/header";

function renderHeader() {
  render(
    <MemoryRouter>
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    </MemoryRouter>
  );
}

function optionState(label: RegExp | string) {
  const option = screen.getByRole("option", { name: label }) as HTMLOptionElement;
  return option;
}

describe("Header theme picker gating", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    state.isAuthenticated = true;
    state.isLoading = false;
    state.profile = { unlockedThemes: [] };
  });

  it("always enables the four free themes", () => {
    renderHeader();
    for (const label of ["Daylight", "Blueprint", "Graphite", "Jobsite"]) {
      expect(optionState(label).disabled).toBe(false);
    }
  });

  it("disables unlockable themes the profile hasn't earned, showing a lock + condition", () => {
    renderHeader();
    const option = optionState(/Arc Reactor/);
    expect(option.disabled).toBe(true);
    expect(option.textContent).toMatch(/🔒/);
    expect(option.textContent).toMatch(/Level 3/);
  });

  it("enables a theme once it appears in profile.unlockedThemes", () => {
    state.profile = { unlockedThemes: ["arc-reactor"] };
    renderHeader();
    expect(optionState(/Arc Reactor/).disabled).toBe(false);
    expect(optionState(/Command/).disabled).toBe(true);
  });

  it("treats signed-out visitors (no profile) as free-themes-only", () => {
    state.isAuthenticated = false;
    state.profile = undefined;
    renderHeader();
    expect(optionState("Daylight").disabled).toBe(false);
    expect(optionState(/Arc Reactor/).disabled).toBe(true);
  });

  it("does not reset the stored theme during the auth-loading window", () => {
    // Regression: while auth is resolving, useConvexAuth reports
    // isAuthenticated=false with isLoading=true. The gate must wait, or it
    // wipes a previously-unlocked theme back to the default on every reload.
    localStorage.setItem("groundwork-theme", "command");
    state.isAuthenticated = false;
    state.isLoading = true;
    state.profile = undefined;
    renderHeader();
    expect(document.documentElement.getAttribute("data-theme")).toBe("command");
  });

  it("falls back to the default free theme if the stored/applied theme isn't unlocked", () => {
    localStorage.setItem("groundwork-theme", "command");
    state.profile = { unlockedThemes: [] };
    renderHeader();
    expect(document.documentElement.getAttribute("data-theme")).toBe("daylight");
    expect((screen.getByLabelText("Print") as HTMLSelectElement).value).toBe("daylight");
  });
});
