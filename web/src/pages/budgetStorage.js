export const BUDGET_STORAGE_KEY = "fairshare:budget";
export const BUDGET_CLEARED_EVENT = "fairshare:budget-cleared";
export const BUDGET_SCHEMA_VERSION = 1;

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isMonth(value) {
  return typeof value === "string" && monthPattern.test(value);
}

function validAmount(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function validId(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateMonth(data) {
  if (!data || typeof data !== "object" || Array.isArray(data) ||
    !Array.isArray(data.categories) || !Array.isArray(data.transactions)) {
    throw new Error("Budget data is malformed. Restore or remove the saved budget before editing.");
  }
  const ids = new Set();
  const names = new Set();
  for (const category of data.categories) {
    if (!category || !validId(category.id) || typeof category.name !== "string" ||
      !category.name.trim() || !validAmount(category.limit) ||
      ids.has(category.id) || names.has(category.name.trim().toLocaleLowerCase())) {
      throw new Error("Budget categories are malformed. Restore the saved budget before editing.");
    }
    ids.add(category.id);
    names.add(category.name.trim().toLocaleLowerCase());
  }
  const transactionIds = new Set();
  for (const transaction of data.transactions) {
    if (!transaction || !validId(transaction.id) ||
      typeof transaction.name !== "string" || !transaction.name.trim() ||
      !validAmount(transaction.amount) || !ids.has(transaction.categoryId) ||
      transactionIds.has(transaction.id)) {
      throw new Error("Budget transactions are malformed. Restore the saved budget before editing.");
    }
    transactionIds.add(transaction.id);
  }
}

function validateDocument(document) {
  if (!document || typeof document !== "object" || Array.isArray(document) ||
    document.version !== BUDGET_SCHEMA_VERSION || !document.months ||
    typeof document.months !== "object" || Array.isArray(document.months)) {
    throw new Error("Budget data has an unsupported version or is malformed. Restore the saved budget before editing.");
  }
  for (const [month, data] of Object.entries(document.months)) {
    if (!isMonth(month)) throw new Error("Budget data contains an invalid month.");
    validateMonth(data);
  }
}

export function readBudget(storage = localStorage) {
  let raw;
  try {
    raw = storage.getItem(BUDGET_STORAGE_KEY);
  } catch {
    throw new Error("Cannot read budget storage. Check your browser storage settings and retry.");
  }
  if (raw === null) return emptyBudgetSnapshot();
  let document;
  try {
    document = JSON.parse(raw);
  } catch {
    throw new Error("Budget data is not valid JSON. Restore or remove the saved budget before editing.");
  }
  validateDocument(document);
  return { raw, document };
}

export function emptyBudgetSnapshot() {
  return { raw: null, document: { version: BUDGET_SCHEMA_VERSION, months: {} } };
}

export function monthBudget(document, month) {
  if (!isMonth(month)) throw new Error("Select a valid calendar month.");
  if (Object.hasOwn(document.months, month)) return document.months[month];
  const earlier = Object.keys(document.months).filter((key) => key < month).sort().at(-1);
  return {
    categories: earlier
      ? document.months[earlier].categories.map(({ name, limit }) => ({
        id: crypto.randomUUID(), name, limit,
      }))
      : [],
    transactions: [],
  };
}

export function saveMonth(snapshot, month, data, storage = localStorage) {
  if (!isMonth(month)) throw new Error("Select a valid calendar month.");
  validateMonth(data);
  let current;
  try {
    current = storage.getItem(BUDGET_STORAGE_KEY);
  } catch {
    throw new Error("Cannot read budget storage. Your changes were not saved.");
  }
  if (current !== snapshot.raw) {
    throw new Error("Budget data changed in another tab. Reload the budget before editing again.");
  }
  const document = {
    version: BUDGET_SCHEMA_VERSION,
    months: { ...snapshot.document.months, [month]: data },
  };
  const raw = JSON.stringify(document);
  try {
    storage.setItem(BUDGET_STORAGE_KEY, raw);
  } catch {
    throw new Error("Cannot save budget data. Check available browser storage and retry.");
  }
  return { raw, document };
}
