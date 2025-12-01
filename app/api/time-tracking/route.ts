import { NextRequest, NextResponse } from 'next/server';
import {
  clockIn,
  clockOut,
  getActiveTimeEntry,
  getTimeEntries,
  startBreak,
  endBreak,
  getActiveBreak,
  submitTimeApproval,
  getPendingApprovals,
  setTechnicianRate,
  recordTechnicianLocation,
  getTimeTrackingSummary,
  getTimeTrackingAnalytics,
} from '@/lib/db/time-tracking';
import {
  clockInSchema,
  clockOutSchema,
  breakSchema,
  endBreakSchema,
  timeApprovalSchema,
  technicianRateSchema,
  technicianLocationSchema,
} from '@/lib/validations/time-tracking';

// GET /api/time-tracking - Get time tracking data
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const technicianName = searchParams.get('technician_name');

  try {
    switch (action) {
      case 'active_entry':
        if (!technicianName) {
          return NextResponse.json(
            { error: 'technician_name is required' },
            { status: 400 }
          );
        }
        const activeEntry = await getActiveTimeEntry(technicianName);
        return NextResponse.json({ active_entry: activeEntry });

      case 'active_break':
        const timeEntryId = searchParams.get('time_entry_id');
        if (!timeEntryId) {
          return NextResponse.json(
            { error: 'time_entry_id is required' },
            { status: 400 }
          );
        }
        const activeBreak = await getActiveBreak(timeEntryId);
        return NextResponse.json({ active_break: activeBreak });

      case 'pending_approvals':
        const pendingApprovals = await getPendingApprovals();
        return NextResponse.json({ approvals: pendingApprovals });

      case 'summary':
        const queryParams = {
          technician_name: searchParams.get('technician_name') || undefined,
          job_id: searchParams.get('job_id') || undefined,
          status:
            (searchParams.get('status') as
              | 'active'
              | 'completed'
              | 'approved'
              | 'rejected'
              | 'paid') || undefined,
          approval_status:
            (searchParams.get('approval_status') as
              | 'pending'
              | 'approved'
              | 'rejected'
              | 'needs_revision') || undefined,
          start_date: searchParams.get('start_date') || undefined,
          end_date: searchParams.get('end_date') || undefined,
          page: searchParams.get('page')
            ? parseInt(searchParams.get('page')!)
            : 1,
          limit: searchParams.get('limit')
            ? parseInt(searchParams.get('limit')!)
            : 20,
          sort_by:
            (searchParams.get('sort_by') as
              | 'start_time'
              | 'end_time'
              | 'total_hours'
              | 'total_amount'
              | 'technician_name') || 'start_time',
          sort_order:
            (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
        };
        const summary = await getTimeTrackingSummary(queryParams);
        return NextResponse.json(summary);

      case 'analytics':
        const analyticsParams = {
          technician_name: searchParams.get('technician_name') || undefined,
          date_range:
            (searchParams.get('date_range') as
              | 'today'
              | 'week'
              | 'month'
              | 'quarter'
              | 'year') || 'month',
          include_location_data:
            searchParams.get('include_location_data') === 'true',
        };
        const analytics = await getTimeTrackingAnalytics(analyticsParams);
        return NextResponse.json({ analytics });

      default:
        // Get time entries with filters
        const entriesParams = {
          technician_name: searchParams.get('technician_name') || undefined,
          job_id: searchParams.get('job_id') || undefined,
          status:
            (searchParams.get('status') as
              | 'active'
              | 'completed'
              | 'approved'
              | 'rejected'
              | 'paid') || undefined,
          approval_status:
            (searchParams.get('approval_status') as
              | 'pending'
              | 'approved'
              | 'rejected'
              | 'needs_revision') || undefined,
          start_date: searchParams.get('start_date') || undefined,
          end_date: searchParams.get('end_date') || undefined,
          page: searchParams.get('page')
            ? parseInt(searchParams.get('page')!)
            : 1,
          limit: searchParams.get('limit')
            ? parseInt(searchParams.get('limit')!)
            : 20,
          sort_by:
            (searchParams.get('sort_by') as
              | 'start_time'
              | 'end_time'
              | 'total_hours'
              | 'total_amount'
              | 'technician_name') || 'start_time',
          sort_order:
            (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
        };
        const entries = await getTimeEntries(entriesParams);
        return NextResponse.json(entries);
    }
  } catch (error) {
    console.error('Error in time tracking GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time tracking data' },
      { status: 500 }
    );
  }
}

// POST /api/time-tracking - Time tracking operations
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    const body = await request.json();

    switch (action) {
      case 'clock_in':
        const clockInData = clockInSchema.parse(body);
        const clockInResult = await clockIn(clockInData);
        return NextResponse.json(clockInResult, { status: 201 });

      case 'clock_out':
        const clockOutData = clockOutSchema.parse(body);
        const clockOutResult = await clockOut(clockOutData);
        return NextResponse.json(clockOutResult);

      case 'start_break':
        const breakData = breakSchema.parse(body);
        const breakResult = await startBreak(breakData);
        return NextResponse.json(breakResult, { status: 201 });

      case 'end_break':
        const endBreakData = endBreakSchema.parse(body);
        const endBreakResult = await endBreak(endBreakData);
        return NextResponse.json(endBreakResult);

      case 'approve_time':
        const approvalData = timeApprovalSchema.parse(body);
        const approvalResult = await submitTimeApproval(approvalData);
        return NextResponse.json(approvalResult);

      case 'set_rate':
        const rateData = technicianRateSchema.parse(body);
        const rateResult = await setTechnicianRate(rateData);
        return NextResponse.json(rateResult, { status: 201 });

      case 'record_location':
        const locationData = technicianLocationSchema.parse(body);
        const locationResult = await recordTechnicianLocation(locationData);
        return NextResponse.json(locationResult, { status: 201 });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in time tracking POST:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: (error as any).errors },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to process time tracking request';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
