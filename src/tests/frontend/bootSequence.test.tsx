import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { BootSequence } from "../../components/BootSequence";

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

describe("BootSequence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("collapses instantly under prefers-reduced-motion", () => {
    mockMatchMedia(true);
    render(<BootSequence statusLabel="Checking credentials…" />);
    expect(screen.getByText("Checking credentials…")).toBeInTheDocument();
    expect(document.querySelector(".boot--done")).not.toBeNull();
    expect(screen.queryByText(/Click or press any key to skip/)).not.toBeInTheDocument();
  });

  it("is skippable by click", () => {
    mockMatchMedia(false);
    render(<BootSequence />);
    expect(document.querySelector(".boot--done")).toBeNull();
    fireEvent.click(document.querySelector(".boot") as Element);
    expect(document.querySelector(".boot--done")).not.toBeNull();
    expect(screen.getByText("Standing by")).toBeInTheDocument();
  });

  it("is skippable by keypress", () => {
    mockMatchMedia(false);
    render(<BootSequence />);
    expect(document.querySelector(".boot--done")).toBeNull();
    fireEvent.keyDown(window, { key: "Enter" });
    expect(document.querySelector(".boot--done")).not.toBeNull();
  });

  it("reveals boot lines over time and finishes on its own without a skip", async () => {
    mockMatchMedia(false);
    render(<BootSequence />);
    expect(document.querySelectorAll(".boot__line--on").length).toBe(0);
    // Advance in increments (rather than one big jump) so each timer fire
    // gets a chance to commit its state update and schedule the next one —
    // matches how the real browser event loop interleaves them.
    for (let i = 0; i < 6; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(400);
      });
    }
    expect(document.querySelector(".boot--done")).not.toBeNull();
  });
});
