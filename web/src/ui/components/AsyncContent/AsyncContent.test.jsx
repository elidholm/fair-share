import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import AsyncContent from "./AsyncContent.jsx";

describe("AsyncContent", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders content when ready", () => {
    render(<AsyncContent>Loaded</AsyncContent>);
    expect(screen.getByText("Loaded")).toBeInTheDocument();
  });

  it("only calls render-function children when ready", () => {
    const renderContent = vi.fn(() => "Data");
    const { rerender } = render(<AsyncContent loading>{renderContent}</AsyncContent>);
    expect(renderContent).not.toHaveBeenCalled();
    rerender(<AsyncContent>{renderContent}</AsyncContent>);
    expect(screen.getByText("Data")).toBeInTheDocument();
  });

  it("delays the skeleton to avoid flashing on fast loads", () => {
    vi.useFakeTimers();
    const { container } = render(
      <AsyncContent loading skeleton={<div data-testid="skeleton" />}>Loaded</AsyncContent>,
    );
    expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Loading");

    act(() => vi.advanceTimersByTime(150));
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    expect(screen.queryByText("Loaded")).not.toBeInTheDocument();
  });

  it("shows the skeleton immediately with delay=0", () => {
    render(<AsyncContent loading delay={0} skeleton={<div data-testid="skeleton" />} />);
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
  });

  it("shows an error with retry", () => {
    const onRetry = vi.fn();
    render(<AsyncContent error={new Error("Network down")} onRetry={onRetry}>Loaded</AsyncContent>);
    expect(screen.getByRole("alert")).toHaveTextContent("Network down");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Loaded")).not.toBeInTheDocument();
  });

  it("accepts a string error and omits retry without onRetry", () => {
    render(<AsyncContent error="Oops" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Oops");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a default or custom empty state", () => {
    const { rerender } = render(<AsyncContent isEmpty>Loaded</AsyncContent>);
    expect(screen.getByRole("heading", { name: "Nothing here yet" })).toBeInTheDocument();
    rerender(<AsyncContent isEmpty empty={<p>No expenses</p>}>Loaded</AsyncContent>);
    expect(screen.getByText("No expenses")).toBeInTheDocument();
    expect(screen.queryByText("Loaded")).not.toBeInTheDocument();
  });
});
