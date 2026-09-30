import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BUDGET_STORAGE_KEY, monthBudget, readBudget, saveMonth,
} from "./budgetStorage";

const category = { id: "cat-1", name: "Food", limit: 500 };
const transaction = { id: "txn-1", name: "Lunch", amount: 80, categoryId: "cat-1" };
const january = { categories: [category], transactions: [transaction] };

beforeEach(() => localStorage.clear());

describe("budget storage", () => {
  it("does not save a viewed month; carries only limits from the nearest earlier saved month", () => {
    let snapshot = readBudget();
    snapshot = saveMonth(snapshot, "2025-01", january);
    snapshot = saveMonth(snapshot, "2025-04", {
      categories: [{ id: "cat-4", name: "Travel", limit: 900 }],
      transactions: [],
    });
    const march = monthBudget(snapshot.document, "2025-03");
    expect(march.categories).toMatchObject([{ name: "Food", limit: 500 }]);
    expect(march.categories[0].id).not.toBe(category.id);
    expect(march.transactions).toEqual([]);
    expect(monthBudget(snapshot.document, "2025-05").categories).toMatchObject([{ name: "Travel", limit: 900 }]);
    expect(monthBudget(snapshot.document, "2024-12")).toEqual({ categories: [], transactions: [] });
    expect(monthBudget(snapshot.document, "2025-01")).toEqual(january);
    expect(Object.keys(readBudget().document.months)).toEqual(["2025-01", "2025-04"]);
  });

  it("keeps saved months independent and refuses stale writes", () => {
    const original = readBudget();
    const januarySnapshot = saveMonth(original, "2025-01", january);
    expect(() => saveMonth(original, "2025-02", january)).toThrow(/another tab/);
    const februarySnapshot = saveMonth(januarySnapshot, "2025-02", {
      categories: [{ ...category, id: "cat-2", limit: 700 }], transactions: [],
    });
    expect(februarySnapshot.document.months["2025-01"]).toEqual(january);
    expect(monthBudget(februarySnapshot.document, "2025-02").transactions).toEqual([]);
  });

  it("copies the nearest earlier saved month without mutating its limits or transactions on edit", () => {
    let snapshot = readBudget();
    snapshot = saveMonth(snapshot, "2025-01", january);
    snapshot = saveMonth(snapshot, "2025-04", {
      categories: [{ id: "cat-apr", name: "Travel", limit: 900 }],
      transactions: [{ id: "txn-apr", name: "Train", categoryId: "cat-apr", amount: 60 }],
    });
    const previous = snapshot.document.months["2025-04"];
    const may = monthBudget(snapshot.document, "2025-05");
    expect(may.categories).toMatchObject([{ name: "Travel", limit: 900 }]);
    expect(may.transactions).toEqual([]);
    expect(may.categories[0].id).not.toBe(previous.categories[0].id);
    may.categories[0].limit = 1200;
    snapshot = saveMonth(snapshot, "2025-05", may);
    expect(snapshot.document.months["2025-01"]).toEqual(january);
    expect(snapshot.document.months["2025-04"]).toEqual(previous);
    expect(snapshot.document.months["2025-04"].categories[0].limit).toBe(900);
    expect(snapshot.document.months["2025-04"].transactions).toHaveLength(1);
  });

  it("rejects malformed documents, dangling transactions, invalid amounts and unsupported versions without changing storage", () => {
    localStorage.setItem(BUDGET_STORAGE_KEY, '{"version":99,"months":{}}');
    expect(() => readBudget()).toThrow(/unsupported version/);
    localStorage.setItem(BUDGET_STORAGE_KEY, "{broken");
    expect(() => readBudget()).toThrow(/not valid JSON/);
    localStorage.clear();
    const snapshot = readBudget();
    for (const data of [
      { categories: [{ ...category, limit: -1 }], transactions: [] },
      { categories: [{ ...category, limit: NaN }], transactions: [] },
      { categories: [{ ...category, limit: Infinity }], transactions: [] },
      { categories: [category], transactions: [{ ...transaction, amount: Infinity }] },
      { categories: [category], transactions: [{ ...transaction, amount: -1 }] },
      { categories: [category], transactions: [{ ...transaction, amount: NaN }] },
      { categories: [], transactions: [transaction] },
    ]) {
      expect(() => saveMonth(snapshot, "2025-01", data)).toThrow(/malformed/);
      expect(localStorage.getItem(BUDGET_STORAGE_KEY)).toBeNull();
    }
  });

  it("reports inaccessible and full storage without claiming a successful write", () => {
    const storage = { getItem: vi.fn(() => null), setItem: vi.fn(() => { throw new Error("quota"); }) };
    const snapshot = readBudget(storage);
    expect(() => saveMonth(snapshot, "2025-01", january, storage)).toThrow(/Cannot save/);
    storage.getItem.mockImplementation(() => { throw new Error("denied"); });
    expect(() => readBudget(storage)).toThrow(/Cannot read/);
  });
});
