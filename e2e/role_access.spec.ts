import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsTech, loginAsCustomer } from './auth';

test.describe('Role Access Tests', () => {
  test('admin can access admin routes', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    await expect(page).toHaveURL('/admin');
  });

  test('admin can access tech routes', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/tech');
    await expect(page).toHaveURL('/tech');
  });

  test('admin can access customer routes', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/customer');
    await expect(page).toHaveURL('/customer');
  });

  test('tech can access tech routes', async ({ page }) => {
    await loginAsTech(page);
    await page.goto('/tech');
    await expect(page).toHaveURL('/tech');
  });

  test('tech cannot access admin routes', async ({ page }) => {
    await loginAsTech(page);
    await page.goto('/admin');
    // Should redirect or show access denied
    await expect(page).not.toHaveURL('/admin');
  });

  test('customer can access customer routes', async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto('/customer');
    await expect(page).toHaveURL('/customer');
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

    await page.goto('/customer');
    await expect(page).toHaveURL('/auth/login');
  });
});
