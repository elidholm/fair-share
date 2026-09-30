import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { DollarSign, Plus, RefreshCcw, ShoppingCart, X } from "react-feather";
import {
  Alert,
  AsyncContent,
  Button,
  Card,
  EmptyState,
  IconButton,
  Sheet,
  Skeleton,
  Switch,
  TextField,
  VisuallyHidden,
} from "../ui";
import { useAuth } from "../context/AuthContext";
import "./CostCalculator.scss";

const KINDS = ["incomes", "expenses"];

const COPY = {
  incomes: {
    title: "Incomes",
    singular: "income",
    fieldPrefix: "Income for ",
    newLabel: "New income",
    placeholder: "Enter new income...",
    addLabel: "Add income",
    emptyTitle: "No incomes yet",
    emptyDescription: "Add each person who shares the costs, then enter their income.",
    emptyIcon: <DollarSign />,
  },
  expenses: {
    title: "Expenses",
    singular: "expense",
    fieldPrefix: "Amount for ",
    newLabel: "New expense",
    placeholder: "Enter new expense...",
    addLabel: "Add expense",
    emptyTitle: "No expenses yet",
    emptyDescription: "Add rent, groceries or anything else you share.",
    emptyIcon: <ShoppingCart />,
  },
};

const AMOUNT_MESSAGES = {
  missing: "Enter an amount, or remove this row.",
  invalid: "Enter a number, like 1200.",
  negative: "Amount can’t be negative.",
};

function normalizeAmount(amount) {
  if (amount === null || amount === undefined) return "";
  if (typeof amount === "number" || typeof amount === "string") return amount;
  return "";
}

function normalizeList(value) {
  if (!Array.isArray(value)) return null;
  return value
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => ({ name: String(entry.name ?? ""), amount: normalizeAmount(entry.amount) }));
}

function readLocal(kind) {
  try {
    const stored = localStorage.getItem(kind);
    if (!stored) return { items: [], error: null };
    const items = normalizeList(JSON.parse(stored));
    if (!items) throw new Error("Unexpected format");
    return { items, error: null };
  } catch {
    return { items: [], error: `Saved ${kind} on this device couldn’t be read, so the list starts empty.` };
  }
}

/** Returns why an amount can't be used, or null if it's a valid, non-negative, finite number. */
function amountIssue(amount) {
  if (amount === "" || amount === null || amount === undefined) return "missing";
  const value = typeof amount === "number" ? amount : Number(amount);
  if (typeof amount === "string" && amount.trim() === "") return "missing";
  if (!Number.isFinite(value)) return "invalid";
  if (value < 0) return "negative";
  return null;
}

function toNumber(amount) {
  return amountIssue(amount) ? 0 : Number(amount);
}

function formatKr(value) {
  return `${Math.round(value * 100) / 100} kr`;
}

function joinNames(names) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** Visible names, with "(2)", "(3)"… appended to duplicates so every row has a unique accessible name. */
function displayNames(items) {
  const totals = {};
  items.forEach(({ name }) => {
    const key = name.trim() || "Unnamed";
    totals[key] = (totals[key] ?? 0) + 1;
  });
  const seen = {};
  return items.map(({ name }) => {
    const key = name.trim() || "Unnamed";
    seen[key] = (seen[key] ?? 0) + 1;
    return totals[key] > 1 ? `${key} (${seen[key]})` : key;
  });
}

function amountFromInput(raw) {
  if (raw === "") return "";
  const value = Number(raw);
  return Number.isFinite(value) ? value : raw;
}

function describeError(error) {
  return error instanceof Error && error.message ? error.message : String(error);
}

function EntrySection({
  kind,
  items,
  loading,
  fieldErrors,
  hints,
  total,
  onAmountChange,
  onRemove,
  onAdd,
}) {
  const copy = COPY[kind];
  const [draft, setDraft] = useState("");
  const [addError, setAddError] = useState(null);
  const inputRef = useRef(null);
  const names = displayNames(items);
  const headingId = `${kind}-heading`;

  function handleSubmit(event) {
    event.preventDefault();
    const name = draft.trim();
    if (!name) {
      setAddError(`Enter a name to add an ${copy.singular}.`);
      inputRef.current?.focus();
      return;
    }
    onAdd(name);
    setDraft("");
    setAddError(null);
  }

  return (
    <Card as="section" className="cost-calculator__section" aria-labelledby={headingId}>
      <h2 id={headingId} className="cost-calculator__heading">{copy.title}</h2>

      <AsyncContent
        loading={loading}
        loadingLabel={`Loading ${kind}`}
        isEmpty={items.length === 0}
        skeleton={<Skeleton variant="rect" height="3rem" lines={1} />}
        empty={
          <EmptyState
            compact
            headingLevel={3}
            icon={copy.emptyIcon}
            title={copy.emptyTitle}
            description={copy.emptyDescription}
          />
        }
      >
        {() => (
          <ul className="cost-calculator__rows" aria-label={copy.title}>
            {items.map((item, index) => (
              <li key={index} className="cost-calculator__row">
                <TextField
                  className="cost-calculator__amount"
                  label={
                    <>
                      <VisuallyHidden>{copy.fieldPrefix}</VisuallyHidden>
                      <span>{names[index]}</span>
                    </>
                  }
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  suffix="kr"
                  placeholder="0"
                  hint={hints[index]}
                  error={fieldErrors[index]}
                  value={item.amount === "" ? "" : String(item.amount)}
                  onChange={(event) => onAmountChange(index, event.target.value)}
                />
                <IconButton
                  className="cost-calculator__remove"
                  label={`Remove ${copy.singular} ${names[index]}`}
                  variant="destructive"
                  size="sm"
                  onClick={() => onRemove(index)}
                >
                  <X />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </AsyncContent>

      <form className="cost-calculator__add" onSubmit={handleSubmit} noValidate>
        <TextField
          ref={inputRef}
          className="cost-calculator__add-field"
          label={copy.newLabel}
          hideLabel
          type="text"
          autoComplete="off"
          placeholder={copy.placeholder}
          error={addError}
          disabled={loading}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            if (addError) setAddError(null);
          }}
        />
        <Button type="submit" variant="tinted" iconStart={<Plus />} disabled={loading}>
          {copy.addLabel}
        </Button>
      </form>

      <p className="cost-calculator__total">
        <span>Total {copy.title.toLowerCase()}</span>
        <output aria-label={`Total ${copy.title.toLowerCase()}`}>{formatKr(total)}</output>
      </p>
    </Card>
  );
}

EntrySection.propTypes = {
  kind: PropTypes.oneOf(KINDS).isRequired,
  items: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string, amount: PropTypes.any })).isRequired,
  loading: PropTypes.bool.isRequired,
  fieldErrors: PropTypes.arrayOf(PropTypes.string).isRequired,
  hints: PropTypes.arrayOf(PropTypes.string).isRequired,
  total: PropTypes.number.isRequired,
  onAmountChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

function CostCalculator() {
  const { user } = useAuth();
  const [initial] = useState(() => ({ incomes: readLocal("incomes"), expenses: readLocal("expenses") }));
  const [lists, setLists] = useState({ incomes: initial.incomes.items, expenses: initial.expenses.items });
  const [loading, setLoading] = useState({ incomes: Boolean(user), expenses: Boolean(user) });
  const [loadErrors, setLoadErrors] = useState({ incomes: null, expenses: null });
  const [saveErrors, setSaveErrors] = useState({ incomes: null, expenses: null });
  const [storageError, setStorageError] = useState(
    [initial.incomes.error, initial.expenses.error].filter(Boolean).join(" ") || null,
  );
  const [reloadKey, setReloadKey] = useState(0);
  const [splitEqually, setSplitEqually] = useState(false);
  const [splitRequested, setSplitRequested] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [notice, setNotice] = useState(null);
  const saveSeq = useRef({ incomes: 0, expenses: 0 });
  const listsRef = useRef(lists);
  listsRef.current = lists;

  function patch(setter, kind, value) {
    setter((current) => ({ ...current, [kind]: value }));
  }

  function writeLocal(kind, items) {
    try {
      localStorage.setItem(kind, JSON.stringify(items));
      return true;
    } catch (error) {
      setStorageError(`Couldn’t save ${kind} on this device (${describeError(error)}).`);
      return false;
    }
  }

  async function saveRemote(kind, items) {
    const seq = ++saveSeq.current[kind];
    try {
      const response = await fetch(`/api/${kind}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [kind]: items }),
      });
      if (!response?.ok) throw new Error(`Server responded with ${response?.status ?? "no status"}`);
      if (seq === saveSeq.current[kind]) patch(setSaveErrors, kind, null);
    } catch (error) {
      if (seq === saveSeq.current[kind]) patch(setSaveErrors, kind, describeError(error));
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load(kind) {
      const local = readLocal(kind);
      if (!user) {
        patch(setLists, kind, local.items);
        patch(setLoading, kind, false);
        patch(setLoadErrors, kind, null);
        return;
      }

      patch(setLoading, kind, true);
      try {
        const response = await fetch(`/api/${kind}`, { credentials: "include" });
        if (!response?.ok) throw new Error(`Server responded with ${response?.status ?? "no status"}`);
        const data = await response.json();
        const remote = normalizeList(data?.[kind]);
        if (!remote) throw new Error("Unexpected response from server");
        if (cancelled) return;
        if (remote.length > 0) {
          patch(setLists, kind, remote);
          writeLocal(kind, remote);
        } else {
          // Nothing in the account yet: keep what's on this device and upload it.
          patch(setLists, kind, local.items);
          if (local.items.length > 0) saveRemote(kind, local.items);
        }
        patch(setLoadErrors, kind, null);
      } catch (error) {
        if (cancelled) return;
        patch(setLists, kind, local.items);
        patch(setLoadErrors, kind, describeError(error));
      } finally {
        if (!cancelled) patch(setLoading, kind, false);
      }
    }

    KINDS.forEach(load);
    return () => {
      cancelled = true;
    };
    // writeLocal/saveRemote only touch refs and state setters.
  }, [user, reloadKey]);

  function commit(kind, items) {
    setNotice(null);
    patch(setLists, kind, items);
    writeLocal(kind, items);
    if (user) saveRemote(kind, items);
  }

  function handleAmountChange(kind, index, raw) {
    const items = lists[kind].map((item, i) => (i === index ? { ...item, amount: amountFromInput(raw) } : item));
    commit(kind, items);
  }

  function handleRemove(kind, index) {
    commit(kind, lists[kind].filter((_, i) => i !== index));
  }

  function handleAdd(kind, name) {
    commit(kind, [...lists[kind], { name, amount: "" }]);
  }

  function retrySave(kind) {
    saveRemote(kind, listsRef.current[kind]);
  }

  function openReset() {
    setResetError(null);
    setResetOpen(true);
  }

  function closeReset() {
    if (resetting) return;
    setResetOpen(false);
    setResetError(null);
  }

  async function confirmReset() {
    setResetting(true);
    setResetError(null);

    if (user) {
      const outcomes = await Promise.all(
        KINDS.map(async (kind) => {
          try {
            const response = await fetch(`/api/${kind}`, { method: "DELETE", credentials: "include" });
            return Boolean(response?.ok);
          } catch {
            return false;
          }
        }),
      );
      const failed = KINDS.filter((_, i) => !outcomes[i]);
      if (failed.length > 0) {
        const cleared = KINDS.filter((_, i) => outcomes[i]);
        setResetError(
          (cleared.length > 0
            ? `Your ${cleared.join(" and ")} were cleared from your account, but your ${failed.join(" and ")} couldn’t be. `
            : "Couldn’t clear your account’s saved data. ") +
            "Nothing was removed from this device. Check your connection and try again.",
        );
        setResetting(false);
        return;
      }
    }

    KINDS.forEach((kind) => {
      saveSeq.current[kind] += 1;
    });
    let localCleared = true;
    KINDS.forEach((kind) => {
      try {
        localStorage.removeItem(kind);
      } catch {
        localCleared = false;
      }
    });
    setLists({ incomes: [], expenses: [] });
    setSaveErrors({ incomes: null, expenses: null });
    setSplitRequested(false);
    setResetting(false);
    setResetOpen(false);
    if (localCleared) {
      setStorageError(null);
      setNotice(user ? "Calculator reset on this device and in your account." : "Calculator reset.");
    } else {
      setStorageError("The calculator was cleared, but saved data on this device couldn’t be removed.");
    }
  }

  // Validation and totals
  const { incomes, expenses } = lists;
  const incomeIssues = incomes.map((item) => amountIssue(item.amount));
  const expenseIssues = expenses.map((item) => amountIssue(item.amount));
  const totalIncome = incomes.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const incomeNames = displayNames(incomes);
  const expenseNames = displayNames(expenses);

  const incomeRequired = !splitEqually;
  const fieldError = (issue, required) => {
    if (!issue) return undefined;
    if (issue === "missing") {
      return splitRequested && required ? AMOUNT_MESSAGES.missing : undefined;
    }
    return AMOUNT_MESSAGES[issue];
  };
  const incomeErrors = incomeIssues.map((issue) => fieldError(issue, incomeRequired));
  const expenseErrors = expenseIssues.map((issue) => fieldError(issue, true));
  const incomeHints = incomeIssues.map((issue) =>
    issue === "missing" && splitEqually ? "Not needed when splitting equally." : undefined,
  );
  const expenseHints = expenses.map(() => undefined);

  const splitProblems = [];
  const namesWith = (issues, names, match) => names.filter((_, i) => match(issues[i]));
  const isBad = (issue) => issue === "invalid" || issue === "negative";
  if (incomes.length === 0) {
    splitProblems.push("Add at least one person under Incomes before splitting.");
  }
  const badIncomes = namesWith(incomeIssues, incomeNames, isBad);
  if (badIncomes.length > 0) {
    splitProblems.push(`Fix the income for ${joinNames(badIncomes)}.`);
  }
  const missingIncomes = namesWith(incomeIssues, incomeNames, (issue) => issue === "missing");
  if (!splitEqually && missingIncomes.length > 0) {
    splitProblems.push(`Enter an income for ${joinNames(missingIncomes)}, or turn on Split equally.`);
  }
  const badExpenses = namesWith(expenseIssues, expenseNames, Boolean);
  if (badExpenses.length > 0) {
    splitProblems.push(`Enter a valid amount for ${joinNames(badExpenses)}, or remove ${badExpenses.length > 1 ? "them" : "it"}.`);
  }
  if (!splitEqually && incomes.length > 0 && splitProblems.length === 0 && totalIncome === 0) {
    splitProblems.push("Total income is 0 kr, so a proportional split isn’t possible. Enter incomes above 0 kr, or turn on Split equally.");
  }

  const shares = splitProblems.length > 0
    ? []
    : incomes.map((item, index) => {
      const share = splitEqually ? 1 / incomes.length : toNumber(item.amount) / totalIncome;
      return { name: incomeNames[index], share, amount: share * totalExpenses };
    });

  const loadFailures = KINDS.filter((kind) => loadErrors[kind]);
  const saveFailures = KINDS.filter((kind) => saveErrors[kind]);

  return (
    <div className="cost-calculator">
      <header className="cost-calculator__header">
        <h1>Split Costs</h1>
        <IconButton label="Reset calculator" variant="secondary" onClick={openReset}>
          <RefreshCcw />
        </IconButton>
      </header>

      <div className="cost-calculator__messages">
        {notice && (
          <Alert tone="success" onDismiss={() => setNotice(null)}>{notice}</Alert>
        )}
        {loadFailures.length > 0 && (
          <Alert
            tone="warning"
            title={`Couldn’t load your saved ${loadFailures.join(" and ")}`}
            action={<Button size="sm" variant="secondary" onClick={() => setReloadKey((key) => key + 1)}>Try again</Button>}
          >
            Showing what’s saved on this device instead. ({loadFailures.map((kind) => loadErrors[kind]).join("; ")})
          </Alert>
        )}
        {saveFailures.map((kind) => (
          <Alert
            key={kind}
            tone="error"
            title={`Couldn’t save ${kind} to your account`}
            action={<Button size="sm" variant="secondary" onClick={() => retrySave(kind)}>Retry</Button>}
          >
            Your changes are kept on this device. ({saveErrors[kind]})
          </Alert>
        ))}
        {storageError && (
          <Alert tone="error" title="Device storage problem" onDismiss={() => setStorageError(null)}>
            {storageError}
          </Alert>
        )}
      </div>

      <div className="cost-calculator__grid">
        <EntrySection
          kind="incomes"
          items={incomes}
          loading={loading.incomes}
          fieldErrors={incomeErrors}
          hints={incomeHints}
          total={totalIncome}
          onAmountChange={(index, raw) => handleAmountChange("incomes", index, raw)}
          onRemove={(index) => handleRemove("incomes", index)}
          onAdd={(name) => handleAdd("incomes", name)}
        />
        <EntrySection
          kind="expenses"
          items={expenses}
          loading={loading.expenses}
          fieldErrors={expenseErrors}
          hints={expenseHints}
          total={totalExpenses}
          onAmountChange={(index, raw) => handleAmountChange("expenses", index, raw)}
          onRemove={(index) => handleRemove("expenses", index)}
          onAdd={(name) => handleAdd("expenses", name)}
        />
      </div>

      <Card as="section" className="cost-calculator__section cost-calculator__split" aria-labelledby="split-heading">
        <h2 id="split-heading" className="cost-calculator__heading">Split</h2>
        <Switch
          label="Split equally"
          description={splitEqually
            ? "Everyone pays the same share, whatever their income."
            : "Off: each person pays in proportion to their income."}
          checked={splitEqually}
          onChange={setSplitEqually}
        />
        <Button fullWidth onClick={() => setSplitRequested(true)}>Split expenses</Button>

        <div className="cost-calculator__result" aria-live="polite">
          {splitRequested && splitProblems.length > 0 && (
            <Alert tone="warning" title="Can’t split yet">
              <ul className="cost-calculator__problems">
                {splitProblems.map((problem) => <li key={problem}>{problem}</li>)}
              </ul>
            </Alert>
          )}
          {splitRequested && splitProblems.length === 0 && (
            <ul className="cost-calculator__shares" aria-label="Shares">
              {shares.map((share) => (
                <li key={share.name} className="cost-calculator__share">
                  <span className="cost-calculator__share-name">{share.name}&#39;s share</span>
                  <span className="cost-calculator__share-value">
                    {share.amount.toFixed(2)} kr ({(share.share * 100).toFixed(2)}%)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Sheet
        open={resetOpen}
        onClose={closeReset}
        dismissible={!resetting}
        title="Reset calculator?"
        description={user
          ? "This removes all incomes and expenses from this device and from your account."
          : "This removes all incomes and expenses saved on this device."}
        footer={
          <div className="cost-calculator__sheet-actions">
            <Button variant="secondary" onClick={closeReset} disabled={resetting}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReset} loading={resetting} loadingLabel="Resetting">
              Reset
            </Button>
          </div>
        }
      >
        {resetError ? (
          <Alert tone="error" title="Reset failed">{resetError}</Alert>
        ) : (
          <p className="cost-calculator__sheet-text">This can’t be undone.</p>
        )}
      </Sheet>
    </div>
  );
}

export default CostCalculator;
