import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { PerformanceLogger } from '@/lib/api/performance';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

// GET /api/admin/invoice-reminders - Get all invoice reminders with filtering
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'GET');

  try {
    const context = await requireAccountContext(request);
    const supabase = await createRouteHandlerClient();

    const searchParams = url.searchParams;
    const status = searchParams.get('status');
    const reminderType = searchParams.get('type');
    const invoiceId = searchParams.get('invoice_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    perfLogger.incrementQueryCount();
    let query = supabase
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
            email
          )
        )
      `
      )
      .order('scheduled_for', { ascending: true })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    if (reminderType) {
      query = query.eq('reminder_type', reminderType);
    }

    if (invoiceId) {
      query = query.eq('invoice_id', invoiceId);
    }

    const { data: reminders, error } = await query;

    if (error) {
      console.error('Error fetching invoice reminders:', error);
      perfLogger.complete(500);
      return NextResponse.json(
        { error: 'Failed to fetch invoice reminders' },
        { status: 500 }
      );
    }

    const metrics = perfLogger.complete(200);
    return NextResponse.json(
      { reminders: reminders || [] },
      {
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in invoice reminders GET:', error);
    perfLogger.complete(401);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// POST /api/admin/invoice-reminders - Create a manual reminder
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'POST');

  try {
    const context = await requireAccountContext(request);
    const supabase = await createRouteHandlerClient();

    const body = await request.json();
    const {
      invoice_id,
      reminder_type,
      scheduled_for,
      subject,
      message,
      recipient_email,
    } = body;

    if (!invoice_id || !reminder_type || !scheduled_for) {
      perfLogger.complete(400);
      return NextResponse.json(
        { error: 'invoice_id, reminder_type, and scheduled_for are required' },
        { status: 400 }
      );
    }

    perfLogger.incrementQueryCount();
    const { data: reminder, error } = await supabase
      .from('invoice_reminders')
      .insert({
        invoice_id,
        reminder_type,
        scheduled_for,
        subject,
        message,
        recipient_email,
        created_by: context.userId,
      })
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
      console.error('Error creating invoice reminder:', error);
      perfLogger.complete(500);
      return NextResponse.json(
        { error: 'Failed to create invoice reminder' },
        { status: 500 }
      );
    }

    const metrics = perfLogger.complete(201);
    return NextResponse.json(
      { reminder },
      {
        status: 201,
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in invoice reminders POST:', error);
    perfLogger.complete(500);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
