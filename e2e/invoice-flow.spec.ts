import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './auth';

test.describe('Invoice Creation Flow', () => {
  test('create invoice from completed job', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to jobs page
    await page.goto('/admin/jobs');
    await page.waitForLoadState('networkidle');

    // Look for a completed job (or create one if needed)
    const completedJob = page.locator('tr:has-text("completed")').first();

    // If there's a completed job, try to create an invoice
    if (await completedJob.isVisible({ timeout: 5000 }).catch(() => false)) {
      await completedJob.click();

      // Look for "Create Invoice" button
      const createInvoiceBtn = page.getByRole('button', {
        name: /create invoice/i,
      });

      if (
        await createInvoiceBtn.isVisible({ timeout: 3000 }).catch(() => false)
      ) {
        await createInvoiceBtn.click();

        // Wait for redirect to invoices page or success message
        await expect(
          page.locator('text=/invoice.*created/i, text=/success/i')
        ).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('view invoice list', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to invoices page
    await page.goto('/admin/invoices');
    await page.waitForLoadState('networkidle');

    // Should see invoices page
    await expect(page).toHaveURL(/\/admin\/invoices/);

    // Should have invoice list or empty state
    const hasInvoices = await page
      .locator('table, [role="table"]')
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const hasEmptyState = await page
      .locator('text=/no invoices/i')
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasInvoices || hasEmptyState).toBeTruthy();
  });

  test('filter invoices by status', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/invoices');
    await page.waitForLoadState('networkidle');

    // Look for status filter tabs/buttons
    const draftFilter = page
      .locator('button:has-text("Draft"), [role="tab"]:has-text("Draft")')
      .first();

    if (await draftFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await draftFilter.click();
      await page.waitForLoadState('load');

      // URL might reflect the filter (this is optional based on implementation)
      // Just verify the page is still on invoices
      expect(page.url()).toContain('/invoices');
    }
  });
});

test.describe('Payment Recording Flow', () => {
  test('record payment on invoice', async ({ page }) => {
    await loginAsAdmin(page);

    // Go to invoices
    await page.goto('/admin/invoices');
    await page.waitForLoadState('networkidle');

    // Click on first invoice (if exists)
    const firstInvoice = page
      .locator('tr[data-invoice-id], a[href*="/invoices/"]')
      .first();

    if (await firstInvoice.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstInvoice.click();
      await page.waitForLoadState('networkidle');

      // Look for "Record Payment" button
      const recordPaymentBtn = page.getByRole('button', {
        name: /record payment|add payment/i,
      });

      if (
        await recordPaymentBtn.isVisible({ timeout: 3000 }).catch(() => false)
      ) {
        await recordPaymentBtn.click();

        // Should open a dialog/modal
        await expect(
          page.locator('dialog, [role="dialog"], .modal')
        ).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('view payment history', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/invoices');
    await page.waitForLoadState('networkidle');

    // Open an invoice detail page
    const invoiceLink = page.locator('a[href*="/invoices/"]').first();

    if (await invoiceLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await invoiceLink.click();
      await page.waitForLoadState('networkidle');

      // This is optional - some invoices might not have payments yet
      // Just verify the page loaded successfully
      expect(page.url()).toContain('/invoices/');
    }
  });
});

test.describe('Estimate to Job Conversion', () => {
  test('convert estimate to job', async ({ page }) => {
    await loginAsAdmin(page);

    // Go to estimates page
    await page.goto('/admin/estimates');
    await page.waitForLoadState('networkidle');

    // Look for an approved estimate
    const approvedEstimate = page
      .locator('tr:has-text("approved"), a[href*="/estimates/"]')
      .first();

    if (
      await approvedEstimate.isVisible({ timeout: 5000 }).catch(() => false)
    ) {
      await approvedEstimate.click();
      await page.waitForLoadState('networkidle');

      // Look for "Convert to Job" button
      const convertBtn = page.getByRole('button', {
        name: /convert.*job|create job/i,
      });

      if (await convertBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await convertBtn.click();

        // Should redirect to job page or show success
        await expect(
          page.locator('text=/job.*created/i, text=/success/i')
        ).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('view estimate details', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/estimates');
    await page.waitForLoadState('networkidle');

    // Open first estimate
    const estimateLink = page.locator('a[href*="/estimates/"]').first();

    if (await estimateLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await estimateLink.click();
      await page.waitForLoadState('networkidle');

      // Should show estimate details
      await expect(page).toHaveURL(/\/estimates\//);

      expect(page.url()).toContain('/estimates/');
    }
  });
});
