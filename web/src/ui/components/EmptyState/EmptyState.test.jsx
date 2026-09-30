import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Inbox } from "react-feather";
import EmptyState from "./EmptyState.jsx";

describe("EmptyState", () => {
  it("renders title, description and actions", () => {
    render(
      <EmptyState
        icon={<Inbox />}
        title="No expenses yet"
        description="Add your first shared cost."
        actions={<button>Add expense</button>}
      />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "No expenses yet" })).toBeInTheDocument();
    expect(screen.getByText("Add your first shared cost.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add expense" })).toBeInTheDocument();
  });

  it("supports a custom heading level for document outline", () => {
    render(<EmptyState title="Empty" headingLevel={3} />);
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });
});
