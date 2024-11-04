import React, { useState } from 'react';

function CostCalculator() {

  const [edvinIncome, setEdvinIncome] = useState(0);
  const [elinoreIncome, setElinoreIncome] = useState(0);

  function handleEdvinIncomeChange(event) {
    setEdvinIncome(parseFloat(event.target.value));
  }

  function handleElinoreIncomeChange(event) {
    setElinoreIncome(parseFloat(event.target.value));
  }

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
                Total: {edvinIncome + elinoreIncome}kr
              </li>
            </ul>
          </div>);
}

export default CostCalculator;
