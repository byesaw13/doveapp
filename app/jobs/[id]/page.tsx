import { redirect, notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { getServerSessionOrNull } from '@/lib/auth/session';
import { canAccessTech } from '@/lib/auth-guards';

type TimelineItem = {
  type: 'job_created' | 'note' | 'time_entry' | 'cost_entry';
  created_at: string;
  summary: string;
};

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString();
}

export const dynamic = 'force-dynamic';

export default async function JobTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: jobId } = await params;
  const session = await getServerSessionOrNull();

  if (!session) {
    redirect('/auth/login');
  }

  if (!canAccessTech(session.role)) {
    redirect('/auth/login?error=forbidden');
  }

  const supabase = await createServerClient();

  const { data: job } = await supabase
    .from('jobs')
    .select('id, job_number, title, status, created_at, account_id')
    .eq('id', jobId)
    .eq('account_id', session.accountId)
    .single();

  if (!job) {
    notFound();
  }

  const [{ data: notes }, { data: timeEntries }, { data: lineItems }] =
    await Promise.all([
      supabase
        .from('job_notes')
        .select('created_at, note')
        .eq('job_id', jobId)
        .eq('account_id', session.accountId)
        .order('created_at', { ascending: true }),
      supabase
        .from('time_entries')
        .select('created_at, start_time, end_time, total_hours')
        .eq('job_id', jobId)
        .eq('account_id', session.accountId)
        .order('created_at', { ascending: true }),
      supabase
        .from('job_line_items')
        .select(
          'created_at, description, quantity, unit_price, total, item_type'
        )
        .eq('job_id', jobId)
        .eq('account_id', session.accountId)
        .order('created_at', { ascending: true }),
    ]);

  const timelineItems: TimelineItem[] = [
    {
      type: 'job_created',
      created_at: job.created_at,
      summary: `Job created (${job.title || job.job_number})`,
    },
  ];

  (notes || []).forEach((note) => {
    timelineItems.push({
      type: 'note',
      created_at: note.created_at,
      summary: note.note,
    });
  });

  (timeEntries || []).forEach((entry) => {
    const hours =
      entry.total_hours !== null && entry.total_hours !== undefined
        ? `${entry.total_hours} hrs`
        : entry.end_time
          ? '0 hrs'
          : 'In progress';
    timelineItems.push({
      type: 'time_entry',
      created_at: entry.created_at,
      summary: `Time entry (${hours})`,
    });
  });

  (lineItems || []).forEach((item) => {
    const total =
      item.total !== null && item.total !== undefined
        ? item.total
        : item.quantity * item.unit_price;
    timelineItems.push({
      type: 'cost_entry',
      created_at: item.created_at,
      summary: `Cost (${item.item_type}): ${item.description} - $${total.toFixed(2)}`,
    });
  });

  timelineItems.sort((a, b) => {
    const timeDiff =
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.type.localeCompare(b.type);
  });

  const totalHours = (timeEntries || []).reduce(
    (sum, entry) => sum + (entry.total_hours || 0),
    0
  );
  const totalCosts = (lineItems || []).reduce((sum, item) => {
    const total =
      item.total !== null && item.total !== undefined
        ? item.total
        : item.quantity * item.unit_price;
    return sum + total;
  }, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="text-sm text-gray-500">{job.job_number}</p>
        <h1 className="text-2xl font-semibold">{job.title || 'Job'}</h1>
        <p className="text-sm text-gray-500">Status: {job.status}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-gray-500">Total Hours</p>
          <p className="text-xl font-semibold">{totalHours.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-gray-500">Total Costs</p>
          <p className="text-xl font-semibold">${totalCosts.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-gray-500">Timeline Entries</p>
          <p className="text-xl font-semibold">{timelineItems.length}</p>
        </div>
      </div>

      <div className="space-y-3">
        {timelineItems.map((item, index) => (
          <div
            key={`${item.created_at}-${index}`}
            className="rounded-lg border p-4"
          >
            <div className="text-xs uppercase text-gray-500">{item.type}</div>
            <div className="text-sm text-gray-600">
              {formatTimestamp(item.created_at)}
            </div>
            <div className="mt-1 text-sm">{item.summary}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
