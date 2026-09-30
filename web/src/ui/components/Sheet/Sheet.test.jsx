import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Sheet from "./Sheet.jsx";
import { VelocityTracker } from "../../motion/physics.js";

const CLOSE_TIMEOUT = { timeout: 3000 };

function Harness({ onClose: onCloseSpy = () => {}, ...props }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  return (
    <>
      <button ref={triggerRef} onClick={() => setOpen(true)}>Open sheet</button>
      <main data-testid="background">Background</main>
      <Sheet
        open={open}
        onClose={() => {
          onCloseSpy();
          setOpen(false);
        }}
        title="Add expense"
        description="Shared between everyone"
        footer={<button>Save</button>}
        {...props}
      >
        <input aria-label="Name" />
      </Sheet>
    </>
  );
}

Harness.propTypes = { onClose: PropTypes.func };

function openSheet() {
  const trigger = screen.getByRole("button", { name: "Open sheet" });
  trigger.focus();
  fireEvent.click(trigger);
  return screen.getByRole("dialog");
}

async function openSettledSheet() {
  const dialog = openSheet();
  await waitFor(() => expect(dialog.style.transform).toBe("translate3d(0, 0px, 0)"), CLOSE_TIMEOUT);
  return dialog;
}

describe("Sheet", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing while closed", () => {
    render(<Harness />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens as a labelled, described modal dialog and takes focus", () => {
    render(<Harness />);
    const dialog = openSheet();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Add expense");
    expect(dialog).toHaveAccessibleDescription("Shared between everyone");
    expect(dialog).toHaveFocus();
  });

  it("makes the background inert and locks scroll while open", () => {
    const { container } = render(<Harness />);
    openSheet();
    expect(container).toHaveAttribute("inert");
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("releases the background and focus as soon as closing starts", async () => {
    const { container } = render(<Harness />);
    const dialog = openSheet();

    fireEvent.keyDown(dialog, { key: "Escape" });
    // The sheet is still animating away, but the page is already usable.
    expect(screen.getByRole("dialog", { hidden: true })).toBeInTheDocument();
    expect(container).not.toHaveAttribute("inert");
    expect(document.body.style.overflow).toBe("");
    expect(screen.getByRole("button", { name: "Open sheet" })).toHaveFocus();
    expect(dialog.parentElement).toHaveStyle({ pointerEvents: "none" });

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument(), CLOSE_TIMEOUT);
  });

  it("keeps the departing sheet out of reach of the keyboard while it animates away", async () => {
    render(<Harness />);
    const dialog = openSheet();

    fireEvent.keyDown(dialog, { key: "Escape" });
    // Still on screen during the exit animation, so pointer-events alone would leave its
    // controls tabbable. `inert` also removes them from the tab order and a11y tree.
    expect(dialog.parentElement).toHaveAttribute("inert");
    expect(dialog).not.toHaveFocus();

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument(), CLOSE_TIMEOUT);
  });

  it("makes the sheet reachable again when reopened mid-close", () => {
    render(<Harness />);
    fireEvent.keyDown(openSheet(), { key: "Escape" });

    const dialog = openSheet();
    expect(dialog.parentElement).not.toHaveAttribute("inert");
    expect(dialog).toHaveFocus();
  });

  it("re-locks the background when reopened mid-close", () => {
    const { container } = render(<Harness />);
    fireEvent.keyDown(openSheet(), { key: "Escape" });
    expect(container).not.toHaveAttribute("inert");

    const dialog = openSheet();
    expect(container).toHaveAttribute("inert");
    expect(dialog.parentElement).not.toHaveStyle({ pointerEvents: "none" });
    expect(dialog).toHaveFocus();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent.keyDown(openSheet(), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument(), CLOSE_TIMEOUT);
    expect(screen.getByRole("button", { name: "Open sheet" })).toHaveFocus();
  });

  it("closes from the scrim and the close button", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    openSheet();
    fireEvent.click(screen.getByTestId("sheet-scrim"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes from the close button", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    openSheet();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignores dismissal attempts when not dismissible", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} dismissible={false} />);
    const dialog = openSheet();
    fireEvent.keyDown(dialog, { key: "Escape" });
    fireEvent.click(screen.getByTestId("sheet-scrim"));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("traps Tab focus inside the sheet", () => {
    render(<Harness />);
    const dialog = openSheet();
    const close = screen.getByRole("button", { name: "Close" });
    const save = screen.getByRole("button", { name: "Save" });

    save.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(close).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(save).toHaveFocus();
  });

  it("focuses initialFocusRef when provided", () => {
    function WithInitialFocus() {
      const inputRef = useRef(null);
      return (
        <Sheet open title="Edit" initialFocusRef={inputRef} onClose={() => {}}>
          <input ref={inputRef} aria-label="Amount" />
        </Sheet>
      );
    }
    render(<WithInitialFocus />);
    expect(screen.getByLabelText("Amount")).toHaveFocus();
  });

  it("dismisses when dragged down far enough", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    openSheet();
    const handle = screen.getByTestId("sheet-drag-handle");
    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 0, button: 0, pointerType: "touch" });
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 600, pointerType: "touch" });
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 600, pointerType: "touch" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("tracks the pointer 1:1 and settles back after a short, slow drag", async () => {
    vi.spyOn(VelocityTracker.prototype, "velocity").mockReturnValue(0);
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const dialog = await openSettledSheet();
    const handle = screen.getByTestId("sheet-drag-handle");
    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 100, button: 0, pointerType: "touch" });
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 150, pointerType: "touch" });
    expect(dialog.style.transform).toMatch(/translate3d\(0, \d+(\.\d+)?px, 0\)/);
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 150, pointerType: "touch" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("dismisses on a fast flick even when the drag distance is short", async () => {
    vi.spyOn(VelocityTracker.prototype, "velocity").mockReturnValue(3000);
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await openSettledSheet();
    const handle = screen.getByTestId("sheet-drag-handle");
    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 100, button: 0, pointerType: "touch" });
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 140, pointerType: "touch" });
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 140, pointerType: "touch" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("rubber-bands when dragged upward past the top", async () => {
    vi.spyOn(VelocityTracker.prototype, "velocity").mockReturnValue(0);
    render(<Harness />);
    const dialog = await openSettledSheet();
    const handle = screen.getByTestId("sheet-drag-handle");
    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 400, button: 0, pointerType: "touch" });
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 200, pointerType: "touch" });
    const offset = parseFloat(dialog.style.transform.match(/translate3d\(0, (-?[\d.]+)px/)[1]);
    expect(offset).toBeLessThan(0);
    expect(offset).toBeGreaterThan(-200);
  });

  it("reverses from its on-screen position when reopened mid-close", async () => {
    const { rerender } = render(<Sheet open title="Edit" onClose={() => {}} />);
    const dialog = screen.getByRole("dialog");
    await waitFor(() => expect(dialog.style.transform).toBe("translate3d(0, 0px, 0)"), CLOSE_TIMEOUT);

    rerender(<Sheet open={false} title="Edit" onClose={() => {}} />);
    await waitFor(() => {
      const offset = parseFloat(dialog.style.transform.match(/translate3d\(0, (-?[\d.]+)px/)[1]);
      expect(offset).toBeGreaterThan(20);
    }, CLOSE_TIMEOUT);
    const midFlight = parseFloat(dialog.style.transform.match(/translate3d\(0, (-?[\d.]+)px/)[1]);

    rerender(<Sheet open title="Edit" onClose={() => {}} />);
    // Same element, no jump back to the fully-hidden position.
    expect(screen.getByRole("dialog")).toBe(dialog);
    const afterReopen = parseFloat(dialog.style.transform.match(/translate3d\(0, (-?[\d.]+)px/)[1]);
    expect(afterReopen).toBeCloseTo(midFlight, 0);
    await waitFor(() => expect(dialog.style.transform).toBe("translate3d(0, 0px, 0)"), CLOSE_TIMEOUT);
  });

  it("ignores drags that start on header controls", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    openSheet();
    const close = screen.getByRole("button", { name: "Close" });
    fireEvent.pointerDown(close, { pointerId: 1, clientY: 0, button: 0, pointerType: "touch" });
    fireEvent.pointerMove(close, { pointerId: 1, clientY: 600, pointerType: "touch" });
    fireEvent.pointerUp(close, { pointerId: 1, clientY: 600, pointerType: "touch" });
    expect(onClose).not.toHaveBeenCalled();
  });
});
