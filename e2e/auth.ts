import { Page } from '@playwright/test';

// Wait for the app to be ready (no loading states, main content visible)
export async function waitForAppReady(page: Page) {
  await page.waitForLoadState('networkidle');
  // Wait for common loading indicators to disappear
  await page
    .locator('text=Loading...')
    .waitFor({ state: 'detached', timeout: 5000 })
    .catch(() => {});
  await page
    .locator('[aria-busy="true"]')
    .waitFor({ state: 'detached', timeout: 5000 })
    .catch(() => {});
  // Ensure main content is visible
  await page.locator('body').waitFor({ timeout: 10000 });
}

export async function loginAsAdmin(page: Page) {
  await page.goto('/auth/login');
  await waitForAppReady(page);
  // Click the admin demo login button and wait for navigation
  await Promise.all([
    page.waitForURL(/\/admin/, { timeout: 15000 }),
    page.click('text=Admin Portal'),
  ]);
  await waitForAppReady(page);
}

export async function loginAsTech(page: Page) {
  await page.goto('/auth/login');
  await waitForAppReady(page);
  // Click the tech demo login button and wait for navigation
  await Promise.all([
    page.waitForURL(/\/tech/, { timeout: 15000 }),
    page.click('text=Technician Portal'),
  ]);
  await waitForAppReady(page);
}

export async function loginAsCustomer(page: Page) {
  await page.goto('/auth/login');
  await waitForAppReady(page);
  // Click the customer demo login button and wait for navigation
  await Promise.all([
    page.waitForURL(/\/portal/, { timeout: 15000 }),
    page.click('text=Customer Portal'),
  ]);
  await waitForAppReady(page);
}
