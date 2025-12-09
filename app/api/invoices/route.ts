import { NextRequest, NextResponse } from 'next/server';
import { listInvoicesWithFilters, getInvoiceStats } from '@/lib/db/invoices';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const action = searchParams.get('action');

    // Get invoice statistics
    if (action === 'stats') {
      const stats = await getInvoiceStats();
      return NextResponse.json(stats);
    }

    // Get filtered invoices
    const filters = {
      status: status && status !== 'all' ? (status as any) : undefined,
      search: search || undefined,
    };

    const invoices = await listInvoicesWithFilters(filters);
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
