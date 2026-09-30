import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, EmptyState, Sheet, TextField } from "../ui";
import {
  BUDGET_CLEARED_EVENT, BUDGET_STORAGE_KEY, emptyBudgetSnapshot, monthBudget, readBudget, saveMonth, isMonth,
} from "./budgetStorage";
import "./Budget.scss";

const money = (amount) => `${new Intl.NumberFormat("sv-SE", {
  maximumFractionDigits: 2,
}).format(amount)} kr`;

const todayMonth = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
};

export function parseAmount(value) {
  if (value.trim() === "") throw new Error("Enter an amount.");
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Amount must be a finite, nonnegative number.");
  }
  return amount;
}

function Budget() {
  const [month, setMonth] = useState(todayMonth);
  const [snapshot, setSnapshot] = useState(() => {
    try { return readBudget(); } catch { return null; }
  });
  const [error, setError] = useState(() => {
    try { readBudget(); return ""; } catch (cause) { return cause.message; }
  });
  const [editor, setEditor] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [form, setForm] = useState({ name: "", amount: "", categoryId: "" });
  const [formError, setFormError] = useState("");
  useEffect(() => {
    function handleBudgetCleared() {
      setSnapshot(emptyBudgetSnapshot());
      setMonth(todayMonth());
      setEditor(null);
      setPendingDelete(null);
      setForm({ name: "", amount: "", categoryId: "" });
      setFormError("");
      setError("");
    }
    function handleStorage(event) {
      if (event.key === BUDGET_STORAGE_KEY && event.newValue === null &&
        event.storageArea === localStorage) {
        handleBudgetCleared();
      }
    }
    window.addEventListener(BUDGET_CLEARED_EVENT, handleBudgetCleared);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(BUDGET_CLEARED_EVENT, handleBudgetCleared);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const data = useMemo(
    () => snapshot && isMonth(month) ? monthBudget(snapshot.document, month) : null,
    [snapshot, month],
  );
  const categories = data?.categories ?? [];
  const transactions = data?.transactions ?? [];
  const planned = categories.reduce((sum, category) => sum + category.limit, 0);
  const actual = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  function reload() {
    try {
      setSnapshot(readBudget());
      setError("");
      setEditor(null);
    } catch (cause) {
      setSnapshot(null);
      setError(cause.message);
    }
  }

  function changeMonth(event) {
    setMonth(event.target.value);
    setEditor(null);
    setPendingDelete(null);
    setFormError("");
  }

  function edit(type, item = null) {
    setForm({
      name: item?.name ?? "",
      amount: String(item?.limit ?? item?.amount ?? ""),
      categoryId: item?.categoryId ?? categories[0]?.id ?? "",
    });
    setFormError("");
    setEditor({ type, id: item?.id ?? null });
  }

  function persist(next) {
    try {
      setSnapshot(saveMonth(snapshot, month, next));
      setError("");
      return true;
    } catch (cause) {
      setError(cause.message);
      return false;
    }
  }

  function submit(event) {
    event.preventDefault();
    try {
      const name = form.name.trim();
      if (!name) throw new Error("Enter a name.");
      const amount = parseAmount(form.amount);
      if (editor.type === "category") {
        if (categories.some((category) => category.name.toLocaleLowerCase() === name.toLocaleLowerCase() &&
          category.id !== editor.id)) throw new Error("Category names must be unique in this month.");
        const item = { id: editor.id ?? crypto.randomUUID(), name, limit: amount };
        if (persist({ categories: editor.id
          ? categories.map((category) => category.id === editor.id ? item : category)
          : [...categories, item], transactions })) setEditor(null);
      } else {
        if (!categories.some((category) => category.id === form.categoryId)) {
          throw new Error("Select a category for this transaction.");
        }
        const item = { id: editor.id ?? crypto.randomUUID(), name, amount, categoryId: form.categoryId };
        if (persist({ categories, transactions: editor.id
          ? transactions.map((transaction) => transaction.id === editor.id ? item : transaction)
          : [...transactions, item] })) setEditor(null);
      }
      setFormError("");
    } catch (cause) {
      setFormError(cause.message);
    }
  }

  function remove(type, item) {
    setPendingDelete({ type, item, month });
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const { type, item, month: selectedMonth } = pendingDelete;
    if (month !== selectedMonth) {
      setPendingDelete(null);
      return;
    }
    const saved = type === "category"
      ? persist({
        categories: categories.filter((category) => category.id !== item.id),
        transactions: transactions.filter((transaction) => transaction.categoryId !== item.id),
      })
      : persist({ categories, transactions: transactions.filter((transaction) => transaction.id !== item.id) });
    if (saved) setPendingDelete(null);
  }

  return (
    <main className="budget">
      <header className="budget__header">
        <div>
          <h1>Budget</h1>
          <p>Plan a month, then track what you actually spend.</p>
        </div>
        <TextField label="Calendar month" type="month" value={month} onChange={changeMonth} />
      </header>
      <Alert tone="info">Budgets stay on this device, are not synced to your account, and are cleared when you sign out.</Alert>
      {error && <Alert tone="error" title="Budget unavailable" action={<Button variant="secondary" onClick={reload}>Reload</Button>}>{error}</Alert>}
      {!snapshot && !error && <p role="status">Loading budget…</p>}
      {data && (
        <>
          {!Object.hasOwn(snapshot.document.months, month) && (
            <Alert tone="info">This month is not saved yet. Categories come from the most recent earlier saved month; transactions start empty. Changes are saved when you edit.</Alert>
          )}
          <section className="budget__summary" aria-label="Monthly summary">
            <Card as="div"><span>Planned</span><strong>{money(planned)}</strong></Card>
            <Card as="div"><span>Actual</span><strong>{money(actual)}</strong></Card>
            <Card as="div" className={actual > planned ? "budget__over" : ""}>
              <span>{actual > planned ? "Over budget" : "Remaining"}</span>
              <strong>{money(Math.abs(planned - actual))}</strong>
            </Card>
          </section>
          <section aria-labelledby="budget-categories">
            <div className="budget__section-heading">
              <h2 id="budget-categories">Categories</h2>
              <Button onClick={() => edit("category")} disabled={!!error}>Add category</Button>
            </div>
            {categories.length === 0
              ? <EmptyState title="No categories yet" description="Add a category to plan your spending." />
              : <ul className="budget__list">{categories.map((category) => {
                const spent = transactions.filter((transaction) => transaction.categoryId === category.id)
                  .reduce((sum, transaction) => sum + transaction.amount, 0);
                return <li key={category.id}><Card as="article" className="budget__item">
                  <div><h3>{category.name}</h3><p>Limit {money(category.limit)} · Spent {money(spent)}</p>
                    <p className={spent > category.limit ? "budget__over" : ""}>
                      {spent > category.limit ? `Over budget by ${money(spent - category.limit)}` : `Remaining ${money(category.limit - spent)}`}
                    </p>
                  </div>
                  <div className="budget__actions">
                    <Button variant="secondary" size="sm" onClick={() => edit("category", category)} disabled={!!error}>Edit {category.name}</Button>
                    <Button variant="destructive" size="sm" onClick={() => remove("category", category)} disabled={!!error}>Delete {category.name}</Button>
                  </div>
                </Card></li>;
              })}</ul>}
          </section>
          <section aria-labelledby="budget-transactions">
            <div className="budget__section-heading">
              <h2 id="budget-transactions">Transactions</h2>
              <Button onClick={() => edit("transaction")} disabled={!categories.length || !!error}>Add transaction</Button>
            </div>
            {transactions.length === 0
              ? <EmptyState title="No transactions yet" description="Record spending against a category." />
              : <ul className="budget__list">{transactions.map((transaction) => (
                <li key={transaction.id}><Card as="article" className="budget__item">
                  <div><h3>{transaction.name}</h3><p>{categories.find((category) => category.id === transaction.categoryId)?.name} · {money(transaction.amount)}</p></div>
                  <div className="budget__actions">
                    <Button variant="secondary" size="sm" onClick={() => edit("transaction", transaction)} disabled={!!error}>Edit transaction {transaction.name}</Button>
                    <Button variant="destructive" size="sm" onClick={() => remove("transaction", transaction)} disabled={!!error}>Delete transaction {transaction.name}</Button>
                  </div>
                </Card></li>
              ))}</ul>}
          </section>
        </>
      )}
      <Sheet open={!!editor} onClose={() => setEditor(null)}
        title={`${editor?.id ? "Edit" : "Add"} ${editor?.type ?? "category"}`}>
        <form className="budget__form" onSubmit={submit}>
          <TextField label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <TextField label={editor?.type === "category" ? "Monthly limit" : "Amount"} type="number"
            min="0" step="any" inputMode="decimal" suffix="kr" value={form.amount}
            onChange={(event) => setForm({ ...form, amount: event.target.value })} required />
          {editor?.type === "transaction" && <label className="budget__select">Category
            <select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>}
          {formError && <Alert tone="error">{formError}</Alert>}
          <Button type="submit">Save {editor?.type}</Button>
        </form>
      </Sheet>
      <Sheet
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title={`Delete ${pendingDelete?.item.name ?? "item"}?`}
        description={pendingDelete?.type === "category"
          ? `This also deletes its transactions for ${pendingDelete.month}. Other months are unaffected.`
          : `This removes the transaction from ${pendingDelete?.month}.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </>
        }
      >
        <p>This cannot be undone.</p>
      </Sheet>
    </main>
  );
}

export default Budget;
