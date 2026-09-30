import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Alert from "./Alert.jsx";

describe("Alert", () => {
  it("uses role=status for non-error tones", () => {
    render(<Alert tone="success" title="Saved">Your changes are synced.</Alert>);
    const alert = screen.getByRole("status");
    expect(alert).toHaveTextContent("Saved");
    expect(alert).toHaveClass("fs-alert--success");
  });

  it("uses role=alert for errors", () => {
    render(<Alert tone="error">Failed</Alert>);
    expect(screen.getByRole("alert")).toHaveTextContent("Failed");
  });

  it("renders an action and a dismiss button", () => {
    const onDismiss = vi.fn();
    render(<Alert action={<button>Undo</button>} onDismiss={onDismiss}>Removed</Alert>);
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
