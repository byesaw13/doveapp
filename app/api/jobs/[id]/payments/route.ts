import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { errorResponse, unauthorizedResponse } from '@/lib/api-helpers';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

// GET /api/jobs/[id]/payments - Get all payments for a job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const context = await requireAccountContext(request);
    const supabase = await createRouteHandlerClient();

    // Fetch payments for this job
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('job_id', jobId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      return errorResponse(error, 'Failed to fetch payments');
    }

    // Calculate payment summary
    const total = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

    // Get job total
    const { data: job } = await supabase
      .from('jobs')
      .select('total')
      .eq('id', jobId)
      .eq('account_id', context.accountId)
      .single();

    const jobTotal = job?.total || 0;
    const remaining = jobTotal - total;
    const status = remaining <= 0 ? 'paid' : total > 0 ? 'partial' : 'unpaid';

    return NextResponse.json({
      payments: payments || [],
      summary: {
        total: jobTotal,
        paid: total,
        remaining,
        status,
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return unauthorizedResponse();
  }
}

// POST /api/jobs/[id]/payments - Create a payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const context = await requireAccountContext(request);
    const supabase = await createRouteHandlerClient();
    const body = await request.json();

    // Verify job exists and belongs to account
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .eq('account_id', context.accountId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Create payment
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        job_id: jobId,
        amount: body.amount,
        payment_method: body.payment_method || null,
        payment_date: body.payment_date || new Date().toISOString(),
        notes: body.notes || null,
        square_payment_id: body.square_payment_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      return errorResponse(error, 'Failed to create payment');
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return unauthorizedResponse();
  }
}
