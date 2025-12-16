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

  test.describe('Tech Portal Navigation', () => {
    test('tech jobs loads directly', async ({ page }) => {
      await page.goto('/tech/jobs');
      // Should load the jobs page without redirect
      await expect(page.locator('h1')).toContainText('My Jobs');
      // Check for main elements
      await expect(page.locator('text=Search jobs...')).toBeVisible();
      await expect(page.locator('text=All Status')).toBeVisible();
    });

    test('tech today loads directly', async ({ page }) => {
      await page.goto('/tech/today');
      // Should load the today page without redirect
      await expect(page.locator('h1')).toContainText("Today's Visits");
    });

    test('tech schedule loads directly', async ({ page }) => {
      await page.goto('/tech/schedule');
      // Should load the schedule page without redirect
      await expect(page.locator('h1')).toContainText('Schedule');
    });

    test('tech profile loads directly', async ({ page }) => {
      await page.goto('/tech/profile');
      // Should load the profile page without redirect
      await expect(page.locator('text=Profile')).toBeVisible();
    });

    test('tech jobs navigation works', async ({ page }) => {
      await page.goto('/tech/jobs');
      // Wait for page to load
      await expect(page.locator('h1')).toContainText('My Jobs');

      // Test basic interaction - search should be present
      const searchInput = page.locator('input[placeholder="Search jobs..."]');
      await expect(searchInput).toBeVisible();

      // Test status filter
      const statusSelect = page.locator('text=All Status');
      await expect(statusSelect).toBeVisible();
    });
  });
});
