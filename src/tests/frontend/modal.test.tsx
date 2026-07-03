import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModalShell, ConfirmDeleteModal } from "../../components/Modals";

describe("ModalShell", () => {
  it("renders an accessible dialog and closes on Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <ModalShell title="Edit card" onClose={onClose}>
        <input aria-label="Title" />
      </ModalShell>
    );
    const dialog = screen.getByRole("dialog", { name: "Edit card" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    // First form control receives focus for keyboard users
    expect(screen.getByLabelText("Title")).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });
});

describe("ConfirmDeleteModal", () => {
  it("confirms and cancels", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmDeleteModal
        open
        title="Delete this card?"
        body="Everything on it goes too."
        confirmLabel="Delete card"
        onConfirm={onConfirm}
        onClose={onClose}
      />
    );
    await user.click(screen.getByRole("button", { name: "Delete card" }));
    expect(onConfirm).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("renders nothing when closed", () => {
    render(
      <ConfirmDeleteModal
        open={false}
        title="Delete?"
        body="…"
        confirmLabel="Delete"
        onConfirm={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
