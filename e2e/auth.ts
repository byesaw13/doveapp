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
  const email = process.env.E2E_ADMIN_EMAIL!;
  const password = process.env.E2E_ADMIN_PASSWORD!;

  await page.goto('/auth/login');
  await waitForAppReady(page);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/admin');
  await waitForAppReady(page);
}

export async function loginAsTech(page: Page) {
  const email = process.env.E2E_TECH_EMAIL!;
  const password = process.env.E2E_TECH_PASSWORD!;

  await page.goto('/auth/login');
  await waitForAppReady(page);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/tech');
  await waitForAppReady(page);
}

export async function loginAsCustomer(page: Page) {
  const email = process.env.E2E_CUSTOMER_EMAIL!;
  const password = process.env.E2E_CUSTOMER_PASSWORD!;

  await page.goto('/auth/login');
  await waitForAppReady(page);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/customer');
  await waitForAppReady(page);
}
