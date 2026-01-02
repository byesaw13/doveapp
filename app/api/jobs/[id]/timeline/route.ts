import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

interface TimelineItem {
  type: 'job_created' | 'note' | 'visit' | 'time_entry' | 'cost_entry';
  created_at: string;
  actor_id?: string;
  summary: string;
  payload: any;
}

interface JobTimelineResponse {
  job_id: string;
  account_id: string;
  items: TimelineItem[];
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateJobId(id: string): boolean {
  return UUID_REGEX.test(id);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    if (!jobId || !validateJobId(jobId)) {
      return NextResponse.json(
        { error: 'Valid job ID (UUID) is required' },
        { status: 400 }
      );
    }

    const context = await requireAccountContext(request);
    const supabase = await createRouteHandlerClient();
    const items: TimelineItem[] = [];

    // Job creation
    const { data: job } = await supabase
      .from('jobs')
      .select('id, created_at, job_number, title')
      .eq('id', jobId)
      .eq('account_id', context.accountId)
      .single();

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    items.push({
      type: 'job_created',
      created_at: job.created_at,
      summary: `Job created (${job.title || job.job_number})`,
      payload: job,
    });

    // Query job_notes
    try {
      const { data: notes } = await supabase
        .from('job_notes')
        .select('created_at, technician_id, note')
        .eq('job_id', jobId)
        .eq('account_id', context.accountId)
        .order('created_at', { ascending: true });

      if (notes) {
        notes.forEach((note) => {
          items.push({
            type: 'note',
            created_at: note.created_at,
            actor_id: note.technician_id,
            summary:
              note.note.length > 100
                ? note.note.substring(0, 100) + '...'
                : note.note,
            payload: note,
          });
        });
      }
    } catch (error) {
      // Skip if table doesn't exist or error
    }

    // Query visits
    try {
      const { data: visits } = await supabase
        .from('visits')
        .select('created_at, technician_id, status, start_at, end_at, notes')
        .eq('job_id', jobId)
        .eq('account_id', context.accountId)
        .order('created_at', { ascending: true });

      if (visits) {
        visits.forEach((visit) => {
          const summary = `Visit ${visit.status}${visit.start_at ? ` from ${new Date(visit.start_at).toLocaleString()}` : ''}`;
          items.push({
            type: 'visit',
            created_at: visit.created_at,
            actor_id: visit.technician_id,
            summary,
            payload: visit,
          });
        });
      }
    } catch (error) {
      // Skip if table doesn't exist
    }

    // Query time_entries
    try {
      const { data: entries } = await supabase
        .from('time_entries')
        .select(
          'created_at, technician_id, start_time, end_time, total_hours, billable_hours, notes'
        )
        .eq('job_id', jobId)
        .eq('account_id', context.accountId)
        .order('created_at', { ascending: true });

      if (entries) {
        entries.forEach((entry) => {
          const summary = `Time tracked: ${entry.total_hours || 0} hours${entry.billable_hours ? ` (${entry.billable_hours} billable)` : ''}`;
          items.push({
            type: 'time_entry',
            created_at: entry.created_at,
            actor_id: entry.technician_id,
            summary,
            payload: entry,
          });
        });
      }
    } catch (error) {
      // Skip if table doesn't exist
    }

    // Query job_line_items as cost entries
    try {
      const { data: costs } = await supabase
        .from('job_line_items')
        .select(
          'created_at, description, quantity, unit_price, total, item_type'
        )
        .eq('job_id', jobId)
        .eq('account_id', context.accountId)
        .order('created_at', { ascending: true });

      if (costs) {
        costs.forEach((cost) => {
          const total = cost.total ?? cost.quantity * cost.unit_price;
          const summary = `Cost (${cost.item_type}): ${cost.description} - $${total.toFixed(2)}`;
          items.push({
            type: 'cost_entry',
            created_at: cost.created_at,
            summary,
            payload: cost,
          });
        });
      }
    } catch (error) {
      // Skip if table doesn't exist
    }

    // Sort items by created_at ascending, then by type for stability
    items.sort((a, b) => {
      const timeDiff =
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.type.localeCompare(b.type);
    });

    const response: JobTimelineResponse = {
      job_id: jobId,
      account_id: context.accountId,
      items,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching job timeline:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch job timeline';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
