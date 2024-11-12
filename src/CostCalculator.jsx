import React, { useState } from "react";
import { X, Plus } from "react-feather";
import ToggleSwitch from "./ToggleSwitch.jsx";

function CostCalculator() {
  const [incomes, setIncomes] = useState([
    { name: "Edvin", amount: "" },
    { name: "Elinore", amount: "" },
  ]);
  const [newIncome, setNewIncome] = useState("");
  const [expenses, setExpenses] = useState([
    { name: "Rent", amount: "" },
    { name: "Parking", amount: 1173 },
    { name: "Insurance", amount: 139 },
    { name: "Electricity", amount: "" },
    { name: "Electric Grid", amount: "" },
    { name: "Internet", amount: 419 },
  ]);
  const [newExpense, setNewExpense] = useState("");
  const [splitMode, setSplitMode] = useState(false);
  const [showSplit, setShowSplit] = useState(false);

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
      setIncomes(i => [...i, { name: newIncome, amount: "" }]);
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
      setExpenses(e => [...e, { name: newExpense, amount: "" }]);
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
    share: splitMode ? (0.5).toFixed(2) : ((income.amount / totalIncome) || 0).toFixed(2),
    expense: splitMode ? (totalExpenses / 2).toFixed(2) : ((income.amount / totalIncome) * totalExpenses).toFixed(2)
  }));

  return(
    <div className="cost-calculator">
      <h1>FairShare</h1>

      <h2>Incomes</h2>
      <ul>
        {incomes.map((income, index) => (
          <li key={index}>
            <div className="text">{income.name}</div>
            <input
              type="number"
              pattern="[0-9]*"
              inputMode="numeric"
              value={income.amount === "" ? "" : income.amount}
              onChange={(event) => handleIncomeChange(event, index)}
            />kr
            <button className="remove-button" onClick={() => deleteIncome(index)}><X /></button>
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
        <button className="add-button" onClick={addIncome}><Plus /></button>
      </div>
      <h3>Total: {totalIncome} kr</h3>

      <ToggleSwitch id="split-mode" checked={splitMode} onChange={onSplitModeChange} />

      <h2>Expenses</h2>
      <ul>
        {expenses.map((expense, index) => (
          <li key={index}>
            <div className="text">{expense.name}</div>
            <input
              type="number"
              pattern="[0-9]*"
              inputMode="numeric"
              value={expense.amount === "" ? "" : expense.amount}
              onChange={(event) => handleExpenseChange(event, index)}
            />kr
            <button className="remove-button" onClick={() => deleteExpense(index)}><X /></button>
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
        <button className="add-button" onClick={addExpense}><Plus /></button>
      </div>
      <h3>Total: {totalExpenses} kr</h3>

      <button className="split-button" onClick={() => setShowSplit(true)}>Split Expenses</button>

      {showSplit && (
        <div>
          <h2>Split Expenses</h2>
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
