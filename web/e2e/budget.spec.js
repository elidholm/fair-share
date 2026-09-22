import { test, expect } from '@playwright/test';

test.describe('Budget Page', () => {
  test('should load the budget page', async ({ page }) => {
    await page.goto('/budget');
    await expect(page.locator('h1:has-text("Budget")')).toBeVisible();
  });
});
