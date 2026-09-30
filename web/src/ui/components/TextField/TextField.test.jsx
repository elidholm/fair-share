import React, { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TextField from "./TextField.jsx";

describe("TextField", () => {
  it("associates the label with the input", () => {
    render(<TextField label="Name" />);
    expect(screen.getByLabelText("Name")).toBeInstanceOf(HTMLInputElement);
  });

  it("uses a provided id", () => {
    render(<TextField label="Name" id="name" />);
    expect(screen.getByLabelText("Name")).toHaveAttribute("id", "name");
  });

  it("keeps a visually hidden label accessible", () => {
    render(<TextField label="Search" hideLabel />);
    expect(screen.getByText("Search")).toHaveClass("fs-visually-hidden");
    expect(screen.getByLabelText("Search")).toBeInTheDocument();
  });

  it("describes the input with its hint", () => {
    render(<TextField label="Amount" hint="Monthly, after tax" />);
    expect(screen.getByLabelText("Amount")).toHaveAccessibleDescription("Monthly, after tax");
  });

  it("marks errors as invalid and describes them", () => {
    render(<TextField label="Amount" hint="Monthly" error="Must be positive" />);
    const input = screen.getByLabelText("Amount");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Monthly Must be positive");
  });

  it("merges a caller-provided aria-describedby", () => {
    render(
      <>
        <p id="extra">Extra help</p>
        <TextField label="Amount" aria-describedby="extra" error="Required" />
      </>,
    );
    expect(screen.getByLabelText("Amount")).toHaveAccessibleDescription("Extra help Required");
  });

  it("renders prefix/suffix and forwards input props and ref", () => {
    const onChange = vi.fn();
    const ref = createRef();
    render(
      <TextField
        label="Rent"
        suffix="kr"
        type="number"
        inputMode="decimal"
        value="10"
        onChange={onChange}
        ref={ref}
      />,
    );
    const input = screen.getByLabelText("Rent");
    expect(screen.getByText("kr")).toBeInTheDocument();
    expect(input).toHaveAttribute("inputmode", "decimal");
    expect(ref.current).toBe(input);
    fireEvent.change(input, { target: { value: "12" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("passes required and disabled to the input", () => {
    render(<TextField label="Email" required disabled />);
    const input = screen.getByLabelText(/Email/);
    expect(input).toBeRequired();
    expect(input).toBeDisabled();
  });
});
