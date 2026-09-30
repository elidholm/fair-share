import React, { createRef } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LinkButton from "./LinkButton.jsx";

describe("LinkButton", () => {
  it("retains link semantics and forwards router destinations", () => {
    render(
      <MemoryRouter>
        <LinkButton to="/budget" variant="secondary" size="lg">Plan Budget</LinkButton>
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Plan Budget" }))
      .toHaveAttribute("href", "/budget");
    expect(screen.getByRole("link")).toHaveClass("fs-button--secondary", "fs-button--lg");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("forwards ref, accessible description and full-width layout", () => {
    const ref = createRef();
    render(
      <MemoryRouter>
        <p id="budget-help">Stored on this device</p>
        <LinkButton
          ref={ref}
          to="/budget"
          fullWidth
          aria-describedby="budget-help"
        >Budget</LinkButton>
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: "Budget" });
    expect(ref.current).toBe(link);
    expect(link).toHaveClass("fs-button--full-width");
    expect(link).toHaveAccessibleDescription("Stored on this device");
  });
});
