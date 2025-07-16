import { test, expect } from '@playwright/test';

test.describe('Cost Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/split-costs');
    await page.click('.clear-storage-button');
  });

  test('should load with default expenses and empty incomes', async ({ page }) => {
    await expect(page.locator('h2:has-text("Incomes")')).toBeVisible();
    await expect(page.getByTestId('income-list')).not.toBeVisible();

    await expect(page.locator('h2:has-text("Expenses")')).toBeVisible();
    await expect(page.getByTestId('expense-list')).not.toBeVisible();
  });

  test('should add and remove income entries', async ({ page }) => {
    await page.fill('input[placeholder="Enter new income..."]', 'Freelance');
    await page.click('.add-income .add-button');

    await expect(page.getByText('Freelance')).toBeVisible();

    //Verify data persists after refresh (tests localStorage/db save)
    await page.reload();
    await expect(page.getByText('Freelance')).toBeVisible();

    await page.click('li:has-text("Freelance") .remove-button');
    await expect(page.getByText('Freelance')).not.toBeVisible();
  });

  test('should add and remove expense entries', async ({ page }) => {
    await page.fill('input[placeholder="Enter new expense..."]', 'Netflix');
    await page.click('.add-expense .add-button');

    await expect(page.getByText('Netflix')).toBeVisible();

    await page.click('li:has-text("Netflix") .remove-button');
    await expect(page.getByText('Netflix')).not.toBeVisible();
  });

  test('should calculate totals correctly', async ({ page }) => {
    // Add and set up incomes
    await page.fill('input[placeholder="Enter new income..."]', 'PersonA');
    await page.click('.add-income .add-button');
    await page.getByTestId('income-0').fill('30000');

    await page.fill('input[placeholder="Enter new income..."]', 'PersonB');
    await page.click('.add-income .add-button');
    await page.getByTestId('income-1').fill('25000');

    await expect(page.getByTestId('total-income')).toHaveText('Total: 55000 kr');

    // Add and set up expenses
    await page.fill('input[placeholder="Enter new expense..."]', 'Rent');
    await page.click('.add-expense .add-button');
    await page.getByTestId('expense-0').fill('12000');

    await page.fill('input[placeholder="Enter new expense..."]', 'Groceries');
    await page.click('.add-expense .add-button');
    await page.getByTestId('expense-1').fill('500');

    await expect(page.getByTestId('total-expenses')).toContainText('Total: 12500 kr');
  });

  test('should split expenses proportionally when split mode is off', async ({ page }) => {
    const incomeA = 30000;
    const incomeB = 25000;

    // Add and set up incomes
    await page.fill('input[placeholder="Enter new income..."]', 'PersonA');
    await page.click('.add-income .add-button');
    await page.getByTestId('income-0').fill(`${incomeA}`);

    await page.fill('input[placeholder="Enter new income..."]', 'PersonB');
    await page.click('.add-income .add-button');
    await page.getByTestId('income-1').fill(`${incomeB}`);

    // Add and set up expenses
    await page.fill('input[placeholder="Enter new expense..."]', 'Rent');
    await page.click('.add-expense .add-button');
    await page.getByTestId('expense-0').fill('12000');

    await page.fill('input[placeholder="Enter new expense..."]', 'Groceries');
    await page.click('.add-expense .add-button');
    await page.getByTestId('expense-1').fill('500');

    // Ensure split mode is off
    const splitMode = await page.locator('#split-mode').isChecked();
    if (splitMode) {
      await page.locator('#split-mode').click();
    }

    // Click split button
    await page.click('.split-button');

    // Verify proportional split
    const totalIncome = incomeA + incomeB;
    const totalExpenses = 12000 + 500;

    const expenseA = (incomeA / totalIncome * totalExpenses).toFixed(2);
    const shareA = (incomeA / totalIncome).toFixed(2);
    const percentA = (shareA * 100).toFixed(2);

    const expenseB = (incomeB / totalIncome * totalExpenses).toFixed(2);
    const shareB = (incomeB / totalIncome).toFixed(2);
    const percentB = (shareB * 100).toFixed(2);

    await expect(page.getByTestId('share-0')).toContainText(`${expenseA} kr (${percentA}%)`);
    await expect(page.getByTestId('share-1')).toContainText(`${expenseB} kr (${percentB}%)`);
  });

  test('should split expenses equally when split mode is on', async ({ page }) => {
    const incomeA = 30000;
    const incomeB = 25000;

    // Add and set up incomes
    await page.fill('input[placeholder="Enter new income..."]', 'PersonA');
    await page.click('.add-income .add-button');
    await page.getByTestId('income-0').fill(`${incomeA}`);

    await page.fill('input[placeholder="Enter new income..."]', 'PersonB');
    await page.click('.add-income .add-button');
    await page.getByTestId('income-1').fill(`${incomeB}`);

    // Add and set up expenses
    await page.fill('input[placeholder="Enter new expense..."]', 'Rent');
    await page.click('.add-expense .add-button');
    await page.getByTestId('expense-0').fill('12000');

    await page.fill('input[placeholder="Enter new expense..."]', 'Groceries');
    await page.click('.add-expense .add-button');
    await page.getByTestId('expense-1').fill('500');

    // Enable split mode
    await page.getByTestId('toggle-label').click();

    // Click split button
    await page.click('.split-button');

    // Verify equal split
    const shares = await page.locator('li:has-text("Share")').all();
    expect(shares).toHaveLength(2);

    // Each should pay half of total expenses
    const totalExpenses = 12000 + 500;
    const expectedShare = (totalExpenses / 2).toFixed(2);

    for (const share of shares) {
      await expect(share).toContainText(`${expectedShare} kr (50.00%)`);
    }
  });

  test('should persist data between sessions', async ({ page }) => {
    // Add and set up incomes
    await page.fill('input[placeholder="Enter new income..."]', 'testuser');
    await page.click('.add-income .add-button');
    await page.getByTestId('income-0').fill('30000');

    // Add and set up expenses
    await page.fill('input[placeholder="Enter new expense..."]', 'Rent');
    await page.click('.add-expense .add-button');
    await page.getByTestId('expense-0').fill('12000');

    // Reload the page
    await page.reload();

    // Verify data was persisted
    await expect(page.getByTestId('income-0')).toHaveValue('30000');
    await expect(page.getByTestId('expense-0')).toHaveValue('12000');
  });

  test('should clear storage when reset button is clicked', async ({ page }) => {
    // Add and set up incomes
    await page.fill('input[placeholder="Enter new income..."]', 'testuser');
    await page.click('.add-income .add-button');
    await page.getByTestId('income-0').fill('30000');

    // Add and set up expenses
    await page.fill('input[placeholder="Enter new expense..."]', 'Rent');
    await page.click('.add-expense .add-button');
    await page.getByTestId('expense-0').fill('12000');

    // Click clear button
    await page.click('.clear-storage-button');

    // Verify data was cleared
    await expect(page.getByTestId('income-list')).not.toBeVisible();
    await expect(page.getByTestId('expense-list')).not.toBeVisible();
  });
});
