# P7-T3: Estimates + Invoices + Payments UX Rewrite

**Date:** 2026-02-22
**Status:** READY FOR REVIEW
**Branch:** p7-t3-estimates-invoices-payments
**Builds on:** P7-T1 (commit 92736b0), P7-T2 (merged)

## What Changed

### 1. New Shared Commercial Components

| Component            | File                                            | Description                           |
| -------------------- | ----------------------------------------------- | ------------------------------------- |
| MoneySummaryCards    | `components/commercial/money-summary-cards.tsx` | Financial summary cards with variants |
| EstimateSummaryCards | `components/commercial/money-summary-cards.tsx` | Estimate-specific summary cards       |
| InvoiceSummaryCards  | `components/commercial/money-summary-cards.tsx` | Invoice-specific summary cards        |
| LineItemsTable       | `components/commercial/line-items-table.tsx`    | Line items with code, tier, totals    |
| LineItemsTotals      | `components/commercial/line-items-table.tsx`    | Subtotal/tax/discount/total summary   |
| EstimateFilters      | `components/commercial/estimate-filters.tsx`    | URL-persisted estimate filters        |
| InvoiceFilters       | `components/commercial/invoice-filters.tsx`     | URL-persisted invoice filters         |
| PaymentPanel         | `components/commercial/payment-panel.tsx`       | Payment recording with history        |

### 2. Estimates List Page Rewrite

| Feature         | Implementation                                                                |
| --------------- | ----------------------------------------------------------------------------- |
| View modes      | Table / Cards / Kanban toggle with URL persistence                            |
| Filters         | Status, Client, Date Range, Amount, Search                                    |
| URL persistence | All filters sync to URL for shareable links                                   |
| Bulk actions    | Multi-select with status change, export                                       |
| Summary cards   | EstimateSummaryCards at top with KPIs                                         |
| Status badges   | StatusBadge with semantic variants (draft, sent, approved, declined, expired) |

### 3. Estimate Detail Page Rewrite

| Feature            | Implementation                           |
| ------------------ | ---------------------------------------- |
| Operational hub    | Sticky header with status and actions    |
| Action rail        | Desktop: sidebar; Mobile: bottom bar     |
| Send dialog        | Email/SMS options with custom message    |
| Convert to Job     | CTA for approved estimates               |
| Line items         | LineItemsTable with LineItemsTotals      |
| Status transitions | Context-aware buttons with confirmations |

### 4. Invoices List Page Rewrite

| Feature         | Implementation                                    |
| --------------- | ------------------------------------------------- |
| View modes      | Table / Cards toggle with URL persistence         |
| Filters         | Status (tabs), Client, Date Range, Amount, Search |
| URL persistence | All filters sync to URL for shareable links       |
| Bulk actions    | Multi-select with mark as paid                    |
| Summary cards   | InvoiceSummaryCards with overdue indicator        |
| Overdue display | Days overdue badge on overdue invoices            |

### 5. Invoice Detail Page Rewrite

| Feature         | Implementation                          |
| --------------- | --------------------------------------- |
| Operational hub | Sticky header with status and actions   |
| Action rail     | Desktop: sidebar; Mobile: bottom bar    |
| PaymentPanel    | Payment recording with balance tracking |
| Payment history | Table showing all recorded payments     |
| Related records | Links to Job and Estimate if applicable |
| PDF download    | Quick PDF generation button             |

### 6. StatusBadge Enhancements

| Variant | Added For         |
| ------- | ----------------- |
| expired | Expired estimates |
| revised | Revised estimates |
| void    | Void invoices     |

## UX Before/After

### Before

- Inconsistent page layouts between estimates and invoices
- No URL persistence for filters
- Ad-hoc status styling with manual badge colors
- Inline payment forms without history
- No overdue indicators
- Desktop-focused design

### After

- Consistent PageHeader + PageContainer across all commercial pages
- URL-synced filters for shareability
- StatusBadge with semantic variants
- PaymentPanel with balance tracking and payment history
- Days overdue badges on invoices
- Mobile-first responsive design with sticky headers
- Action rails (desktop) / bottom bars (mobile)

## Files Touched

### New Files (10)

```
components/commercial/money-summary-cards.tsx
components/commercial/line-items-table.tsx
components/commercial/estimate-filters.tsx
components/commercial/invoice-filters.tsx
components/commercial/payment-panel.tsx
components/commercial/index.ts
__tests__/components/commercial/money-summary-cards.test.tsx
__tests__/components/commercial/line-items-table.test.tsx
__tests__/components/commercial/payment-panel.test.tsx
__tests__/components/commercial/invoice-filters.test.tsx
e2e/commercial-flow.spec.ts
```

### Modified Files (5)

```
app/admin/estimates/page.tsx
app/admin/estimates/[id]/summary/page.tsx
app/admin/invoices/page.tsx
app/admin/invoices/[id]/page.tsx
components/ui/status-badge.tsx
```

### Updated Docs (2)

```
docs/P7_T2_IMPLEMENTATION.md (appended progress note)
docs/P7_T3_IMPLEMENTATION.md (this file)
```

## Gate Results

### Type Check

```
npm run type-check
> tsc --noEmit
[Pass - 0 errors]
```

### Lint

```
npm run lint
[Pass - 0 errors, warnings only]
```

### Tests

```
[To be run]
```

## Risks/Follow-ups

### Risks

1. **Payment calculation edge cases** - Rounding issues in payment totals
   - Mitigation: Use toFixed(2) consistently, validate on backend

2. **Status transitions** - Some status transitions may need business logic
   - Mitigation: Server-side validation for status changes

3. **Mobile bottom bar overlap** - Fixed bottom bars can overlap content
   - Mitigation: Added pb-20 padding on mobile content areas

### Follow-ups

1. **Payment gateway integration** - Add Stripe/Square payment processing
2. **Recurring invoices** - Add recurring invoice scheduling
3. **Late payment reminders** - Automated overdue notifications
4. **Bulk invoice generation** - Generate invoices from multiple jobs
5. **Invoice templates** - Customizable invoice PDF templates

## Usage Examples

### InvoiceFilters

```tsx
import { InvoiceFilters, InvoiceFiltersState } from '@/components/commercial';

const [filters, setFilters] = useState<InvoiceFiltersState>({
  search: '',
  status: 'all',
  clientId: '',
  dateFrom: undefined,
  dateTo: undefined,
  amountMin: undefined,
  amountMax: undefined,
});

<InvoiceFilters
  clients={clients}
  onFiltersChange={setFilters}
  initialFilters={filters}
  showStatusTabs={true}
/>;
```

### PaymentPanel

```tsx
import { PaymentPanel } from '@/components/commercial';

<PaymentPanel
  balanceDue={invoice.balance_due}
  payments={invoice.invoice_payments}
  onRecordPayment={async (payment) => {
    await recordPayment(invoice.id, payment);
  }}
  isRecording={isSaving}
/>;
```

### LineItemsTable + LineItemsTotals

```tsx
import { LineItemsTable, LineItemsTotals } from '@/components/commercial';

<LineItemsTable
  items={lineItems.map(item => ({
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: item.line_total,
    tier: item.tier,
  }))}
  showCode={true}
  showTier={true}
/>

<LineItemsTotals
  subtotal={invoice.subtotal}
  taxAmount={invoice.tax_amount}
  taxRate={invoice.tax_rate}
  discountAmount={invoice.discount_amount}
  total={invoice.total}
/>
```

### MoneySummaryCards

```tsx
import { MoneySummaryCards, InvoiceSummaryCards } from '@/components/commercial';

<MoneySummaryCards
  cards={[
    { title: 'Revenue', value: 15000, variant: 'success' },
    { title: 'Outstanding', value: 5000, variant: 'warning' },
  ]}
  columns={2}
/>

<InvoiceSummaryCards
  stats={{
    total_invoices: 30,
    paid_invoices: 20,
    total_revenue: 25000,
    outstanding_balance: 5000,
    overdue_count: 3,
  }}
  className="mt-6"
/>
```

---

**Ready for review and PR creation.**
