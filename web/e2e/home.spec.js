import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the hero section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome to Fair Share' })).toBeVisible();
    await expect(page.getByText('Simplifying shared finances for couples and roommates')).toBeVisible();
  });

  test('should display feature cards with working links', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Split Costs' })).toBeVisible();
    await expect(page.getByText('Easily divide expenses based on income')).toBeVisible();
    const splitCostsLink = page.getByRole('link', { name: 'Split Expenses' });
    await expect(splitCostsLink).toBeVisible();
    await expect(splitCostsLink).toHaveAttribute('href', '/split-costs');

    await expect(page.getByRole('heading', { name: 'Budget Planning' })).toBeVisible();
    await expect(page.getByText('Create and manage your monthly budget')).toBeVisible();
    const budgetLink = page.getByRole('link', { name: 'Plan Budget' });
    await expect(budgetLink).toBeVisible();
    await expect(budgetLink).toHaveAttribute('href', '/budget');
  });

  test('should display the "How It Works" steps', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'How It Works' })).toBeVisible();

    const steps = await page.locator('.home__steps').getByRole('listitem').all();
    expect(steps.length).toBe(4);

    const stepTexts = [
      'Enter individual incomes for fair expense distribution',
      'Add your shared expenses with descriptions and amounts',
      'Choose between proportional or equal splitting methods',
      'View the calculated shares for each person'
    ];

    for (let i = 0; i < steps.length; i++) {
      await expect(steps[i]).toContainText((i + 1).toString());
      await expect(steps[i]).toContainText(stepTexts[i]);
    }
  });

  test('should have working call-to-action links', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Ready to simplify your shared finances?' })).toBeVisible();

    const primaryLink = page.getByRole('link', { name: 'Start Splitting Costs' });
    await expect(primaryLink).toBeVisible();
    await expect(primaryLink).toHaveAttribute('href', '/split-costs');

    const secondaryLink = page.getByRole('link', { name: 'Create a Budget' });
    await expect(secondaryLink).toBeVisible();
    await expect(secondaryLink).toHaveAttribute('href', '/budget');
  });

  test('should navigate to correct pages when clicking links', async ({ page }) => {
    await page.getByRole('link', { name: 'Split Expenses' }).click();
    await expect(page).toHaveURL(/\/split-costs/);
    await page.goBack();

    await page.getByRole('link', { name: 'Plan Budget' }).click();
    await expect(page).toHaveURL(/\/budget/);
    await page.goBack();

    await page.getByRole('link', { name: 'Start Splitting Costs' }).click();
    await expect(page).toHaveURL(/\/split-costs/);
    await page.goBack();

    await page.getByRole('link', { name: 'Create a Budget' }).click();
    await expect(page).toHaveURL(/\/budget/);
  });

  test('should not overflow the document at the narrowest supported viewport', async ({ page }) => {
    // 280px matches index.scss's `body { min-width: 280px; }`. The main
    // document must never scroll horizontally, even though the mobile nav's
    // link row intentionally scrolls within its own container.
    await page.setViewportSize({ width: 280, height: 800 });
    await page.goto('/');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(280);

    const home = page.locator('.home');
    await expect(home).toBeVisible();
    const box = await home.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(280);
  });
});
