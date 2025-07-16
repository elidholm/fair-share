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
    await expect(page.getByTestId('expense-1')).toHaveValue('1196');
    await expect(page.getByTestId('expense-5')).toHaveValue('579');
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

    await expect(page.getByTestId('expense-8')).toBeVisible();

    await page.click('li:has-text("Netflix") .remove-button');
    await expect(page.getByTestId('expense-8')).not.toBeVisible();
  });

  test('should calculate totals correctly', async ({ page }) => {
    await page.fill('input[placeholder="Enter new income..."]', 'Salary');
    await page.click('.add-income .add-button');
    await page.fill('input[placeholder="Enter new income..."]', 'Bonus');
    await page.click('.add-income .add-button');

    // Set income amounts
    await page.getByTestId('income-0').fill('30000');
    await page.getByTestId('income-1').fill('25000');

    await expect(page.getByTestId('total-income')).toHaveText('Total: 55000 kr');

    await page.getByTestId('expense-0').fill('12000');
    await page.getByTestId('expense-3').fill('500');

    const expectedTotal = 12000 + 1196 + 139 + 500 + 579 + 299 + 312;
    await expect(page.getByTestId('total-expenses')).toContainText(`Total: ${expectedTotal} kr`);
  });

  test('should split expenses proportionally when split mode is off', async ({ page }) => {
    // Add and set up incomes
    await page.fill('input[placeholder="Enter new income..."]', 'PersonA');
    await page.click('.add-income .add-button');
    await page.fill('input[placeholder="Enter new income..."]', 'PersonB');
    await page.click('.add-income .add-button');
    await page.getByTestId('income-0').fill('30000');
    await page.getByTestId('income-1').fill('25000');

    // Set up expenses
    await page.getByTestId('expense-0').fill('12000');

    // Ensure split mode is off
    const splitMode = await page.locator('#split-mode').isChecked();
    if (splitMode) {
      await page.locator('#split-mode').click();
    }

    // Click split button
    await page.click('.split-button');

    // Verify proportional split
    const totalIncome = 30000 + 25000;
    const totalExpenses = 12000 + 1196 + 139 + 579 + 299 + 312;

    const expenseA = (30000 / totalIncome * totalExpenses).toFixed(2);
    const shareA = (30000 / totalIncome).toFixed(2);
    const percentA = (shareA * 100).toFixed(2);

    const expenseB = (25000 / totalIncome * totalExpenses).toFixed(2);
    const shareB = (25000 / totalIncome).toFixed(2);
    const percentB = (shareB * 100).toFixed(2);

    await expect(page.getByTestId('share-0')).toContainText(`${expenseA} kr (${percentA}%)`);
    await expect(page.getByTestId('share-1')).toContainText(`${expenseB} kr (${percentB}%)`);
  });

  test('should split expenses equally when split mode is on', async ({ page }) => {
    // Add and set up incomes
    await page.fill('input[placeholder="Enter new income..."]', 'PersonA');
    await page.click('.add-income .add-button');
    await page.fill('input[placeholder="Enter new income..."]', 'PersonB');
    await page.click('.add-income .add-button');
    await page.getByTestId('income-0').fill('30000');
    await page.getByTestId('income-1').fill('25000');

    // Set up expenses
    await page.getByTestId('expense-0').fill('12000');

    // Enable split mode
    await page.getByTestId('toggle-label').click();

    // Click split button
    await page.click('.split-button');

    // Verify equal split
    const shares = await page.locator('li:has-text("Share")').all();
    expect(shares).toHaveLength(2);

    // Each should pay half of total expenses
    const totalExpenses = 12000 + 1196 + 139 + 579 + 299 + 312;
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

    // Set up expenses
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

    // Set up expenses
    await page.getByTestId('expense-0').fill('12000');

    // Click clear button
    await page.click('.clear-storage-button');

    // Verify data was cleared
    await expect(page.getByTestId('income-list')).not.toBeVisible();
    await expect(page.getByTestId('expense-0')).toHaveValue('');
  });
});
