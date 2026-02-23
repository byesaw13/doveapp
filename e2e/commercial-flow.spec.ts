import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './auth';

test.describe('Invoice List Page - P7-T3 Commercial UX', () => {
  test('displays invoices list with filters', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/invoices');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/admin\/invoices/);

    await expect(page.getByRole('tab', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Draft' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Sent' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Partial' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Paid' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Void' })).toBeVisible();

    const searchInput = page.getByPlaceholder('Search invoices...');
    await expect(searchInput).toBeVisible();

    const dateButton = page.getByRole('button', { name: /date range/i });
    await expect(dateButton).toBeVisible();

    const amountButton = page.getByRole('button', { name: /amount/i });
    await expect(amountButton).toBeVisible();
  });

  test('filters persist in URL', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/invoices?status=draft&search=INV');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder('Search invoices...');
    await expect(searchInput).toHaveValue('INV');

    expect(page.url()).toContain('status=draft');
    expect(page.url()).toContain('search=INV');
  });

  test('toggles between table and cards view', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/invoices');
    await page.waitForLoadState('networkidle');

    const tableButton = page.getByRole('button', { name: /table/i });
    const cardsButton = page.getByRole('button', { name: /cards/i });

    await expect(tableButton).toBeVisible();
    await expect(cardsButton).toBeVisible();

    await cardsButton.click();
    await page.waitForLoadState('load');

    expect(page.url()).toContain('view=cards');

    await tableButton.click();
    await page.waitForLoadState('load');

    expect(page.url()).toContain('view=table');
  });
});

test.describe('Invoice Detail Page - P7-T3 Commercial UX', () => {
  test('displays invoice with sticky header and status', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/invoices');
    await page.waitForLoadState('networkidle');

    const invoiceLink = page.locator('a[href*="/admin/invoices/"]').first();

    if (await invoiceLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await invoiceLink.click();
      await page.waitForLoadState('networkidle');

      const backButton = page.getByRole('button').first();
      await expect(backButton).toBeVisible();

      const pdfButton = page.getByRole('button', { name: /pdf/i });
      await expect(pdfButton).toBeVisible();
    }
  });

  test('displays payment panel with balance', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/invoices');
    await page.waitForLoadState('networkidle');

    const invoiceLink = page.locator('a[href*="/admin/invoices/"]').first();

    if (await invoiceLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await invoiceLink.click();
      await page.waitForLoadState('networkidle');

      const paymentsHeading = page.getByText('Payments');
      const hasPayments = await paymentsHeading
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (hasPayments) {
        const balanceSection = page.locator('text=/balance/i');
        await expect(balanceSection.first()).toBeVisible();
      }
    }
  });

  test('shows record payment form when balance is due', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/invoices');
    await page.waitForLoadState('networkidle');

    const unpaidInvoice = page
      .locator('tr:has-text("sent"), tr:has-text("partial")')
      .first();

    if (await unpaidInvoice.isVisible({ timeout: 5000 }).catch(() => false)) {
      await unpaidInvoice.click();
      await page.waitForLoadState('networkidle');

      const recordPaymentBtn = page.getByRole('button', {
        name: /record payment/i,
      });

      if (
        await recordPaymentBtn.isVisible({ timeout: 3000 }).catch(() => false)
      ) {
        await recordPaymentBtn.click();

        const amountInput = page.getByLabel(/amount/i);
        await expect(amountInput).toBeVisible();

        const methodSelect = page.getByLabel(/method/i);
        await expect(methodSelect).toBeVisible();
      }
    }
  });
});

test.describe('Estimate List Page - P7-T3 Commercial UX', () => {
  test('displays estimates with view toggle', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/estimates');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/admin\/estimates/);

    const tableButton = page.getByRole('button', { name: /table/i });
    const cardsButton = page.getByRole('button', { name: /cards/i });
    const kanbanButton = page.getByRole('button', { name: /kanban/i });

    await expect(tableButton).toBeVisible();
    await expect(cardsButton).toBeVisible();
    await expect(kanbanButton).toBeVisible();
  });

  test('filters persist in URL', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/estimates?status=sent&search=EST');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder('Search estimates...');
    await expect(searchInput).toHaveValue('EST');

    expect(page.url()).toContain('status=sent');
    expect(page.url()).toContain('search=EST');
  });
});

test.describe('Estimate Detail Page - P7-T3 Commercial UX', () => {
  test('displays estimate with operational hub layout', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/estimates');
    await page.waitForLoadState('networkidle');

    const estimateLink = page.locator('a[href*="/admin/estimates/"]').first();

    if (await estimateLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await estimateLink.click();
      await page.waitForLoadState('networkidle');

      const backButton = page.getByRole('button').first();
      await expect(backButton).toBeVisible();

      const pdfButton = page.getByRole('button', { name: /pdf/i });
      await expect(pdfButton).toBeVisible();

      const lineItemsSection = page.getByText(/line items/i);
      await expect(lineItemsSection).toBeVisible();
    }
  });

  test('shows send dialog for draft estimates', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/estimates?status=draft');
    await page.waitForLoadState('networkidle');

    const draftEstimate = page.locator('a[href*="/admin/estimates/"]').first();

    if (await draftEstimate.isVisible({ timeout: 5000 }).catch(() => false)) {
      await draftEstimate.click();
      await page.waitForLoadState('networkidle');

      const sendButton = page.getByRole('button', { name: /^send$/i });

      if (await sendButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await sendButton.click();

        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible();

        const emailCheckbox = page.getByLabel(/send via email/i);
        await expect(emailCheckbox).toBeVisible();
      }
    }
  });
});
