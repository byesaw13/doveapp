import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { canAccessTech } from '@/lib/auth-guards';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    if (!jobId || !validateUuid(jobId)) {
      return NextResponse.json(
        { error: 'Valid job ID (UUID) is required' },
        { status: 400 }
      );
    }

    const context = await requireAccountContext(request);
    if (!canAccessTech(context.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const itemType = body?.item_type;
    const description = body?.description?.trim();
    const quantity = Number(body?.quantity);
    const unitPrice = Number(body?.unit_price);

    if (!['labor', 'material'].includes(itemType)) {
      return NextResponse.json(
        { error: 'item_type must be labor or material' },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { error: 'description is required' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: 'quantity must be greater than 0' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return NextResponse.json(
        { error: 'unit_price must be 0 or greater' },
        { status: 400 }
      );
    }

    const supabase = await createRouteHandlerClient();

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, assigned_tech_id')
      .eq('id', jobId)
      .eq('account_id', context.accountId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (context.role === 'TECH' && job.assigned_tech_id !== context.userId) {
      return NextResponse.json(
        { error: 'Job not assigned to this technician' },
        { status: 403 }
      );
    }

    const total = quantity * unitPrice;
    const { data: lineItem, error: lineItemError } = await supabase
      .from('job_line_items')
      .insert({
        job_id: jobId,
        account_id: context.accountId,
        item_type: itemType,
        description,
        quantity,
        unit_price: unitPrice,
        total,
        line_total: total,
        service_id: body?.service_id || null,
        tier: body?.tier || null,
      })
      .select()
      .single();

    if (lineItemError) {
      console.error('Error adding job line item:', lineItemError);
      return NextResponse.json(
        { error: 'Failed to add line item' },
        { status: 500 }
      );
    }

    const { error: noteError } = await supabase.from('job_notes').insert({
      job_id: jobId,
      technician_id: context.userId,
      note: `Cost added (${itemType}): ${description} - $${total.toFixed(2)}`,
      account_id: context.accountId,
    });

    if (noteError) {
      console.warn('Failed to log cost note:', noteError);
    }

    return NextResponse.json({ line_item: lineItem }, { status: 201 });
  } catch (error) {
    console.error('Error adding job line item:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
