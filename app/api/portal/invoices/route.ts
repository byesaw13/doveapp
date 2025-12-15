import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerContext } from '@/lib/auth-guards';
import { createAuthenticatedClient } from '@/lib/api-helpers';
import { listInvoices, type InvoiceFilters } from '@/lib/api/invoices';

/**
 * GET /api/portal/invoices - List invoices for customer (read-only)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const context = await requireCustomerContext(request);
    const supabase = createAuthenticatedClient(request);
    const { searchParams } = new URL(request.url);

    const filters: InvoiceFilters = {
      customerId: context.userId, // Always filter by customer
    };

    const { data, error } = await listInvoices(
      {
        accountId: context.accountId,
        userId: context.userId,
        role: 'CUSTOMER',
        supabase,
      },
      filters
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Redact sensitive information for customer view
    const customerData = (data || []).map((invoice: any) => ({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      status: invoice.status,
      total: invoice.total,
      due_date: invoice.due_date,
      created_at: invoice.created_at,
      job: invoice.job
        ? {
            id: invoice.job.id,
            title: invoice.job.title,
            job_number: invoice.job.job_number,
          }
        : null,
      // Remove internal notes, cost breakdowns, etc.
    }));

    return NextResponse.json(customerData);
  } catch (error: any) {
    console.error('Error in GET /api/portal/invoices:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication required' },
      { status: error.message?.includes('required') ? 401 : 500 }
    );
  }
}
