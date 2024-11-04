import React, { useState } from 'react';

function CostCalculator() {

  const [edvinIncome, setEdvinIncome] = useState();
  const [elinoreIncome, setElinoreIncome] = useState();

  const [rent, setRent] = useState();
  const [parking, setParking] = useState(1150);
  const [insurance, setInsurance] = useState(139);
  const [electricity, setElectricity] = useState();
  const [electricGrid, setElectricGrid] = useState();
  const [internet, setInternet] = useState(419);

  const [showSplit, setShowSplit] = useState(false);


  function handleEdvinIncomeChange(event) {
    setEdvinIncome(parseFloat(event.target.value));
  }

  function handleElinoreIncomeChange(event) {
    setElinoreIncome(parseFloat(event.target.value));
  }

  function handleRentChange(event) {
    setRent(parseFloat(event.target.value));
  }

  function handleParkingChange(event) {
    setParking(parseFloat(event.target.value));
  }

  function handleInsuranceChange(event) {
    setInsurance(parseFloat(event.target.value));
  }

  function handleElectricityChange(event) {
    setElectricity(parseFloat(event.target.value));
  }

  function handleElectricGridChange(event) {
    setElectricGrid(parseFloat(event.target.value));
  }

  function handleInternetChange(event) {
    setInternet(parseFloat(event.target.value));
  }

  function handleSplitExpenses() {
    setShowSplit(true);
  }

  const
    totalIncome = parseFloat(edvinIncome) > 0 || parseFloat(elinoreIncome) > 0
    ? (parseFloat(edvinIncome) || 0) + (parseFloat(elinoreIncome) || 0)
    : 0;

  const
    totalExpenses = parseFloat(rent) > 0 || parseFloat(parking) > 0 || parseFloat(insurance) > 0 || parseFloat(electricity) > 0 || parseFloat(electricGrid) > 0 || parseFloat(internet) > 0
    ? (parseFloat(rent) || 0) + (parseFloat(parking) || 0) + (parseFloat(insurance) || 0) + (parseFloat(electricity) || 0) + (parseFloat(electricGrid) || 0) + (parseFloat(internet) || 0)
    : 0;

  const edvinShare = (parseFloat(edvinIncome) / totalIncome) || 0;
  const elinoreShare = (parseFloat(elinoreIncome) / totalIncome) || 0;

  const edvinExpenses = (totalExpenses * edvinShare).toFixed(2);
  const elinoreExpenses = (totalExpenses * elinoreShare).toFixed(2);

  return( <div>
            <h1>Cost Calculator</h1>

            <h2>Incomes</h2>
            <ul>
              <li>Edvin: <input type="number" value={edvinIncome} onChange={handleEdvinIncomeChange} /> kr</li>
              <li>Elinore: <input type="number" value={elinoreIncome} onChange={handleElinoreIncomeChange} /> kr</li>
              <li>Total: {totalIncome} kr</li>
            </ul>

            <h2>Expenses</h2>
            <ul>
              <li>Rent: <input type="number" value={rent} onChange={handleRentChange} /> kr</li>
              <li>Parking: <input type="number" value={parking} onChange={handleParkingChange} /> kr</li>
              <li>Insurance: <input type="number" value={insurance} onChange={handleInsuranceChange} /> kr</li>
              <li>Electricity: <input type="number" value={electricity} onChange={handleElectricityChange} /> kr</li>
              <li>Electric Grid: <input type="number" value={electricGrid} onChange={handleElectricGridChange} /> kr </li>
              <li>Internet: <input type="number" value={internet} onChange={handleInternetChange} /> kr</li>
              <li>Total: {totalExpenses} kr</li>
            </ul>

            <button onClick={handleSplitExpenses}>Split Expenses</button>

            {showSplit && (
              <div>
                <h2>Split Expenses</h2>
                <ul>
                  <li>Edvin's Share: {edvinExpenses} kr ({(edvinShare * 100).toFixed(2)}%)</li>
                  <li>Elinore's Share: {elinoreExpenses} kr ({(elinoreShare * 100).toFixed(2)}%)</li>
                </ul>
              </div>
            )}
          </div>);
}

export default CostCalculator;