import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Card from "../Card/Card.jsx";
import Skeleton from "../Skeleton/Skeleton.jsx";
import Spinner from "../Spinner/Spinner.jsx";
import VisuallyHidden from "./VisuallyHidden.jsx";

describe("Card", () => {
  it("renders the requested element and material", () => {
    render(<Card as="section" material="thick" padding="lg" aria-label="Summary">Hi</Card>);
    const card = screen.getByRole("region", { name: "Summary" });
    expect(card.tagName).toBe("SECTION");
    expect(card).toHaveClass("fs-card--thick", "fs-card--pad-lg");
  });

  it("marks interactive cards", () => {
    render(<Card as="button" interactive>Open</Card>);
    expect(screen.getByRole("button", { name: "Open" })).toHaveClass("fs-card--interactive");
  });
});

describe("Skeleton", () => {
  it("is hidden from assistive tech", () => {
    const { container } = render(<Skeleton variant="circle" width={40} height={40} />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    expect(container.firstChild).toHaveStyle({ width: "40px", height: "40px" });
  });

  it("renders multiple text lines", () => {
    const { container } = render(<Skeleton lines={3} />);
    expect(container.querySelectorAll(".fs-skeleton")).toHaveLength(3);
  });
});

describe("Spinner", () => {
  it("is decorative without a label", () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("announces its label", () => {
    render(<Spinner label="Syncing" />);
    expect(screen.getByRole("status")).toHaveTextContent("Syncing");
  });
});

describe("VisuallyHidden", () => {
  it("renders content with the hidden class", () => {
    render(<VisuallyHidden as="div">Secret</VisuallyHidden>);
    const element = screen.getByText("Secret");
    expect(element.tagName).toBe("DIV");
    expect(element).toHaveClass("fs-visually-hidden");
  });
});
