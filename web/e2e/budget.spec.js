import { test, expect } from '@playwright/test';

async function addCategory(page, name, amount) {
  await page.getByRole('button', { name: 'Add category' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name').fill(name);
  await dialog.getByLabel('Monthly limit').fill(amount);
  await dialog.getByRole('button', { name: 'Save category' }).click();
  await expect(dialog).toBeHidden();
}

async function addTransaction(page, name, amount) {
  await page.getByRole('button', { name: 'Add transaction' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name').fill(name);
  await dialog.getByLabel('Amount').fill(amount);
  await dialog.getByRole('button', { name: 'Save transaction' }).click();
  await expect(dialog).toBeHidden();
}

test.describe('Budget Page', () => {
  test('plans by month, persists on edit and cascades deletes within that month', async ({ page }) => {
    await page.goto('/budget');
    await expect(page.getByRole('heading', { name: 'Budget', exact: true })).toBeVisible();
    const month = page.getByLabel('Calendar month');
    await month.fill('2025-01');
    expect(await page.evaluate(() => localStorage.getItem('fairshare:budget'))).toBeNull();
    await addCategory(page, 'Food', '100');
    await addTransaction(page, 'Lunch', '120');
    await expect(page.getByText('Over budget by 20 kr')).toBeVisible();
    await month.fill('2025-02');
    await expect(page.getByRole('heading', { name: 'Food' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Lunch' })).toHaveCount(0);
    expect(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('fairshare:budget')).months))).toEqual(['2025-01']);
    await addTransaction(page, 'Dinner', '25');
    await page.getByRole('button', { name: 'Delete Food' }).click();
    const confirm = page.getByRole('dialog', { name: 'Delete Food?' });
    await expect(confirm).toContainText('Other months are unaffected');
    await confirm.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Dinner' })).toBeVisible();
    await page.getByRole('button', { name: 'Delete Food' }).click();
    await page.getByRole('dialog', { name: 'Delete Food?' }).getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Dinner' })).toHaveCount(0);
    await month.fill('2025-01');
    await expect(page.getByRole('heading', { name: 'Lunch' })).toBeVisible();
    await page.reload();
    await month.fill('2025-01');
    await expect(page.getByRole('heading', { name: 'Lunch' })).toBeVisible();
  });

  test('keeps forms and summaries usable on a narrow screen', async ({ page, isMobile }) => {
    if (!isMobile) await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/budget');
    await expect(page.getByLabel('Calendar month')).toBeVisible();
    await expect(page.getByText('No categories yet')).toBeVisible();
    await addCategory(page, 'Housing', '1200');
    await expect(page.getByRole('region', { name: 'Monthly summary' }).getByText('1 200 kr').first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
});
