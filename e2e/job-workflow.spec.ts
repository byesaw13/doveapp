import { test, expect } from '@playwright/test';
import { loginAsAdmin, waitForAppReady } from './auth';

test.describe('Job Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('jobs list page loads with filters', async ({ page }) => {
    await page.goto('/admin/jobs');
    await waitForAppReady(page);

    await expect(page.locator('text=Jobs')).toBeVisible();
    await expect(page.getByPlaceholder('Search jobs...')).toBeVisible();
    await expect(page.getByText('New Job')).toBeVisible();
  });

  test('can navigate to new job page', async ({ page }) => {
    await page.goto('/admin/jobs');
    await waitForAppReady(page);

    await page.click('text=New Job');
    await expect(page).toHaveURL('/admin/jobs/new');
    await expect(page.locator('text=New Job')).toBeVisible();
    await expect(page.getByLabel(/Client/)).toBeVisible();
  });

  test('can toggle between view modes', async ({ page }) => {
    await page.goto('/admin/jobs');
    await waitForAppReady(page);

    const tableBtn = page.getByRole('button', { name: /Table/i });
    const cardsBtn = page.getByRole('button', { name: /Cards/i });
    const kanbanBtn = page.getByRole('button', { name: /Kanban/i });

    await tableBtn.click();
    await expect(page).toHaveURL(/view=table/);

    await cardsBtn.click();
    await expect(page).toHaveURL(/view=cards/);

    await kanbanBtn.click();
    await expect(page).toHaveURL(/view=kanban/);
  });

  test('filters persist in URL', async ({ page }) => {
    await page.goto('/admin/jobs');
    await waitForAppReady(page);

    const searchInput = page.getByPlaceholder('Search jobs...');
    await searchInput.fill('test search');

    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/search=test/);
  });

  test('today page shows job counts', async ({ page }) => {
    await page.goto('/admin/today');
    await waitForAppReady(page);

    await expect(page.locator('text=Today')).toBeVisible();
    await expect(page.getByText(/Jobs Today/i)).toBeVisible();
  });

  test('schedule page loads calendar', async ({ page }) => {
    await page.goto('/admin/schedule');
    await waitForAppReady(page);

    await expect(page.locator('text=Calendar')).toBeVisible();
    await expect(page.getByRole('button', { name: /Today/i })).toBeVisible();
  });

  test('job detail page shows key information', async ({ page }) => {
    await page.goto('/admin/jobs');
    await waitForAppReady(page);

    const firstJob = page.locator('[href^="/admin/jobs/"]').first();
    if (await firstJob.isVisible()) {
      await firstJob.click();
      await waitForAppReady(page);

      await expect(
        page.locator('text=Job').or(page.locator('text=Client'))
      ).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('can navigate from today to jobs', async ({ page }) => {
    await page.goto('/admin/today');
    await waitForAppReady(page);

    const jobsLink = page.getByRole('link', { name: /View all/i });
    if (await jobsLink.isVisible()) {
      await jobsLink.click();
      await expect(page).toHaveURL('/admin/jobs');
    } else {
      test.skip();
    }
  });
});
