import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsTech, loginAsCustomer } from './auth';

test.describe('Role Access Tests', () => {
  test('admin can access admin routes', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    await expect(page).toHaveURL('/admin/dashboard');
  });

  test('admin can access tech routes', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/tech');
    // /tech redirects to /tech/today
    await expect(page).toHaveURL('/tech/today');
  });

  test('admin can access customer management', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/customers');
    // The /customers route should redirect to /admin/clients
    await expect(page).toHaveURL('/admin/clients', { timeout: 10000 });
  });

  test('tech can access tech routes', async ({ page }) => {
    await loginAsTech(page);
    await page.goto('/tech');
    // /tech redirects to /tech/today
    await expect(page).toHaveURL('/tech/today');
  });

  test('tech cannot access admin routes', async ({ page }) => {
    await loginAsTech(page);
    await page.goto('/admin');
    // Should redirect or show access denied
    await expect(page).not.toHaveURL('/admin');
  });

  test('customer can access portal routes', async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto('/portal/home');
    await expect(page).toHaveURL('/portal/home');
  });

  test('customer cannot access admin routes', async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto('/admin');
    await expect(page).not.toHaveURL('/admin');
  });

  test('unauthenticated cannot access protected routes', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL('/auth/login');

    await page.goto('/tech');
    await expect(page).toHaveURL('/auth/login');

    await page.goto('/portal/home');
    await expect(page).toHaveURL('/auth/login');
  });
});
