import { test, expect } from '@playwright/test';

async function addEntry(page, kind, name) {
  const label = kind === 'income' ? 'New income' : 'New expense';
  await page.getByLabel(label).fill(name);
  await page.getByRole('button', { name: kind === 'income' ? 'Add income' : 'Add expense' }).click();
}

async function setupHousehold(page, { incomeA = 30000, incomeB = 25000 } = {}) {
  await addEntry(page, 'income', 'PersonA');
  await page.getByLabel('Income for PersonA').fill(`${incomeA}`);
  await addEntry(page, 'income', 'PersonB');
  await page.getByLabel('Income for PersonB').fill(`${incomeB}`);

  await addEntry(page, 'expense', 'Rent');
  await page.getByLabel('Amount for Rent').fill('12000');
  await addEntry(page, 'expense', 'Groceries');
  await page.getByLabel('Amount for Groceries').fill('500');
}

function shares(page) {
  return page.getByRole('list', { name: 'Shares' }).getByRole('listitem');
}

test.describe('Cost Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/split-costs');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('shows empty incomes and expenses with guidance', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Incomes', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'No incomes yet' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Expenses', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'No expenses yet' })).toBeVisible();
  });

  test('adds, persists and removes income entries', async ({ page }) => {
    await addEntry(page, 'income', 'Freelance');
    await expect(page.getByLabel('Income for Freelance')).toBeVisible();

    await page.reload();
    await expect(page.getByLabel('Income for Freelance')).toBeVisible();

    await page.getByRole('button', { name: 'Remove income Freelance' }).click();
    await expect(page.getByLabel('Income for Freelance')).toHaveCount(0);
  });

  test('adds and removes expense entries with the Enter key', async ({ page }) => {
    await page.getByLabel('New expense').fill('Netflix');
    await page.getByLabel('New expense').press('Enter');
    await expect(page.getByLabel('Amount for Netflix')).toBeVisible();

    await page.getByRole('button', { name: 'Remove expense Netflix' }).click();
    await expect(page.getByLabel('Amount for Netflix')).toHaveCount(0);
  });

  test('calculates totals', async ({ page }) => {
    await setupHousehold(page);
    await expect(page.getByRole('status', { name: 'Total incomes' })).toHaveText('55000 kr');
    await expect(page.getByRole('status', { name: 'Total expenses' })).toHaveText('12500 kr');
  });

  test('splits proportionally when Split equally is off', async ({ page }) => {
    await setupHousehold(page);
    await expect(page.getByRole('switch', { name: 'Split equally' })).toHaveAttribute('aria-checked', 'false');
    await page.getByRole('button', { name: 'Split expenses' }).click();

    await expect(shares(page)).toHaveCount(2);
    await expect(shares(page).nth(0)).toContainText('6818.18 kr (54.55%)');
    await expect(shares(page).nth(1)).toContainText('5681.82 kr (45.45%)');
  });

  test('splits equally when Split equally is on', async ({ page }) => {
    await setupHousehold(page);
    await page.getByRole('switch', { name: 'Split equally' }).click();
    await expect(page.getByRole('switch', { name: 'Split equally' })).toHaveAttribute('aria-checked', 'true');
    await page.getByRole('button', { name: 'Split expenses' }).click();

    await expect(shares(page)).toHaveCount(2);
    for (const share of await shares(page).all()) {
      await expect(share).toContainText('6250.00 kr (50.00%)');
    }
  });

  test('guides the user instead of splitting invalid data', async ({ page }) => {
    await addEntry(page, 'expense', 'Rent');
    await page.getByLabel('Amount for Rent').fill('1000');
    await page.getByRole('button', { name: 'Split expenses' }).click();
    await expect(page.getByText('Add at least one person under Incomes before splitting.')).toBeVisible();

    await addEntry(page, 'income', 'PersonA');
    await page.getByLabel('Income for PersonA').fill('0');
    await expect(page.getByText(/Total income is 0 kr/)).toBeVisible();

    await page.getByLabel('Amount for Rent').fill('-5');
    await expect(page.getByText('Amount can’t be negative.')).toBeVisible();
    await expect(page.getByLabel('Amount for Rent')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText(/NaN/)).toHaveCount(0);

    await page.getByLabel('Amount for Rent').fill('1000');
    await page.getByRole('switch', { name: 'Split equally' }).click();
    await expect(shares(page).first()).toContainText('1000.00 kr (100.00%)');
  });

  test('persists amounts between sessions', async ({ page }) => {
    await addEntry(page, 'income', 'testuser');
    await page.getByLabel('Income for testuser').fill('30000');
    await addEntry(page, 'expense', 'Rent');
    await page.getByLabel('Amount for Rent').fill('12000');

    await page.reload();

    await expect(page.getByLabel('Income for testuser')).toHaveValue('30000');
    await expect(page.getByLabel('Amount for Rent')).toHaveValue('12000');
  });

  test('keeps data when reset is cancelled', async ({ page }) => {
    await addEntry(page, 'income', 'PersonA');

    await page.getByRole('button', { name: 'Reset calculator' }).click();
    const dialog = page.getByRole('dialog', { name: 'Reset calculator?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    await expect(dialog).toHaveCount(0);
    await expect(page.getByLabel('Income for PersonA')).toBeVisible();
  });

  test('clears everything when reset is confirmed', async ({ page }) => {
    await setupHousehold(page);

    await page.getByRole('button', { name: 'Reset calculator' }).click();
    await page.getByRole('dialog', { name: 'Reset calculator?' }).getByRole('button', { name: 'Reset' }).click();

    await expect(page.getByText('Calculator reset.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'No incomes yet' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'No expenses yet' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'No incomes yet' })).toBeVisible();
  });
});
