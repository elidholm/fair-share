import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the hero section', async ({ page }) => {
    // Test main heading and tagline
    await expect(page.getByRole('heading', { name: 'Welcome to Fair Share' })).toBeVisible();
    await expect(page.getByText('Simplifying shared finances for couples and roommates')).toBeVisible();
  });

  test('should display feature cards with working links', async ({ page }) => {
    // Test both feature cards
    const featureCards = await page.locator('.feature-card').all();
    expect(featureCards.length).toBe(2);

    // Test Split Costs feature
    await expect(page.getByRole('heading', { name: 'Split Costs' })).toBeVisible();
    await expect(page.getByText('Easily divide expenses based on income')).toBeVisible();
    const splitCostsLink = page.getByRole('link', { name: 'Split Expenses' });
    await expect(splitCostsLink).toBeVisible();
    await expect(splitCostsLink).toHaveAttribute('href', '/split-costs');

    // Test Budget Planning feature
    await expect(page.getByRole('heading', { name: 'Budget Planning' })).toBeVisible();
    await expect(page.getByText('Create and manage your monthly budget')).toBeVisible();
    const budgetLink = page.getByRole('link', { name: 'Plan Budget' });
    await expect(budgetLink).toBeVisible();
    await expect(budgetLink).toHaveAttribute('href', '/budget');
  });

  test('should display the "How It Works" steps', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'How It Works' })).toBeVisible();

    const steps = await page.locator('.step').all();
    expect(steps.length).toBe(4);

    // Verify each step
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

  test('should have working call-to-action buttons', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Ready to simplify your shared finances?' })).toBeVisible();

    const primaryButton = page.getByRole('link', { name: 'Start Splitting Costs' });
    await expect(primaryButton).toBeVisible();
    await expect(primaryButton).toHaveClass(/primary-button/);
    await expect(primaryButton).toHaveAttribute('href', '/split-costs');

    const secondaryButton = page.getByRole('link', { name: 'Create a Budget' });
    await expect(secondaryButton).toBeVisible();
    await expect(secondaryButton).toHaveClass(/secondary-button/);
    await expect(secondaryButton).toHaveAttribute('href', '/budget');
  });

  test('should navigate to correct pages when clicking links', async ({ page }) => {
    // Test feature links
    await page.getByRole('link', { name: 'Split Expenses' }).click();
    await expect(page).toHaveURL(/\/split-costs/);
    await page.goBack();

    await page.getByRole('link', { name: 'Plan Budget' }).click();
    await expect(page).toHaveURL(/\/budget/);
    await page.goBack();

    // Test CTA links
    await page.getByRole('link', { name: 'Start Splitting Costs' }).click();
    await expect(page).toHaveURL(/\/split-costs/);
    await page.goBack();

    await page.getByRole('link', { name: 'Create a Budget' }).click();
    await expect(page).toHaveURL(/\/budget/);
  });
});
