import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards';
import { createAuthenticatedClient } from '@/lib/api-helpers';
import { PerformanceLogger } from '@/lib/api/performance';

// GET /api/admin/invoice-reminders/[id] - Get a specific reminder
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'GET');

  try {
    const context = await requireAccountContext(request);
    const supabase = createAuthenticatedClient(request);
    const { id } = await params;

    perfLogger.incrementQueryCount();
    const { data: reminder, error } = await supabase
      .from('invoice_reminders')
      .select(
        `
        *,
        invoices (
          invoice_number,
          total,
          due_date,
          status,
          clients (
            first_name,
            last_name,
            email,
            phone
          )
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching invoice reminder:', error);
      perfLogger.complete(404);
      return NextResponse.json(
        { error: 'Invoice reminder not found' },
        { status: 404 }
      );
    }

    const metrics = perfLogger.complete(200);
    return NextResponse.json(
      { reminder },
      {
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in invoice reminder GET:', error);
    perfLogger.complete(401);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// PUT /api/admin/invoice-reminders/[id] - Update a reminder
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'PUT');

  try {
    const context = await requireAccountContext(request);
    const supabase = createAuthenticatedClient(request);
    const { id } = await params;

    const body = await request.json();
    const { status, scheduled_for, subject, message } = body;

    perfLogger.incrementQueryCount();
    const { data: reminder, error } = await supabase
      .from('invoice_reminders')
      .update({
        status,
        scheduled_for,
        subject,
        message,
      })
      .eq('id', id)
      .select(
        `
        *,
        invoices (
          invoice_number,
          clients (
            first_name,
            last_name,
            email
          )
        )
      `
      )
      .single();

    if (error) {
      console.error('Error updating invoice reminder:', error);
      perfLogger.complete(500);
      return NextResponse.json(
        { error: 'Failed to update invoice reminder' },
        { status: 500 }
      );
    }

    const metrics = perfLogger.complete(200);
    return NextResponse.json(
      { reminder },
      {
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in invoice reminder PUT:', error);
    perfLogger.complete(500);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/invoice-reminders/[id] - Delete a reminder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'DELETE');

  try {
    const context = await requireAccountContext(request);
    const supabase = createAuthenticatedClient(request);
    const { id } = await params;

    perfLogger.incrementQueryCount();
    const { error } = await supabase
      .from('invoice_reminders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting invoice reminder:', error);
      perfLogger.complete(500);
      return NextResponse.json(
        { error: 'Failed to delete invoice reminder' },
        { status: 500 }
      );
    }

    const metrics = perfLogger.complete(200);
    return NextResponse.json(
      { message: 'Invoice reminder deleted successfully' },
      {
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in invoice reminder DELETE:', error);
    perfLogger.complete(500);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
