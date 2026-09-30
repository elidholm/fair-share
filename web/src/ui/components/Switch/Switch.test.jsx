import React, { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Switch from "./Switch.jsx";

describe("Switch", () => {
  it("exposes role=switch with its label", () => {
    render(<Switch label="Split equally" />);
    const control = screen.getByRole("switch", { name: "Split equally" });
    expect(control).toHaveAttribute("aria-checked", "false");
  });

  it("toggles uncontrolled state and reports changes", () => {
    const onChange = vi.fn();
    render(<Switch label="Split equally" defaultChecked onChange={onChange} />);
    const control = screen.getByRole("switch");
    expect(control).toHaveAttribute("aria-checked", "true");
    fireEvent.click(control);
    expect(control).toHaveAttribute("aria-checked", "false");
    expect(onChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it("respects controlled state", () => {
    const onChange = vi.fn();
    render(<Switch label="Split" checked={false} onChange={onChange} />);
    const control = screen.getByRole("switch");
    fireEvent.click(control);
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
    expect(control).toHaveAttribute("aria-checked", "false");
  });

  it("works as a controlled component", () => {
    function Harness() {
      const [on, setOn] = useState(false);
      return <Switch label="Split" checked={on} onChange={setOn} />;
    }
    render(<Harness />);
    const control = screen.getByRole("switch");
    fireEvent.click(control);
    expect(control).toHaveAttribute("aria-checked", "true");
  });

  it("toggles when the label is clicked", () => {
    render(<Switch label="Split" />);
    fireEvent.click(screen.getByText("Split"));
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("does not toggle when disabled", () => {
    const onChange = vi.fn();
    render(<Switch label="Split" disabled onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("links its description", () => {
    render(<Switch label="Split" description="Ignore income differences" />);
    expect(screen.getByRole("switch")).toHaveAccessibleDescription("Ignore income differences");
  });

  it("participates in forms when named", () => {
    const { container } = render(<form><Switch label="Split" name="split" defaultChecked /></form>);
    expect(new FormData(container.querySelector("form")).get("split")).toBe("on");
    fireEvent.click(screen.getByRole("switch"));
    expect(new FormData(container.querySelector("form")).get("split")).toBeNull();
  });
});
