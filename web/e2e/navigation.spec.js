import { test, expect } from '@playwright/test';

test.describe('Navigation Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('NavBar', () => {
    test('should render correct navigation depending on screen size', async ({ page }) => {
      const navBar = page.locator('.NavBar');
      await expect(navBar).toBeVisible();

      const desktopNav = page.locator('.DesktopNavigation');
      const mobileNav = page.locator('.MobileNavigation');

      const viewport = page.viewportSize();

      if (viewport.width > 768) {
        await expect(desktopNav).toBeVisible();
        await expect(mobileNav).toBeHidden();
      } else {
        await expect(desktopNav).toBeHidden();
        await expect(mobileNav).toBeVisible();
      }
    });

    test('keeps mobile navigation usable without page overflow', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 700 });
      await expect(page.locator('.MobileNavigation')).toBeVisible();
      await expect(page.locator('.DesktopNavigation')).toBeHidden();
      await expect(page.getByRole('link', { name: 'Split costs' })).toBeVisible();
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width).toBeLessThanOrEqual(320);
    });

    test('uses a solid header when transparency is reduced', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Media emulation for reduced transparency uses CDP');
      const session = await page.context().newCDPSession(page);
      await session.send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
      });
      const nav = page.locator('.DesktopNavigation');
      await expect(nav).toBeVisible();
      await expect(nav).toHaveCSS('background-color', 'rgb(22, 28, 38)');
      await expect(nav).toHaveCSS('backdrop-filter', 'none');
      await session.detach();
    });
  });

  test.describe('Navigation', () => {
    test('should display logo linking to homepage', async ({ page }) => {
      const viewport = page.viewportSize();

      var logoLink = page.locator('.desktop-nav-logo');
      if (viewport.width < 768) {
        logoLink = page.locator('.mobile-nav-logo');
      }
      await expect(logoLink).toBeVisible();
      await expect(logoLink).toHaveAttribute('href', '/');
      await expect(logoLink).toHaveText('FairShare');
    });

    test('should show login/signup when logged out', async ({ page }) => {
      const signUpLink = page.getByRole('link', { name: 'Sign Up' });
      const loginLink = page.getByRole('link', { name: 'Login' });

      await expect(signUpLink).toBeVisible();
      await expect(signUpLink).toHaveAttribute('href', '/sign-up');
      await expect(loginLink).toBeVisible();
      await expect(loginLink).toHaveAttribute('href', '/login');
      await expect(loginLink).toHaveCSS('text-decoration-line', 'none');
    });
  });

  test.describe('NavLinks', () => {
    test('marks the current page and supports keyboard navigation', async ({ page }) => {
      const home = page.getByRole('link', { name: 'Home' });
      await expect(home).toHaveAttribute('aria-current', 'page');
      await home.focus();
      await expect(home).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/home$/);
      await expect(home).toHaveAttribute('aria-current', 'page');
    });

    test('should display all navigation links', async ({ page }) => {
      const navLinks = page.locator('.NavLinks a');
      await expect(navLinks).toHaveCount(6);

      await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Split costs' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Budget', exact: true })).toBeVisible();
    });

    test('should navigate to correct routes', async ({ page }) => {
      await page.getByRole('link', { name: 'Home' }).click();
      await expect(page).toHaveURL(/\/home/);

      await page.getByRole('link', { name: 'Split costs' }).click();
      await expect(page).toHaveURL(/\/split-costs/);

      await page.getByRole('link', { name: 'Budget', exact: true }).click();
      await expect(page).toHaveURL(/\/budget/);
    });
  });

  test.describe('Authentication Flow', () => {
    test('should navigate to login page when clicking login', async ({ page }) => {
      await page.getByRole('link', { name: 'Login' }).click();
      await expect(page).toHaveURL(/\/login/);
    });

    test('should navigate to signup page when clicking signup', async ({ page }) => {
      await page.getByRole('link', { name: 'Sign Up' }).click();
      await expect(page).toHaveURL(/\/sign-up/);
    });
  });
});
