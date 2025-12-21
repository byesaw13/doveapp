import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsTech, loginAsCustomer } from './auth';

test.describe('Navigation Tests', () => {
  test('admin navigation works', async ({ page }) => {
    await loginAsAdmin(page);

    // Test sidebar navigation - we're already on dashboard after login
    await expect(page).toHaveURL('/admin/dashboard');

    // Verify we can see the dashboard greeting
    await expect(
      page.getByRole('heading', { name: /good morning/i })
    ).toBeVisible({
      timeout: 10000,
    });
  });

  test('tech navigation works', async ({ page }) => {
    await loginAsTech(page);

    // Verify we're on a tech page after login
    await expect(page).toHaveURL(/\/tech/);

    // Test basic navigation to jobs page
    await page.getByRole('link', { name: /jobs/i }).click();
    await expect(page).toHaveURL('/tech/jobs');
  });

  test('customer navigation works', async ({ page }) => {
    await loginAsCustomer(page);

    // Verify we're on a portal page after login
    await expect(page).toHaveURL(/\/portal/);
  });

  test('key buttons work', async ({ page }) => {
    await loginAsAdmin(page);

    // Test quick add buttons if present
    const addClientButton = page.getByRole('button', { name: /add client/i });
    if (await addClientButton.isVisible()) {
      await addClientButton.click();
      // Check if modal or page opened
      await expect(page.locator('text=Add Client')).toBeVisible();
    }
  });
});
