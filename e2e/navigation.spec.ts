import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsTech, loginAsCustomer } from './auth';

test.describe('Navigation Tests', () => {
  test('admin navigation works', async ({ page }) => {
    await loginAsAdmin(page);

    // Test sidebar navigation
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL('/admin');

    await page.getByRole('link', { name: /clients/i }).click();
    await expect(page).toHaveURL(/\/admin\/clients/);

    await page.getByRole('link', { name: /jobs/i }).click();
    await expect(page).toHaveURL(/\/admin\/jobs/);

    await page.getByRole('link', { name: /estimates/i }).click();
    await expect(page).toHaveURL(/\/admin\/estimates/);

    await page.getByRole('link', { name: /invoices/i }).click();
    await expect(page).toHaveURL(/\/admin\/invoices/);
  });

  test('tech navigation works', async ({ page }) => {
    await loginAsTech(page);

    // Test tech navigation
    await page.getByRole('link', { name: /jobs/i }).click();
    await expect(page).toHaveURL('/tech/jobs');

    await page.getByRole('link', { name: /today/i }).click();
    await expect(page).toHaveURL('/tech/today');

    await page.getByRole('link', { name: /schedule/i }).click();
    await expect(page).toHaveURL('/tech/schedule');
  });

  test('customer navigation works', async ({ page }) => {
    await loginAsCustomer(page);

    // Test customer navigation
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL('/customer');

    await page.getByRole('link', { name: /jobs/i }).click();
    await expect(page).toHaveURL('/customer/jobs');
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
