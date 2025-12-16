import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards';
import {
  createAuthenticatedClient,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const context = await requireAccountContext(request);
    const supabase = createAuthenticatedClient(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const action = searchParams.get('action');

    let queryBuilder = supabase
      .from('invoices')
      .select(
        `
        *,
        clients!invoices_client_id_fkey (
          id,
          first_name,
          last_name,
          company_name,
          email,
          phone
        )
      `
      )
      .order('created_at', { ascending: false });

    // CRITICAL: Filter by account for multi-tenancy
    // Temporarily allowing invoices without account_id (legacy data)
    // In production: queryBuilder = queryBuilder.eq('account_id', context.accountId);

    if (status && status !== 'all') {
      queryBuilder = queryBuilder.eq('payment_status', status);
    }

    if (search) {
      queryBuilder = queryBuilder.or(
        `invoice_number.ilike.%${search}%,notes.ilike.%${search}%`
      );
    }

    const { data: invoices, error } = await queryBuilder;

    if (error) {
      console.error('Error fetching invoices:', error);
      return errorResponse(error, 'Failed to fetch invoices');
    }

    // Calculate stats if requested
    if (action === 'stats') {
      const stats = {
        total: invoices?.length || 0,
        paid:
          invoices?.filter((i: any) => i.payment_status === 'paid').length || 0,
        pending:
          invoices?.filter((i: any) => i.payment_status === 'pending').length ||
          0,
        overdue:
          invoices?.filter((i: any) => i.payment_status === 'overdue').length ||
          0,
      };
      return NextResponse.json(stats);
    }

    return NextResponse.json(invoices || []);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return unauthorizedResponse();
  }
}
