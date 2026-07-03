import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ToastProvider, useToast } from "../../lib/toast";

function Probe() {
  const { toast, toastError } = useToast();
  return (
    <div>
      <button onClick={() => toast("Card saved")}>info</button>
      <button onClick={() => toastError("It broke")}>error</button>
    </div>
  );
}

describe("ToastProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a toast and auto-dismisses it", () => {
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>
    );
    act(() => {
      screen.getByRole("button", { name: "info" }).click();
    });
    expect(screen.getByText("Card saved")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4100);
    });
    expect(screen.queryByText("Card saved")).not.toBeInTheDocument();
  });

  it("styles errors differently and announces via a live region", () => {
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>
    );
    act(() => {
      screen.getByRole("button", { name: "error" }).click();
    });
    const toast = screen.getByText("It broke");
    expect(toast).toHaveClass("toast--error");
    expect(screen.getByRole("status")).toContainElement(toast);
  });
});
