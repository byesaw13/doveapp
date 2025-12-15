import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('unauthenticated user redirected to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/auth/login');
  });

  // For role tests, would need auth setup
  test.skip('admin role lands on dashboard', async ({ page }) => {
    // TODO: Set up test auth
  });

  test('tech jobs redirects to today', async ({ page }) => {
    await page.goto('/tech/jobs');
    await expect(page).toHaveURL('/tech/today');
  });
});
