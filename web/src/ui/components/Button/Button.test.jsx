import React, { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Plus } from "react-feather";
import Button from "./Button.jsx";

describe("Button", () => {
  it("renders an accessible button that defaults to type=button", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("fs-button", "fs-button--primary", "fs-button--md");
  });

  it("applies variant, size and fullWidth classes", () => {
    render(<Button variant="destructive" size="lg" fullWidth>Delete</Button>);
    expect(screen.getByRole("button")).toHaveClass(
      "fs-button--destructive",
      "fs-button--lg",
      "fs-button--full-width",
    );
  });

  it("calls onClick and forwards extra props and ref", () => {
    const onClick = vi.fn();
    const ref = createRef();
    render(<Button onClick={onClick} ref={ref} data-testid="cta">Go</Button>);
    fireEvent.click(screen.getByTestId("cta"));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("does not fire onClick when disabled", () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("stays focusable but inert while loading, and announces busy state", () => {
    const onClick = vi.fn();
    render(<Button loading loadingLabel="Saving" onClick={onClick}>Save</Button>);
    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveTextContent("Saving");
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not submit a form while loading", () => {
    const onSubmit = vi.fn((event) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" loading>Send</Button>
      </form>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("renders decorative icons hidden from assistive tech", () => {
    const { container } = render(<Button iconStart={<Plus />}>Add</Button>);
    expect(container.querySelector(".fs-button__icon")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });
});
