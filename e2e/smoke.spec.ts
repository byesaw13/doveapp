import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsTech, loginAsCustomer } from './auth';

test.describe('Smoke Tests', () => {
  test('unauthenticated user redirected to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/auth/login');
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test.skip('admin role lands on dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL('/admin');
  });

  test.skip('tech role lands on dashboard', async ({ page }) => {
    await loginAsTech(page);
    await expect(page).toHaveURL('/tech');
  });

  test.skip('customer role lands on dashboard', async ({ page }) => {
    await loginAsCustomer(page);
    await expect(page).toHaveURL('/customer');
  });

  test.describe('Protected Route Access', () => {
    test('tech jobs requires authentication', async ({ page }) => {
      await page.goto('/tech/jobs');
      // Should redirect to login for unauthenticated access
      await expect(page).toHaveURL('/auth/login');
    });

    test('tech today requires authentication', async ({ page }) => {
      await page.goto('/tech/today');
      // Should redirect to login for unauthenticated access
      await expect(page).toHaveURL('/auth/login');
    });

    test('tech schedule requires authentication', async ({ page }) => {
      await page.goto('/tech/schedule');
      // Should redirect to login for unauthenticated access
      await expect(page).toHaveURL('/auth/login');
    });

    test('tech profile requires authentication', async ({ page }) => {
      await page.goto('/tech/profile');
      // Should redirect to login for unauthenticated access
      await expect(page).toHaveURL('/auth/login');
    });
  });
});
