import { test, expect } from '@playwright/test';

test.describe('Sign Up Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-up');
  });

  test('should render sign up form correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: false }).first()).toBeVisible();
    await expect(page.getByLabel('Password (Confirm)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
  });

  test('should show an inline mismatch error as the confirmation is typed', async ({ page }) => {
    await page.locator('#password1').fill('password123');
    await page.locator('#password2').fill('differentpassword');

    await expect(page.getByText("Passwords don't match")).toBeVisible();
    await expect(page.locator('#password2')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();
  });

  test('should block submission when passwords do not match', async ({ page }) => {
    await page.locator('#email').fill('test@example.com');
    await page.locator('#username').fill('testuser');
    await page.locator('#password1').fill('password123');
    await page.locator('#password2').fill('differentpassword');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByText("Passwords don't match")).toBeVisible();
    await expect(page).toHaveURL('/sign-up');
  });

  test('should show error when required fields are empty', async ({ page }) => {
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.locator('#email:invalid')).toBeVisible();
    await expect(page.locator('#username:invalid')).toBeVisible();
    await expect(page.locator('#password1:invalid')).toBeVisible();
    await expect(page.locator('#password2:invalid')).toBeVisible();
  });

  test('should show a loading state while submitting', async ({ page }) => {
    // Hold the response open until we've confirmed the loading state, rather than
    // relying on a fixed delay racing against assertion polling.
    let resolveRegister;
    const registerResponseReady = new Promise((resolve) => { resolveRegister = resolve; });
    await page.route('/api/auth/register', async (route) => {
      await registerResponseReady;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.locator('#email').fill('test@example.com');
    await page.locator('#username').fill('testuser');
    await page.locator('#password1').fill('password123');
    await page.locator('#password2').fill('password123');
    // The button's accessible name changes to "Signing up" while loading (its
    // visible label is hidden), so use a name-independent locator that keeps
    // resolving to the same element throughout the submission.
    const submitButton = page.locator('.signup__form button[type="submit"]');
    await expect(submitButton).toHaveAccessibleName('Submit');
    await submitButton.click();

    await expect(submitButton).toHaveAttribute('aria-busy', 'true');
    await expect(submitButton).toHaveAccessibleName('Signing up');

    resolveRegister();
    await page.waitForURL('/login');
  });

  test('should successfully submit valid form', async ({ page }) => {
    await page.route('/api/auth/register', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.locator('#email').fill('test@example.com');
    await page.locator('#username').fill('testuser');
    await page.locator('#password1').fill('password123');
    await page.locator('#password2').fill('password123');
    await page.getByRole('button', { name: 'Submit' }).click();

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

    await page.locator('#email').fill('test@example.com');
    await page.locator('#username').fill('testuser');
    await page.locator('#password1').fill('password123');
    await page.locator('#password2').fill('password123');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Email already in use');
  });

  test('should show a network error message when the request fails', async ({ page }) => {
    await page.route('/api/auth/register', route => route.abort('failed'));

    await page.locator('#email').fill('test@example.com');
    await page.locator('#username').fill('testuser');
    await page.locator('#password1').fill('password123');
    await page.locator('#password2').fill('password123');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Unable to reach the server');
  });
});
