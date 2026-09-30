import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Trash2 } from "react-feather";
import IconButton from "./IconButton.jsx";

describe("IconButton", () => {
  it("uses label as the accessible name and tooltip", () => {
    render(<IconButton label="Delete item"><Trash2 /></IconButton>);
    const button = screen.getByRole("button", { name: "Delete item" });
    expect(button).toHaveAttribute("title", "Delete item");
    expect(button).toHaveAttribute("type", "button");
  });

  it("can suppress the tooltip", () => {
    render(<IconButton label="Delete" showTooltip={false}><Trash2 /></IconButton>);
    expect(screen.getByRole("button")).not.toHaveAttribute("title");
  });

  it("applies variant/size classes and handles clicks", () => {
    const onClick = vi.fn();
    render(<IconButton label="Delete" variant="destructive" size="sm" onClick={onClick}><Trash2 /></IconButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("fs-icon-button--destructive", "fs-icon-button--sm");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
