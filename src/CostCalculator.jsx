import React, { useState } from 'react';

function CostCalculator() {

  const [edvinIncome, setEdvinIncome] = useState();
  const [elinoreIncome, setElinoreIncome] = useState();

  const [rent, setRent] = useState(0);


  function handleEdvinIncomeChange(event) {
    setEdvinIncome(parseFloat(event.target.value));
  }

  function handleElinoreIncomeChange(event) {
    setElinoreIncome(parseFloat(event.target.value));
  }

  const totalIncome = parseFloat(edvinIncome) > 0 || parseFloat(elinoreIncome) > 0
    ? (parseFloat(edvinIncome) || 0) + (parseFloat(elinoreIncome) || 0)
    : 0;

  return( <div>
            <h1>Cost Calculator</h1>
            <h2>Incomes</h2>
            <ul>
              <li>
                Edvin: <input type="number" value={edvinIncome} onChange={handleEdvinIncomeChange} />kr
              </li>
              <li>
                Elinore: <input type="number" value={elinoreIncome} onChange={handleElinoreIncomeChange} />kr
              </li>
              <li>
                Total: {totalIncome} kr
              </li>
            </ul>
          </div>);
}

export default CostCalculator;
