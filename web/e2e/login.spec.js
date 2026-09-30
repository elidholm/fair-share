import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should render login form correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.getByText("Don't have an account?")).toBeVisible();
    await expect(page.getByTestId('signup-link-text')).toBeVisible();
  });

  test('should show error when required fields are empty', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.locator('#username:invalid')).toBeVisible();
    await expect(page.locator('#password:invalid')).toBeVisible();
  });

  test('should navigate to sign up page', async ({ page }) => {
    await page.getByTestId('signup-link-text').click();
    await expect(page).toHaveURL('/sign-up');
  });

  test('should show a loading state while submitting', async ({ page }) => {
    // Hold the response open until we've confirmed the loading state, rather than
    // relying on a fixed delay racing against assertion polling.
    let resolveLogin;
    const loginResponseReady = new Promise((resolve) => { resolveLogin = resolve; });
    await page.route('/api/auth/login', async (route) => {
      await loginResponseReady;
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

    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Password').fill('password123');
    // The button's accessible name changes to "Logging in" while loading (its
    // visible label is hidden), so use a name-independent locator that keeps
    // resolving to the same element throughout the submission.
    const submitButton = page.locator('.login__form button[type="submit"]');
    await expect(submitButton).toHaveAccessibleName('Login');
    await submitButton.click();

    await expect(submitButton).toHaveAttribute('aria-busy', 'true');
    await expect(submitButton).toHaveAccessibleName('Logging in');

    resolveLogin();
    await page.waitForURL('/');
  });

  test('should successfully submit valid form', async ({ page }) => {
    await page.route('/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
    // Login navigates only after AuthContext.login() confirms the session via
    // /api/auth/me, so that endpoint must be mocked too.
    await page.route('/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1, username: 'testuser', email: 'test@test.com' }),
      });
    });

    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();

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

    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Invalid credentials');
  });

  test('should show a network error message when the request fails', async ({ page }) => {
    await page.route('/api/auth/login', route => route.abort('failed'));

    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Unable to reach the server');
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

    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();

    // Verify navigation to home page
    await page.waitForURL('/');

    // Create a new page in the same context to verify auth state
    const newPage = await context.newPage();
    await newPage.goto('/');
    // Add verification for authenticated state (e.g., check for logout button)
  });
});
