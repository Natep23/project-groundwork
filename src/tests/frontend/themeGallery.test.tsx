import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

/* The gallery gates *selection* on `free ∪ profile.unlockedThemes` and reads
 * the profile for lock conditions/progress. We mock convex/react so we can
 * drive the profile without a live Convex client, and @clerk/clerk-react
 * since UserButton needs a ClerkProvider we don't want to stand up here. */
const state = vi.hoisted(() => ({
  isAuthenticated: true,
  isLoading: false,
  profile: undefined as
    | { unlockedThemes: string[]; level: number; achievements: string[] }
    | undefined,
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

async function renderHeaderAndOpenGallery() {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    </MemoryRouter>
  );
  await user.click(screen.getByRole("button", { name: "Themes" }));
  return user;
}

function tileFor(label: string) {
  // Tile labels append " · Selected"/" · Previewing" once active, so match a
  // prefix rather than requiring an exact string.
  const heading = screen.getByText((content) => content.startsWith(label), {
    selector: ".theme-tile__label",
  });
  const tile = heading.closest("li");
  if (!tile) throw new Error(`tile for ${label} not found`);
  return within(tile);
}

describe("ThemeGallery", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-kit");
    state.isAuthenticated = true;
    state.isLoading = false;
    state.profile = { unlockedThemes: [], level: 1, achievements: [] };
  });

  it("renders all 7 themes with correct locked/unlocked state and unlock condition", async () => {
    await renderHeaderAndOpenGallery();

    // Daylight is the default selected theme, so its action reads
    // "Selected"; the other free themes read "Select".
    for (const label of ["Blueprint", "Graphite", "Jobsite"]) {
      const tile = tileFor(label);
      expect(tile.getByRole("button", { name: /^Select$/ })).toBeInTheDocument();
    }
    expect(tileFor("Daylight").getByRole("button", { name: /^Selected$/ })).toBeInTheDocument();

    const arcTile = tileFor("Arc Reactor");
    expect(arcTile.getByText(/Locked/)).toBeInTheDocument();
    expect(arcTile.getByText(/Level 3/)).toBeInTheDocument();
    expect(arcTile.getByRole("button", { name: /^Preview$/ })).toBeInTheDocument();
  });

  it("selecting an unlocked theme persists to localStorage and marks it selected", async () => {
    const user = await renderHeaderAndOpenGallery();
    const blueprintTile = tileFor("Blueprint");
    await user.click(blueprintTile.getByRole("button", { name: /^Select$/ }));

    expect(localStorage.getItem("groundwork-theme")).toBe("blueprint");
    expect(document.documentElement.getAttribute("data-theme")).toBe("blueprint");
    expect(
      tileFor("Blueprint").getByText(/Selected/, { selector: ".theme-tile__label" })
    ).toBeInTheDocument();
  });

  it("locked themes cannot be selected — only previewed", async () => {
    await renderHeaderAndOpenGallery();
    const arcTile = tileFor("Arc Reactor");
    expect(arcTile.queryByRole("button", { name: /^Select$/ })).not.toBeInTheDocument();
    expect(arcTile.getByRole("button", { name: /Preview/ })).toBeInTheDocument();
  });

  it("previewing a locked theme applies it app-wide without persisting or unlocking", async () => {
    const user = await renderHeaderAndOpenGallery();
    const arcTile = tileFor("Arc Reactor");
    await user.click(arcTile.getByRole("button", { name: /^Preview$/ }));

    expect(document.documentElement.getAttribute("data-theme")).toBe("arc-reactor");
    expect(document.documentElement.getAttribute("data-kit")).toBe("arc-reactor");
    // Never persisted — reload would revert.
    expect(localStorage.getItem("groundwork-theme")).toBe("daylight");
    // Never unlocked server-side.
    expect(state.profile?.unlockedThemes).toEqual([]);
    // Banner shown.
    expect(screen.getByRole("status")).toHaveTextContent(/Previewing/);
    expect(screen.getByRole("status")).toHaveTextContent(/Arc Reactor/);
  });

  it("Exit preview reverts data-theme to the selected theme", async () => {
    const user = await renderHeaderAndOpenGallery();
    const arcTile = tileFor("Arc Reactor");
    await user.click(arcTile.getByRole("button", { name: /^Preview$/ }));
    expect(document.documentElement.getAttribute("data-theme")).toBe("arc-reactor");

    await user.click(screen.getByRole("button", { name: /Exit preview/ }));
    expect(document.documentElement.getAttribute("data-theme")).toBe("daylight");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

describe("useThemeGate (via Header)", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-kit");
    state.isAuthenticated = true;
    state.isLoading = false;
    state.profile = { unlockedThemes: [], level: 1, achievements: [] };
  });

  function renderHeader() {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Header />
        </ThemeProvider>
      </MemoryRouter>
    );
  }

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
    state.profile = { unlockedThemes: [], level: 1, achievements: [] };
    renderHeader();
    expect(document.documentElement.getAttribute("data-theme")).toBe("daylight");
    expect(localStorage.getItem("groundwork-theme")).toBe("daylight");
  });
});
