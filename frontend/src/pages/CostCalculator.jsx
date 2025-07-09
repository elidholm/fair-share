import React, { useState, useEffect } from "react";
import { X, Plus, RefreshCcw } from "react-feather";
import ToggleSwitch from "../components/ToggleSwitch.jsx";

function CostCalculator() {
  const defaultIncomes = [
    { name: "Edvin", amount: "" },
    { name: "Elinore", amount: "" },
  ];
  const [incomes, setIncomes] = useState(() => {
    const storedIncomes = localStorage.getItem("incomes");
    return storedIncomes ? JSON.parse(storedIncomes) : defaultIncomes;
  });
  const [newIncome, setNewIncome] = useState("");

  const defaultExpenses = [
    { name: "Rent", amount: "" },
    { name: "Parking", amount: 1196 },
    { name: "Home Insurance", amount: 139 },
    { name: "Electricity", amount: "" },
    { name: "Electric Grid", amount: "" },
    { name: "Internet", amount: 579 },
    { name: "Viaplay", amount: 299 },
    { name: "Dog Insurance", amount: 312 },
  ];
  const [expenses, setExpenses] = useState(() => {
    const storedExpenses = localStorage.getItem("expenses");
    return storedExpenses ? JSON.parse(storedExpenses) : defaultExpenses;
  });
  const [newExpense, setNewExpense] = useState("");

  const [splitMode, setSplitMode] = useState(false);
  const [showSplit, setShowSplit] = useState(false);

  // Save incomes and expenses to localStorage on change
  useEffect(() => {
    localStorage.setItem("incomes", JSON.stringify(incomes));
  }, [incomes]);

  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  // Handlers for incomes and expenses
  function handleIncomeChange(event, index) {
    const value = event.target.value;
    const updatedIncomes = [...incomes];
    updatedIncomes[index].amount = value === "" ? "" : parseFloat(value);
    setIncomes(updatedIncomes);
  }

  function handleExpenseChange(event, index) {
    const value = event.target.value;
    const updatedExpenses = [...expenses];
    updatedExpenses[index].amount = value === "" ? "" : parseFloat(value);
    setExpenses(updatedExpenses);
  }

  function handleNewIncomeChange(event) {
    setNewIncome(event.target.value);
  }

  function addIncome() {
    if (newIncome.trim() !== "") {
      const updatedIncomes = [...incomes, { name: newIncome, amount: "" }];
      setIncomes(updatedIncomes);
      setNewIncome("");
    }
  }

  function deleteIncome(index) {
    const updatedIncomes = incomes.filter((_, i) => i !== index);
    setIncomes(updatedIncomes);
  }


  function handleNewExpenseChange(event) {
    setNewExpense(event.target.value);
  }

  function addExpense() {
    if (newExpense.trim() !== "") {
      const updatedExpenses = [...expenses, { name: newExpense, amount: "" }];
      setExpenses(updatedExpenses);
      setNewExpense("");
    }
  }

  function deleteExpense(index) {
    const updatedExpenses = expenses.filter((_, i) => i !== index);
    setExpenses(updatedExpenses);
  }

  const onSplitModeChange = (checked) => {
    setSplitMode(checked);
  }

  const totalIncome = incomes.reduce((sum, income) => sum + (parseFloat(income.amount) || 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);

  const expenseShares = incomes.map(income => ({
    name: income.name,
    share: splitMode ? (1 / incomes.length).toFixed(2) : ((income.amount / totalIncome) || 0).toFixed(2),
    expense: splitMode ? (totalExpenses / incomes.length).toFixed(2) : ((income.amount / totalIncome) * totalExpenses).toFixed(2)
  }));

  // Clear localStorage handler
  const handleClearStorage = () => {
    localStorage.removeItem("incomes");
    localStorage.removeItem("expenses");
    setIncomes(defaultIncomes);
    setExpenses(defaultExpenses);
  };

  return(
    <div className="cost-calculator">
      <h1>Split Costs</h1>
      <button
        className="clear-storage-button"
        onClick={handleClearStorage}
        title="Clear Local Storage"
      ><RefreshCcw /></button>

      <h2>Incomes</h2>
      <ul>
        {incomes.map((income, index) => (
          <li key={index}>
            <div className="text">{income.name}</div>
            <input
              data-testid={`income-${index}`}
              type="number"
              pattern="[0-9]*"
              inputMode="numeric"
              value={income.amount === "" ? "" : income.amount}
              onChange={(event) => handleIncomeChange(event, index)}
            />kr
            <button title={income.name} className="remove-button" onClick={() => deleteIncome(index)}><X /></button>
          </li>
        ))}
      </ul>
      <div className="add-income">
        <input
          type="text"
          placeholder="Enter new income..."
          value={newIncome}
          onChange={handleNewIncomeChange}
          onKeyDown={(event) => event.key === "Enter" && addIncome()}
        />
        <button title="Add Income" className="add-button" onClick={addIncome}><Plus /></button>
      </div>
      <h3>Total: {totalIncome} kr</h3>

      <ToggleSwitch id="split-mode" checked={splitMode} onChange={onSplitModeChange} />

      <h2>Expenses</h2>
      <ul>
        {expenses.map((expense, index) => (
          <li key={index}>
            <div className="text">{expense.name}</div>
            <input
              data-testid={`expense-${index}`}
              type="number"
              pattern="[0-9]*"
              inputMode="numeric"
              value={expense.amount === "" ? "" : expense.amount}
              onChange={(event) => handleExpenseChange(event, index)}
            />kr
            <button title={expense.name} className="remove-button" onClick={() => deleteExpense(index)}><X /></button>
          </li>
        ))}
      </ul>
      <div className="add-expense">
        <input
          type="text"
          placeholder="Enter new expense..."
          value={newExpense}
          onChange={handleNewExpenseChange}
          onKeyDown={(event) => event.key === "Enter" && addExpense()}
        />
        <button title="Add Expense" className="add-button" onClick={addExpense}><Plus /></button>
      </div>
      <h3>Total: {totalExpenses} kr</h3>

      <button className="split-button" onClick={() => setShowSplit(true)}>Split Expenses</button>

      {showSplit && (
        <div>
          <ul>
            {expenseShares.map((share, index) => (
              <li key={index}>
                {share.name}&#39;s Share: {share.expense} kr ({(share.share * 100).toFixed(2)}%)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CostCalculator;
