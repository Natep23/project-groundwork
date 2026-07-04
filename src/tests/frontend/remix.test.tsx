import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

/* Mirrors themeGallery.test.tsx: mock convex/react so we can drive the
 * profile (and thus `canRemix`) without a live client, and stub Clerk's
 * UserButton so the header renders without a ClerkProvider. */
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

import { ThemeProvider, useTheme, type ThemeId } from "../../lib/theme";
import { Header } from "../../components/header";

const ALL_UNLOCKED = ["arc-reactor", "command", "phosphor"];
const REMIX_EARNED = {
  unlockedThemes: ALL_UNLOCKED,
  level: 10,
  achievements: [
    "first_ship",
    "streak_7",
    "remix_unlocked",
  ],
};

function resetDom() {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-kit");
  state.isAuthenticated = true;
  state.isLoading = false;
  state.profile = { unlockedThemes: [], level: 1, achievements: [] };
}

// A probe that exposes the remix controls without going through the gallery UI.
function RemixProbe() {
  const { appliedPalette, appliedKit, remix, setRemix, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="palette">{appliedPalette}</span>
      <span data-testid="kit">{appliedKit}</span>
      <span data-testid="remixing">{remix ? "yes" : "no"}</span>
      <button onClick={() => setRemix({ palette: "command", kit: "arc-reactor" })}>engage</button>
      <button onClick={() => setRemix(null)}>clear</button>
      <button onClick={() => setTheme("blueprint" as ThemeId)}>plain-blueprint</button>
    </div>
  );
}

describe("remix loadout — ThemeProvider palette⊗kit split", () => {
  beforeEach(resetDom);

  it("applies palette to data-theme and kit to data-kit independently", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <RemixProbe />
      </ThemeProvider>
    );
    await user.click(screen.getByRole("button", { name: "engage" }));

    expect(document.documentElement.getAttribute("data-theme")).toBe("command");
    expect(document.documentElement.getAttribute("data-kit")).toBe("arc-reactor");
    expect(screen.getByTestId("palette")).toHaveTextContent("command");
    expect(screen.getByTestId("kit")).toHaveTextContent("arc-reactor");
  });

  it("persists the loadout only while engaged and clears the keys when reset", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <RemixProbe />
      </ThemeProvider>
    );
    await user.click(screen.getByRole("button", { name: "engage" }));
    expect(localStorage.getItem("groundwork-palette")).toBe("command");
    expect(localStorage.getItem("groundwork-kit")).toBe("arc-reactor");

    await user.click(screen.getByRole("button", { name: "clear" }));
    // Reverting to a plain theme removes the remix keys entirely (back-compat).
    expect(localStorage.getItem("groundwork-palette")).toBeNull();
    expect(localStorage.getItem("groundwork-kit")).toBeNull();
    expect(screen.getByTestId("remixing")).toHaveTextContent("no");
  });

  it("a non-remix user's storage stays exactly as pre-p3-05 (only groundwork-theme)", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <RemixProbe />
      </ThemeProvider>
    );
    await user.click(screen.getByRole("button", { name: "plain-blueprint" }));
    expect(localStorage.getItem("groundwork-theme")).toBe("blueprint");
    expect(localStorage.getItem("groundwork-palette")).toBeNull();
    expect(localStorage.getItem("groundwork-kit")).toBeNull();
    // palette === kit === theme when not remixing.
    expect(document.documentElement.getAttribute("data-theme")).toBe("blueprint");
    expect(document.documentElement.getAttribute("data-kit")).toBe("blueprint");
  });

  it("rehydrates a persisted loadout on mount", () => {
    localStorage.setItem("groundwork-theme", "command");
    localStorage.setItem("groundwork-palette", "command");
    localStorage.setItem("groundwork-kit", "phosphor");
    render(
      <ThemeProvider>
        <RemixProbe />
      </ThemeProvider>
    );
    expect(screen.getByTestId("palette")).toHaveTextContent("command");
    expect(screen.getByTestId("kit")).toHaveTextContent("phosphor");
  });
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

describe("remix — canRemix gating in the gallery", () => {
  beforeEach(resetDom);

  it("shows the Loadout only when remix is unlocked server-side", async () => {
    state.profile = REMIX_EARNED;
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole("button", { name: "Themes" }));
    expect(screen.getByRole("region", { name: "Remix loadout" })).toBeInTheDocument();
  });

  it("hides the Loadout when remix is not unlocked", async () => {
    state.profile = { unlockedThemes: ALL_UNLOCKED, level: 10, achievements: ["first_ship"] };
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole("button", { name: "Themes" }));
    expect(screen.queryByRole("region", { name: "Remix loadout" })).not.toBeInTheDocument();
  });
});

describe("remix — gate corrects a stale/locked persisted loadout", () => {
  beforeEach(resetDom);

  it("degrades a locked kit to the palette's own kit", () => {
    localStorage.setItem("groundwork-theme", "command");
    localStorage.setItem("groundwork-palette", "command");
    localStorage.setItem("groundwork-kit", "phosphor");
    // canRemix true, command unlocked, but phosphor NOT unlocked.
    state.profile = { unlockedThemes: ["command"], level: 10, achievements: ["remix_unlocked"] };
    renderHeader();
    // Palette stays; kit degrades silently to the palette's kit.
    expect(document.documentElement.getAttribute("data-theme")).toBe("command");
    expect(document.documentElement.getAttribute("data-kit")).toBe("command");
    expect(localStorage.getItem("groundwork-kit")).toBe("command");
  });

  it("drops the whole loadout when remix isn't earned", () => {
    localStorage.setItem("groundwork-theme", "arc-reactor");
    localStorage.setItem("groundwork-palette", "command");
    localStorage.setItem("groundwork-kit", "arc-reactor");
    // No remix_unlocked achievement, and command isn't even unlocked.
    state.profile = { unlockedThemes: ["arc-reactor"], level: 3, achievements: ["first_ship"] };
    renderHeader();
    // Remix cleared; falls back to the (unlocked) plain theme for both dims.
    expect(document.documentElement.getAttribute("data-theme")).toBe("arc-reactor");
    expect(document.documentElement.getAttribute("data-kit")).toBe("arc-reactor");
    expect(localStorage.getItem("groundwork-palette")).toBeNull();
    expect(localStorage.getItem("groundwork-kit")).toBeNull();
  });
});
