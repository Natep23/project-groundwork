import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColorSwatches, FLAG_COLORS } from "../../components/ColorSwatches";

describe("ColorSwatches", () => {
  it("marks the active preset and reports selections", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorSwatches value={FLAG_COLORS[0].value} onChange={onChange} />);

    expect(screen.getByRole("button", { name: "Orange" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Blue" })).toHaveAttribute("aria-pressed", "false");

    await user.click(screen.getByRole("button", { name: "Blue" }));
    expect(onChange).toHaveBeenCalledWith(FLAG_COLORS[1].value);
  });

  it("offers a custom color input", () => {
    render(<ColorSwatches value="#123456" onChange={() => {}} />);
    expect(screen.getByLabelText("Custom color")).toHaveValue("#123456");
  });
});
