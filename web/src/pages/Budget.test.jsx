import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import Budget, { parseAmount } from "./Budget";
import { BUDGET_CLEARED_EVENT, BUDGET_STORAGE_KEY } from "./budgetStorage";

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

function chooseMonth(month) {
  fireEvent.change(screen.getByLabelText("Calendar month"), { target: { value: month } });
}

function addCategory(name, amount) {
  fireEvent.click(screen.getByRole("button", { name: "Add category" }));
  fireEvent.change(within(screen.getByRole("dialog")).getByLabelText(/^Name/), { target: { value: name } });
  fireEvent.change(within(screen.getByRole("dialog")).getByLabelText(/^Monthly limit/), { target: { value: amount } });
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Save category" }));
}

function addTransaction(name, amount) {
  fireEvent.click(screen.getByRole("button", { name: "Add transaction" }));
  fireEvent.change(within(screen.getByRole("dialog")).getByLabelText(/^Name/), { target: { value: name } });
  fireEvent.change(within(screen.getByRole("dialog")).getByLabelText(/^Amount/), { target: { value: amount } });
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Save transaction" }));
}

describe("Budget", () => {
  it("invalidates an already-mounted budget and form draft on successful same-tab logout while allowing guest edits", () => {
    render(<Budget />);
    chooseMonth("2025-01");
    addCategory("Private category", "100");
    addTransaction("Private purchase", "30");
    fireEvent.click(screen.getByRole("button", { name: "Edit transaction Private purchase" }));
    expect(within(screen.getByRole("dialog")).getByLabelText(/^Name/)).toHaveValue("Private purchase");

    localStorage.removeItem(BUDGET_STORAGE_KEY);
    act(() => window.dispatchEvent(new Event(BUDGET_CLEARED_EVENT)));

    expect(localStorage.getItem(BUDGET_STORAGE_KEY)).toBeNull();
    expect(screen.queryByRole("heading", { name: "Private category" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Private purchase" })).not.toBeInTheDocument();
    expect(screen.getByText("No categories yet")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Monthly summary" })).getAllByText("0 kr")).toHaveLength(3);
    expect(screen.getByLabelText("Calendar month")).not.toHaveValue("2025-01");
    const closingDialog = screen.queryByRole("dialog");
    if (closingDialog) {
      expect(within(closingDialog).queryByDisplayValue("Private purchase")).not.toBeInTheDocument();
    }

    chooseMonth("2025-01");
    addCategory("Guest category", "50");
    expect(screen.getByRole("heading", { name: "Guest category" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(BUDGET_STORAGE_KEY)).months["2025-01"].categories)
      .toMatchObject([{ name: "Guest category", limit: 50 }]);
  });

  it("clears mounted data when another tab removes the budget key, not on unrelated storage changes", () => {
    render(<Budget />);
    chooseMonth("2025-01");
    addCategory("Private category", "100");
    const oldValue = localStorage.getItem(BUDGET_STORAGE_KEY);

    act(() => window.dispatchEvent(new StorageEvent("storage", {
      key: "another-key", oldValue: "before", newValue: null, storageArea: localStorage,
    })));
    expect(screen.getByRole("heading", { name: "Private category" })).toBeInTheDocument();
    act(() => window.dispatchEvent(new StorageEvent("storage", {
      key: BUDGET_STORAGE_KEY, oldValue, newValue: oldValue, storageArea: localStorage,
    })));
    expect(screen.getByRole("heading", { name: "Private category" })).toBeInTheDocument();

    localStorage.removeItem(BUDGET_STORAGE_KEY);
    act(() => window.dispatchEvent(new StorageEvent("storage", {
      key: BUDGET_STORAGE_KEY, oldValue, newValue: null, storageArea: localStorage,
    })));
    expect(screen.queryByRole("heading", { name: "Private category" })).not.toBeInTheDocument();
    expect(screen.getByText("No categories yet")).toBeInTheDocument();
    expect(screen.getByLabelText("Calendar month")).not.toHaveValue("2025-01");
  });

  it("rejects blank, negative and nonfinite amounts without accepting invalid numeric input", () => {
    for (const input of ["", "  ", "-1", "Infinity", "-Infinity", "NaN", "1e309", "not a number"]) {
      expect(() => parseAmount(input)).toThrow(/amount|Amount/);
    }
    expect(parseAmount("0")).toBe(0);
    expect(parseAmount("2.5")).toBe(2.5);
  });

  it("uses calendar months, carries limits without saving on view, and isolates transactions", () => {
    render(<Budget />);
    chooseMonth("2025-01");
    expect(localStorage.getItem(BUDGET_STORAGE_KEY)).toBeNull();
    addCategory("Food", "100");
    addTransaction("Lunch", "120");
    expect(screen.getByText("Over budget by 20 kr")).toBeInTheDocument();
    const summary = screen.getByRole("region", { name: "Monthly summary" });
    expect(within(summary).getByText("Over budget")).toBeInTheDocument();
    chooseMonth("2025-03");
    expect(screen.getByRole("heading", { name: "Food" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Lunch" })).not.toBeInTheDocument();
    expect(Object.keys(JSON.parse(localStorage.getItem(BUDGET_STORAGE_KEY)).months)).toEqual(["2025-01"]);
    const source = JSON.parse(localStorage.getItem(BUDGET_STORAGE_KEY)).months["2025-01"];
    fireEvent.click(screen.getByRole("button", { name: "Edit Food" }));
    fireEvent.change(within(screen.getByRole("dialog")).getByLabelText(/^Monthly limit/), { target: { value: "250" } });
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Save category" }));
    expect(JSON.parse(localStorage.getItem(BUDGET_STORAGE_KEY)).months["2025-01"]).toEqual(source);
    expect(screen.getByText(/Limit 250 kr/)).toBeInTheDocument();
    addTransaction("Coffee", "10");
    chooseMonth("2025-01");
    expect(screen.getByRole("heading", { name: "Lunch" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Coffee" })).not.toBeInTheDocument();
    expect(within(summary).getByText("120 kr")).toBeInTheDocument();
  });

  it("edits categories and transactions and cascades deletions in the selected month only", () => {
    render(<Budget />);
    chooseMonth("2025-01");
    addCategory("Food", "100");
    addTransaction("Lunch", "30");
    chooseMonth("2025-02");
    addTransaction("Dinner", "20");
    fireEvent.click(screen.getByRole("button", { name: "Edit Food" }));
    fireEvent.change(within(screen.getByRole("dialog")).getByLabelText(/^Monthly limit/), { target: { value: "150" } });
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Save category" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit transaction Dinner" }));
    fireEvent.change(within(screen.getByRole("dialog")).getByLabelText(/^Amount/), { target: { value: "25" } });
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Save transaction" }));
    expect(screen.getByRole("heading", { name: "Dinner" })).toBeInTheDocument();
    expect(screen.getByText(/Food.*25 kr/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete Food" }));
    expect(screen.getByRole("heading", { name: "Dinner" })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Delete Food?" }))
      .toHaveAccessibleDescription("This also deletes its transactions for 2025-02. Other months are unaffected.");
    fireEvent.click(within(screen.getByRole("dialog", { name: "Delete Food?" })).getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("heading", { name: "Dinner" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete Food" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Delete Food?" })).getByRole("button", { name: "Delete", exact: true }));
    expect(screen.queryByRole("heading", { name: "Dinner" })).not.toBeInTheDocument();
    const persisted = JSON.parse(localStorage.getItem(BUDGET_STORAGE_KEY)).months;
    expect(persisted["2025-02"]).toEqual({ categories: [], transactions: [] });
    expect(persisted["2025-01"].transactions).toHaveLength(1);
    chooseMonth("2025-01");
    expect(screen.getByRole("heading", { name: "Lunch" })).toBeInTheDocument();
    expect(screen.getByText(/Limit 100 kr/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete transaction Lunch" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Delete Lunch?" })).getByRole("button", { name: "Delete", exact: true }));
    expect(screen.queryByRole("heading", { name: "Lunch" })).not.toBeInTheDocument();
  });

  it("blocks malformed storage and failed writes with useful recovery messages", () => {
    localStorage.setItem(BUDGET_STORAGE_KEY, "{bad");
    render(<Budget />);
    expect(screen.getByRole("alert")).toHaveTextContent("not valid JSON");
    expect(screen.queryByRole("button", { name: "Add category" })).not.toBeInTheDocument();
    localStorage.clear();
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));
    chooseMonth("2025-01");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    addCategory("Food", "100");
    expect(screen.getByRole("alert")).toHaveTextContent("Cannot save");
    expect(screen.queryByRole("heading", { name: "Food" })).not.toBeInTheDocument();
    expect(localStorage.getItem(BUDGET_STORAGE_KEY)).toBeNull();
  });

  it("shows validation errors for negative amounts and preserves the previously saved month", () => {
    render(<Budget />);
    chooseMonth("2025-01");
    addCategory("Food", "100");
    const saved = localStorage.getItem(BUDGET_STORAGE_KEY);
    fireEvent.click(screen.getByRole("button", { name: "Edit Food" }));
    fireEvent.change(within(screen.getByRole("dialog")).getByLabelText(/^Monthly limit/), {
      target: { value: "-2" },
    });
    fireEvent.submit(within(screen.getByRole("dialog")).getByRole("button", { name: "Save category" }).closest("form"));
    expect(within(screen.getByRole("dialog")).getByRole("alert")).toHaveTextContent("finite, nonnegative");
    expect(localStorage.getItem(BUDGET_STORAGE_KEY)).toBe(saved);
    expect(screen.getByText(/Limit 100 kr/)).toBeInTheDocument();
  });

  it("reports read failures on reload without overwriting or displaying stale budget data", () => {
    render(<Budget />);
    chooseMonth("2025-01");
    addCategory("Food", "100");
    const saved = localStorage.getItem(BUDGET_STORAGE_KEY);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("denied"); });
    fireEvent.click(screen.getByRole("button", { name: "Edit Food" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Save category" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Cannot read budget storage");
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Cannot read budget storage");
    expect(screen.queryByRole("heading", { name: "Food" })).not.toBeInTheDocument();
    vi.restoreAllMocks();
    expect(localStorage.getItem(BUDGET_STORAGE_KEY)).toBe(saved);
  });

  it("warns on external storage changes rather than overwriting another tab's saved budget", () => {
    render(<Budget />);
    chooseMonth("2025-01");
    addCategory("Food", "100");
    const external = JSON.parse(localStorage.getItem(BUDGET_STORAGE_KEY));
    external.months["2025-01"].categories[0].limit = 300;
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(external));
    fireEvent.click(screen.getByRole("button", { name: "Edit Food" }));
    fireEvent.change(within(screen.getByRole("dialog")).getByLabelText(/^Monthly limit/), {
      target: { value: "200" },
    });
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Save category" }));
    expect(screen.getByRole("alert")).toHaveTextContent("changed in another tab");
    expect(JSON.parse(localStorage.getItem(BUDGET_STORAGE_KEY))).toEqual(external);
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));
    expect(screen.getByText(/Limit 300 kr/)).toBeInTheDocument();
  });

  it("provides form labels and explains the empty state", () => {
    render(<Budget />);
    expect(screen.getByText(/Budgets stay on this device, are not synced to your account, and are cleared when you sign out/))
      .toBeVisible();
    expect(screen.getByLabelText("Calendar month")).toHaveAttribute("type", "month");
    expect(screen.getByText("No categories yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add transaction" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Add category" }));
    expect(within(screen.getByRole("dialog")).getByLabelText(/^Monthly limit/)).toHaveAttribute("min", "0");
  });
});
