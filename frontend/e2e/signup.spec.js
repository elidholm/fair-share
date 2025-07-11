import { test, expect } from '@playwright/test';

test.describe('Sign Up Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-up');
  });

  test('should render sign up form correctly', async ({ page }) => {
    await expect(page.locator('h1:has-text("Sign Up")')).toBeVisible();
    await expect(page.locator('label:has-text("Email Address")')).toBeVisible();
    await expect(page.locator('label:has-text("Username")')).toBeVisible();
    await expect(page.getByText('Password', { exact: true })).toBeVisible();
    await expect(page.locator('label:has-text("Password (Confirm)")')).toBeVisible();
    await expect(page.locator('button:has-text("Submit")')).toBeVisible();
  });

  test('should show error when passwords do not match', async ({ page }) => {
    await page.fill('#email', 'test@example.com');
    await page.fill('#username', 'testuser');
    await page.fill('#password1', 'password123');
    await page.fill('#password2', 'differentpassword');
    await page.click('button:has-text("Submit")');

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toHaveText("Passwords don't match");
  });

  test('should show error when required fields are empty', async ({ page }) => {
    await page.click('button:has-text("Submit")');

    expect(page.locator('#email:invalid')).toBeTruthy();
    expect(page.locator('#username:invalid')).toBeTruthy();
    expect(page.locator('#password1:invalid')).toBeTruthy();
    expect(page.locator('#password2:invalid')).toBeTruthy();
  });

  test('should successfully submit valid form', async ({ page }) => {
    await page.route('/api/auth/register', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.fill('#email', 'test@example.com');
    await page.fill('#username', 'testuser');
    await page.fill('#password1', 'password123');
    await page.fill('#password2', 'password123');
    await page.click('button:has-text("Submit")');

    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
  });

  test('should show server error message', async ({ page }) => {
    await page.route('/api/auth/register', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: "Email already in use" }),
      });
    });

    await page.fill('#email', 'test@example.com');
    await page.fill('#username', 'testuser');
    await page.fill('#password1', 'password123');
    await page.fill('#password2', 'password123');
    await page.click('button:has-text("Submit")');

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toHaveText("Email already in use");
  });
});
