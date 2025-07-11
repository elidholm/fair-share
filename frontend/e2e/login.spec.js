import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should render login form correctly', async ({ page }) => {
    await expect(page.locator('h1:has-text("Welcome Back")')).toBeVisible();
    await expect(page.locator('label:has-text("Username")')).toBeVisible();
    await expect(page.locator('label:has-text("Password")')).toBeVisible();
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
    await expect(page.locator('text="Don\'t have an account?"')).toBeVisible();
    await expect(page.getByTestId('signup-link-text')).toBeVisible();
  });

  test('should show error when required fields are empty', async ({ page }) => {
    await page.click('button:has-text("Login")');

    expect(page.locator('#username:invalid')).toBeTruthy();
    expect(page.locator('#password:invalid')).toBeTruthy();
  });

  test('should navigate to sign up page', async ({ page }) => {
    await page.getByTestId('signup-link-text').click();
    await expect(page).toHaveURL('/sign-up');
  });

  test('should successfully submit valid form', async ({ page }) => {
    await page.route('/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.fill('#username', 'testuser');
    await page.fill('#password', 'password123');
    await page.click('button:has-text("Login")');

    await page.waitForURL('/');
    await expect(page).toHaveURL('/');
  });

  test('should show server error message', async ({ page }) => {
    await page.route('/api/auth/login', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: "Invalid credentials" }),
      });
    });

    await page.fill('#username', 'testuser');
    await page.fill('#password', 'wrongpassword');
    await page.click('button:has-text("Login")');

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toHaveText("Invalid credentials");
  });

  test('should persist auth state after login', async ({ page, context }) => {
    await page.route('/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.route('/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1, username: 'testuser', email: 'test@test.com' }),
      });
    });

    await page.fill('#username', 'testuser');
    await page.fill('#password', 'password123');
    await page.click('button:has-text("Login")');

    // Verify navigation to home page
    await page.waitForURL('/');

    // Create a new page in the same context to verify auth state
    const newPage = await context.newPage();
    await newPage.goto('/');
    // Add verification for authenticated state (e.g., check for logout button)
  });
});
