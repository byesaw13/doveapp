import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { canAccessTech } from '@/lib/auth-guards';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type StartTimeEntryBody = {
  job_id?: string;
  notes?: string | null;
  hourly_rate?: number | null;
};

type CompleteTimeEntryBody = {
  time_entry_id?: string;
  notes?: string | null;
};

function validateUuid(id: string | undefined): id is string {
  return !!id && UUID_REGEX.test(id);
}

export async function GET(request: NextRequest) {
  try {
    const context = await requireAccountContext(request);
    if (!canAccessTech(context.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('job_id') || undefined;
    if (jobId && !validateUuid(jobId)) {
      return NextResponse.json(
        { error: 'Valid job_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createRouteHandlerClient();
    let query = supabase
      .from('time_entries')
      .select(
        'id, job_id, technician_id, technician_name, start_time, end_time, total_hours, billable_hours, status, notes, created_at'
      )
      .eq('account_id', context.accountId)
      .order('created_at', { ascending: false });

    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    const { data: entries, error } = await query;
    if (error) {
      console.error('Error fetching time entries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch time entries' },
        { status: 500 }
      );
    }

    const totalHours = (entries || []).reduce(
      (sum, entry) => sum + (entry.total_hours || 0),
      0
    );

    return NextResponse.json({
      time_entries: entries || [],
      total_hours: totalHours,
    });
  } catch (error) {
    console.error('Error fetching time entries:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireAccountContext(request);
    if (!canAccessTech(context.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as StartTimeEntryBody;
    const jobId = body?.job_id;
    if (!validateUuid(jobId)) {
      return NextResponse.json(
        { error: 'Valid job_id is required' },
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

    const technicianName =
      context.user.full_name || context.user.email || 'Technician';

    const { data: entry, error: entryError } = await supabase
      .from('time_entries')
      .insert({
        account_id: context.accountId,
        job_id: jobId,
        technician_id: context.userId,
        technician_name: technicianName,
        start_time: new Date().toISOString(),
        status: 'active',
        notes: body?.notes || null,
        hourly_rate: body?.hourly_rate || null,
      })
      .select()
      .single();

    if (entryError) {
      console.error('Error creating time entry:', entryError);
      return NextResponse.json(
        { error: 'Failed to start time entry' },
        { status: 500 }
      );
    }

    const { error: noteError } = await supabase.from('job_notes').insert({
      job_id: jobId,
      technician_id: context.userId,
      note: `Time entry started (${entry.id})`,
      account_id: context.accountId,
    });

    if (noteError) {
      console.warn('Failed to log time entry start:', noteError);
    }

    return NextResponse.json({ time_entry: entry }, { status: 201 });
  } catch (error) {
    console.error('Error starting time entry:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const context = await requireAccountContext(request);
    if (!canAccessTech(context.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await request.json()) as CompleteTimeEntryBody;
    const timeEntryId = body?.time_entry_id;
    if (!validateUuid(timeEntryId)) {
      return NextResponse.json(
        { error: 'Valid time_entry_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createRouteHandlerClient();

    const { data: entry, error: entryError } = await supabase
      .from('time_entries')
      .select('id, job_id, technician_id')
      .eq('id', timeEntryId)
      .eq('account_id', context.accountId)
      .single();

    if (entryError || !entry) {
      return NextResponse.json(
        { error: 'Time entry not found' },
        { status: 404 }
      );
    }

    if (context.role === 'TECH' && entry.technician_id !== context.userId) {
      return NextResponse.json(
        { error: 'Time entry not owned by this technician' },
        { status: 403 }
      );
    }

    const { data: updatedEntry, error: updateError } = await supabase
      .from('time_entries')
      .update({
        end_time: new Date().toISOString(),
        status: 'completed',
        notes: body?.notes || null,
      })
      .eq('id', timeEntryId)
      .select()
      .single();

    if (updateError) {
      console.error('Error completing time entry:', updateError);
      return NextResponse.json(
        { error: 'Failed to stop time entry' },
        { status: 500 }
      );
    }

    const { error: noteError } = await supabase.from('job_notes').insert({
      job_id: entry.job_id,
      technician_id: context.userId,
      note: `Time entry completed (${entry.id})`,
      account_id: context.accountId,
    });

    if (noteError) {
      console.warn('Failed to log time entry completion:', noteError);
    }

    return NextResponse.json({ time_entry: updatedEntry });
  } catch (error) {
    console.error('Error completing time entry:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
