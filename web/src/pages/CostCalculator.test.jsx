import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import CostCalculator from "./CostCalculator";
import { useAuth } from "../context/AuthContext";

vi.mock("../context/AuthContext");

const SHEET_TIMEOUT = { timeout: 3000 };

function seed(incomes, expenses) {
  if (incomes) localStorage.setItem("incomes", JSON.stringify(incomes));
  if (expenses) localStorage.setItem("expenses", JSON.stringify(expenses));
}

function loginAs(username = "testuser") {
  vi.mocked(useAuth).mockReturnValue({ user: { username } });
}

function jsonResponse(body, ok = true, status = ok ? 200 : 500) {
  return Promise.resolve({ ok, status, json: async () => body });
}

/** Routes fetch by method + URL; unhandled calls reject so tests notice them. */
function mockApi(handlers) {
  global.fetch = vi.fn((url, options = {}) => {
    const method = options.method ?? "GET";
    const handler = handlers[`${method} ${url}`];
    if (!handler) return Promise.reject(new Error(`Unexpected ${method} ${url}`));
    return handler(options);
  });
  return global.fetch;
}

function addEntry(kind, name) {
  const label = kind === "income" ? "New income" : "New expense";
  fireEvent.change(screen.getByLabelText(label), { target: { value: name } });
  fireEvent.click(screen.getByRole("button", { name: kind === "income" ? "Add income" : "Add expense" }));
}

function splitButton() {
  return screen.getByRole("button", { name: "Split expenses" });
}

function shares() {
  return within(screen.getByRole("list", { name: "Shares" })).getAllByRole("listitem");
}

describe("CostCalculator", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: null });
    localStorage.clear();
    global.fetch = vi.fn(() => Promise.reject(new Error("fetch should not be called")));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("anonymous, localStorage only", () => {
    it("loads incomes and expenses from localStorage", () => {
      seed([{ name: "Test1", amount: 1000 }, { name: "Test2", amount: 2000 }], [{ name: "Rent", amount: 500 }]);
      render(<CostCalculator />);

      expect(screen.getByLabelText("Income for Test1")).toHaveValue(1000);
      expect(screen.getByLabelText("Income for Test2")).toHaveValue(2000);
      expect(screen.getByLabelText("Amount for Rent")).toHaveValue(500);
      expect(screen.getByRole("status", { name: "Total incomes" })).toHaveTextContent("3000 kr");
      expect(screen.getByRole("status", { name: "Total expenses" })).toHaveTextContent("500 kr");
      expect(fetch).not.toHaveBeenCalled();
    });

    it("shows empty states with guidance when nothing is saved", () => {
      render(<CostCalculator />);
      expect(screen.getByRole("heading", { name: "No incomes yet" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "No expenses yet" })).toBeInTheDocument();
    });

    it("adds, edits and persists an income", () => {
      render(<CostCalculator />);
      addEntry("income", "  Alice  ");

      const input = screen.getByLabelText("Income for Alice");
      expect(input).toHaveValue(null);
      fireEvent.change(input, { target: { value: "1000" } });
      expect(input).toHaveValue(1000);
      expect(JSON.parse(localStorage.getItem("incomes"))).toEqual([{ name: "Alice", amount: 1000 }]);
      expect(screen.getByLabelText("New income")).toHaveValue("");
    });

    it("adds an entry with the Enter key", () => {
      render(<CostCalculator />);
      const field = screen.getByLabelText("New expense");
      fireEvent.change(field, { target: { value: "Netflix" } });
      fireEvent.submit(field.closest("form"));
      expect(screen.getByLabelText("Amount for Netflix")).toBeInTheDocument();
    });

    it("explains instead of silently ignoring an empty name", () => {
      render(<CostCalculator />);
      fireEvent.click(screen.getByRole("button", { name: "Add income" }));
      expect(screen.getByLabelText("New income")).toHaveAccessibleDescription("Enter a name to add an income.");
      expect(localStorage.getItem("incomes")).toBeNull();
    });

    it("clears an amount back to empty", () => {
      seed([{ name: "Test", amount: 1000 }]);
      render(<CostCalculator />);
      const input = screen.getByLabelText("Income for Test");
      fireEvent.change(input, { target: { value: "" } });
      expect(input).toHaveValue(null);
      expect(JSON.parse(localStorage.getItem("incomes"))).toEqual([{ name: "Test", amount: "" }]);
    });

    it("does not accept text in amount fields", () => {
      seed([{ name: "Test", amount: "" }], [{ name: "Rent", amount: "" }]);
      render(<CostCalculator />);
      const income = screen.getByLabelText("Income for Test");
      const expense = screen.getByLabelText("Amount for Rent");
      fireEvent.change(income, { target: { value: "abc" } });
      fireEvent.change(expense, { target: { value: "abc" } });
      expect(income).toHaveValue(null);
      expect(expense).toHaveValue(null);
    });

    it("removes income and expense rows", () => {
      seed([{ name: "Alice", amount: 1000 }], [{ name: "Rent", amount: 500 }]);
      render(<CostCalculator />);

      fireEvent.click(screen.getByRole("button", { name: "Remove income Alice" }));
      fireEvent.click(screen.getByRole("button", { name: "Remove expense Rent" }));

      expect(screen.queryByLabelText("Income for Alice")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Amount for Rent")).not.toBeInTheDocument();
      expect(JSON.parse(localStorage.getItem("incomes"))).toEqual([]);
      expect(JSON.parse(localStorage.getItem("expenses"))).toEqual([]);
    });

    it("gives duplicate names unique accessible names", () => {
      seed(null, [{ name: "Rent", amount: 1 }, { name: "Rent", amount: 2 }]);
      render(<CostCalculator />);

      expect(screen.getByLabelText("Amount for Rent (1)")).toHaveValue(1);
      expect(screen.getByLabelText("Amount for Rent (2)")).toHaveValue(2);
      fireEvent.click(screen.getByRole("button", { name: "Remove expense Rent (2)" }));
      expect(screen.getByLabelText("Amount for Rent")).toHaveValue(1);
    });

    it("warns about unreadable saved data instead of crashing", () => {
      localStorage.setItem("incomes", "{not json");
      render(<CostCalculator />);
      expect(screen.getByRole("alert")).toHaveTextContent(/Saved incomes on this device couldn’t be read/);
      expect(screen.getByRole("heading", { name: "No incomes yet" })).toBeInTheDocument();
    });

    it("reports when saving to this device fails", () => {
      seed([{ name: "Alice", amount: 1 }]);
      render(<CostCalculator />);
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
      fireEvent.change(screen.getByLabelText("Income for Alice"), { target: { value: "2" } });
      expect(screen.getByRole("alert")).toHaveTextContent(/Couldn’t save incomes on this device/);
    });
  });

  describe("splitting", () => {
    it("splits proportionally to income by default", () => {
      seed([{ name: "Person1", amount: 6000 }, { name: "Person2", amount: 4000 }], [{ name: "Expense1", amount: 1000 }]);
      render(<CostCalculator />);

      expect(screen.getByRole("switch", { name: "Split equally" })).toHaveAttribute("aria-checked", "false");
      fireEvent.click(splitButton());

      const [first, second] = shares();
      expect(first).toHaveTextContent("Person1's share600.00 kr (60.00%)");
      expect(second).toHaveTextContent("Person2's share400.00 kr (40.00%)");
    });

    it("splits equally when the switch is on, and updates live", () => {
      seed([{ name: "PersonA", amount: 8000 }, { name: "PersonB", amount: 2000 }], [{ name: "Shared", amount: 1000 }]);
      render(<CostCalculator />);

      fireEvent.click(splitButton());
      expect(shares()[0]).toHaveTextContent("800.00 kr (80.00%)");

      fireEvent.click(screen.getByRole("switch", { name: "Split equally" }));
      expect(screen.getByRole("switch", { name: "Split equally" })).toHaveAttribute("aria-checked", "true");
      shares().forEach((share) => expect(share).toHaveTextContent("500.00 kr (50.00%)"));
    });

    it("uses precise percentages rather than rounded shares", () => {
      seed([{ name: "A", amount: 30000 }, { name: "B", amount: 25000 }], [{ name: "Rent", amount: 12500 }]);
      render(<CostCalculator />);
      fireEvent.click(splitButton());
      expect(shares()[0]).toHaveTextContent("6818.18 kr (54.55%)");
      expect(shares()[1]).toHaveTextContent("5681.82 kr (45.45%)");
    });

    it("blocks splitting when there are no people", () => {
      seed(null, [{ name: "Rent", amount: 1000 }]);
      render(<CostCalculator />);
      fireEvent.click(splitButton());

      expect(screen.getByText("Add at least one person under Incomes before splitting.")).toBeInTheDocument();
      expect(screen.queryByRole("list", { name: "Shares" })).not.toBeInTheDocument();
    });

    it("blocks a proportional split when total income is zero, but allows an equal split", () => {
      seed([{ name: "A", amount: 0 }, { name: "B", amount: 0 }], [{ name: "Rent", amount: 1000 }]);
      render(<CostCalculator />);
      fireEvent.click(splitButton());

      expect(screen.getByText(/Total income is 0 kr/)).toBeInTheDocument();
      expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("switch", { name: "Split equally" }));
      shares().forEach((share) => expect(share).toHaveTextContent("500.00 kr (50.00%)"));
    });

    it("flags missing amounts inline once a split is requested", () => {
      seed([{ name: "Alice", amount: 1000 }, { name: "Bob", amount: "" }], [{ name: "Rent", amount: "" }]);
      render(<CostCalculator />);

      expect(screen.getByLabelText("Income for Bob")).not.toHaveAttribute("aria-invalid");
      fireEvent.click(splitButton());

      expect(screen.getByText("Enter an income for Bob, or turn on Split equally.")).toBeInTheDocument();
      expect(screen.getByText("Enter a valid amount for Rent, or remove it.")).toBeInTheDocument();
      expect(screen.getByLabelText("Income for Bob")).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByLabelText("Amount for Rent")).toHaveAccessibleDescription("Enter an amount, or remove this row.");

      // Incomes aren't needed for an equal split.
      fireEvent.click(screen.getByRole("switch", { name: "Split equally" }));
      expect(screen.getByLabelText("Income for Bob")).not.toHaveAttribute("aria-invalid");
      expect(screen.queryByText(/Enter an income for Bob/)).not.toBeInTheDocument();

      fireEvent.change(screen.getByLabelText("Amount for Rent"), { target: { value: "900" } });
      shares().forEach((share) => expect(share).toHaveTextContent("450.00 kr (50.00%)"));
    });

    it("rejects negative amounts with inline guidance and excludes them from totals", () => {
      seed([{ name: "Alice", amount: 1000 }], [{ name: "Rent", amount: 500 }]);
      render(<CostCalculator />);

      fireEvent.change(screen.getByLabelText("Amount for Rent"), { target: { value: "-5" } });
      expect(screen.getByLabelText("Amount for Rent")).toHaveAccessibleDescription("Amount can’t be negative.");
      expect(screen.getByRole("status", { name: "Total expenses" })).toHaveTextContent("0 kr");

      fireEvent.click(splitButton());
      expect(screen.getByText("Enter a valid amount for Rent, or remove it.")).toBeInTheDocument();
      expect(screen.queryByRole("list", { name: "Shares" })).not.toBeInTheDocument();
    });

    it("rejects non-finite amounts from saved data", () => {
      seed([{ name: "Alice", amount: "1e400" }], [{ name: "Rent", amount: 500 }]);
      render(<CostCalculator />);

      expect(screen.getByLabelText("Income for Alice")).toHaveAccessibleDescription("Enter a number, like 1200.");
      fireEvent.click(splitButton());
      expect(screen.getByText("Fix the income for Alice.")).toBeInTheDocument();
      expect(screen.queryByText(/NaN|Infinity/)).not.toBeInTheDocument();
    });
  });

  describe("reset", () => {
    it("asks for confirmation and keeps data when cancelled", async () => {
      seed([{ name: "Alice", amount: 1000 }]);
      render(<CostCalculator />);

      fireEvent.click(screen.getByRole("button", { name: "Reset calculator" }));
      const dialog = screen.getByRole("dialog", { name: "Reset calculator?" });
      fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument(), SHEET_TIMEOUT);
      expect(screen.getByLabelText("Income for Alice")).toHaveValue(1000);
      expect(localStorage.getItem("incomes")).not.toBeNull();
    });

    it("clears localStorage for anonymous users without calling the API", async () => {
      seed([{ name: "Alice", amount: 1000 }], [{ name: "Rent", amount: 500 }]);
      render(<CostCalculator />);

      fireEvent.click(screen.getByRole("button", { name: "Reset calculator" }));
      fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Reset" }));

      await waitFor(() => expect(screen.getByText("Calculator reset.")).toBeInTheDocument());
      expect(localStorage.getItem("incomes")).toBeNull();
      expect(localStorage.getItem("expenses")).toBeNull();
      expect(screen.getByRole("heading", { name: "No incomes yet" })).toBeInTheDocument();
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe("signed in", () => {
    beforeEach(() => loginAs());

    it("loads from the API and mirrors it to localStorage", async () => {
      mockApi({
        "GET /api/incomes": () => jsonResponse({ incomes: [{ name: "DB Income", amount: 3000 }] }),
        "GET /api/expenses": () => jsonResponse({ expenses: [{ name: "DB Expense", amount: 69 }] }),
      });
      render(<CostCalculator />);

      expect(await screen.findByLabelText("Income for DB Income")).toHaveValue(3000);
      expect(screen.getByLabelText("Amount for DB Expense")).toHaveValue(69);
      expect(fetch).toHaveBeenCalledWith("/api/incomes", expect.objectContaining({ credentials: "include" }));
      expect(JSON.parse(localStorage.getItem("incomes"))).toEqual([{ name: "DB Income", amount: 3000 }]);
    });

    it("uploads local data when the account has none", async () => {
      seed([{ name: "Local", amount: 10 }]);
      const fetchMock = mockApi({
        "GET /api/incomes": () => jsonResponse({ incomes: [] }),
        "GET /api/expenses": () => jsonResponse({ expenses: [] }),
        "POST /api/incomes": () => jsonResponse({}),
      });
      render(<CostCalculator />);

      expect(await screen.findByLabelText("Income for Local")).toHaveValue(10);
      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith("/api/incomes", expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ incomes: [{ name: "Local", amount: 10 }] }),
        })),
      );
    });

    it("falls back to local data and offers a retry when loading fails", async () => {
      seed([{ name: "Local", amount: 10 }]);
      let incomesAttempts = 0;
      mockApi({
        "GET /api/incomes": () => {
          incomesAttempts += 1;
          return incomesAttempts === 1
            ? jsonResponse({}, false, 500)
            : jsonResponse({ incomes: [{ name: "Remote", amount: 20 }] });
        },
        "GET /api/expenses": () => jsonResponse({ expenses: [] }),
      });
      render(<CostCalculator />);

      const warning = await screen.findByText("Couldn’t load your saved incomes");
      expect(screen.getByLabelText("Income for Local")).toHaveValue(10);

      fireEvent.click(within(warning.closest('[role="status"]')).getByRole("button", { name: "Try again" }));
      expect(await screen.findByLabelText("Income for Remote")).toHaveValue(20);
      expect(screen.queryByText("Couldn’t load your saved incomes")).not.toBeInTheDocument();
    });

    it("saves edits to the API and localStorage", async () => {
      const fetchMock = mockApi({
        "GET /api/incomes": () => jsonResponse({ incomes: [{ name: "A", amount: 1 }] }),
        "GET /api/expenses": () => jsonResponse({ expenses: [] }),
        "POST /api/incomes": () => jsonResponse({}),
      });
      render(<CostCalculator />);

      fireEvent.change(await screen.findByLabelText("Income for A"), { target: { value: "5" } });
      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith("/api/incomes", expect.objectContaining({
          method: "POST",
          credentials: "include",
          body: JSON.stringify({ incomes: [{ name: "A", amount: 5 }] }),
        })),
      );
      expect(JSON.parse(localStorage.getItem("incomes"))).toEqual([{ name: "A", amount: 5 }]);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("reports a failed save, keeps the local copy, and recovers on retry", async () => {
      let fail = true;
      mockApi({
        "GET /api/incomes": () => jsonResponse({ incomes: [] }),
        "GET /api/expenses": () => jsonResponse({ expenses: [{ name: "Rent", amount: 1 }] }),
        "POST /api/expenses": () => (fail ? Promise.reject(new Error("offline")) : jsonResponse({})),
      });
      render(<CostCalculator />);

      fireEvent.change(await screen.findByLabelText("Amount for Rent"), { target: { value: "2" } });
      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("Couldn’t save expenses to your account");
      expect(JSON.parse(localStorage.getItem("expenses"))).toEqual([{ name: "Rent", amount: 2 }]);

      fail = false;
      fireEvent.click(within(alert).getByRole("button", { name: "Retry" }));
      await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    });

    it("clears both the API and localStorage on confirmed reset", async () => {
      seed([{ name: "Local Income", amount: 1000 }], [{ name: "Local Expense", amount: 500 }]);
      const fetchMock = mockApi({
        "GET /api/incomes": () => jsonResponse({ incomes: [{ name: "DB Income", amount: 3000 }] }),
        "GET /api/expenses": () => jsonResponse({ expenses: [{ name: "DB Expense", amount: 69 }] }),
        "DELETE /api/incomes": () => jsonResponse({}),
        "DELETE /api/expenses": () => jsonResponse({}),
      });
      render(<CostCalculator />);
      await screen.findByLabelText("Income for DB Income");

      fireEvent.click(screen.getByRole("button", { name: "Reset calculator" }));
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAccessibleDescription(/from this device and from your account/);
      fireEvent.click(within(dialog).getByRole("button", { name: "Reset" }));

      expect(await screen.findByText("Calculator reset on this device and in your account.")).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledWith("/api/incomes", { method: "DELETE", credentials: "include" });
      expect(fetchMock).toHaveBeenCalledWith("/api/expenses", { method: "DELETE", credentials: "include" });
      expect(localStorage.getItem("incomes")).toBeNull();
      expect(localStorage.getItem("expenses")).toBeNull();
      expect(screen.getByRole("status", { name: "Total incomes" })).toHaveTextContent("0 kr");
      expect(fetchMock).not.toHaveBeenCalledWith("/api/incomes", expect.objectContaining({ method: "POST" }));
    });

    it("does not report success or clear local data when the remote reset fails", async () => {
      mockApi({
        "GET /api/incomes": () => jsonResponse({ incomes: [{ name: "A", amount: 1 }] }),
        "GET /api/expenses": () => jsonResponse({ expenses: [{ name: "Rent", amount: 1 }] }),
        "DELETE /api/incomes": () => jsonResponse({}),
        "DELETE /api/expenses": () => jsonResponse({ error: "boom" }, false, 500),
      });
      render(<CostCalculator />);
      await screen.findByLabelText("Income for A");

      fireEvent.click(screen.getByRole("button", { name: "Reset calculator" }));
      const dialog = screen.getByRole("dialog");
      fireEvent.click(within(dialog).getByRole("button", { name: "Reset" }));

      const alert = await within(dialog).findByRole("alert");
      expect(alert).toHaveTextContent(/incomes were cleared from your account, but your expenses couldn’t be/);
      expect(alert).toHaveTextContent(/Nothing was removed from this device/);
      expect(screen.queryByText(/Calculator reset/)).not.toBeInTheDocument();
      expect(localStorage.getItem("expenses")).not.toBeNull();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });
});
