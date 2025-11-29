import { supabase } from '@/lib/supabase';
import type {
  TimeEntry,
  TimeBreak,
  TimeApproval,
  TechnicianLocation,
  TechnicianRate,
  TimeTrackingSummary,
  TechnicianProductivity,
  JobTimeSummary,
  TimeTrackingAnalytics,
  ClockInData,
  ClockOutData,
  BreakData,
  EndBreakData,
  TimeApprovalData,
  TechnicianRateData,
  TimeEntryUpdateData,
  TimeTrackingQueryParams,
  TechnicianLocationData,
  TimeAnalyticsQueryParams,
} from '@/types/time-tracking';

// Time Entry Operations
export async function clockIn(data: ClockInData): Promise<TimeEntry> {
  // Get current technician rate
  const hourlyRate = await getCurrentTechnicianRate(data.technician_name);

  const { data: timeEntry, error } = await supabase
    .from('time_entries')
    .insert([
      {
        technician_name: data.technician_name,
        job_id: data.job_id,
        start_time: new Date().toISOString(),
        hourly_rate: hourlyRate,
        notes: data.notes,
        location_start: data.location,
        device_info: getDeviceInfo(),
        ip_address: getClientIP(),
      },
    ])
    .select(
      `
      *,
      breaks:time_breaks(*),
      approvals:time_approvals(*)
    `
    )
    .single();

  if (error) {
    throw new Error(`Failed to clock in: ${error.message}`);
  }

  // Record location if provided
  if (data.location) {
    await recordTechnicianLocation({
      technician_name: data.technician_name,
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      accuracy: data.location.accuracy,
      activity_type: 'clock_in',
      job_id: data.job_id,
    });
  }

  return timeEntry;
}

export async function clockOut(data: ClockOutData): Promise<TimeEntry> {
  const { data: timeEntry, error } = await supabase
    .from('time_entries')
    .update({
      end_time: new Date().toISOString(),
      status: 'completed',
      notes: data.notes,
      location_end: data.location,
    })
    .eq('id', data.time_entry_id)
    .select(
      `
      *,
      breaks:time_breaks(*),
      approvals:time_approvals(*)
    `
    )
    .single();

  if (error) {
    throw new Error(`Failed to clock out: ${error.message}`);
  }

  // Record location if provided
  if (data.location) {
    await recordTechnicianLocation({
      technician_name: timeEntry.technician_name,
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      accuracy: data.location.accuracy,
      activity_type: 'clock_out',
      job_id: timeEntry.job_id,
    });
  }

  return timeEntry;
}

export async function getActiveTimeEntry(
  technicianName: string
): Promise<TimeEntry | null> {
  const { data, error } = await supabase
    .from('time_entries')
    .select(
      `
      *,
      breaks:time_breaks(*),
      approvals:time_approvals(*)
    `
    )
    .eq('technician_name', technicianName)
    .eq('status', 'active')
    .order('start_time', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No active entry
    throw new Error(`Failed to get active time entry: ${error.message}`);
  }

  return data;
}

export async function getTimeEntries(
  params?: TimeTrackingQueryParams
): Promise<{ entries: TimeEntry[]; total: number }> {
  let query = supabase.from('time_entries').select(
    `
      *,
      breaks:time_breaks(*),
      approvals:time_approvals(*)
    `,
    { count: 'exact' }
  );

  // Apply filters
  if (params?.technician_name) {
    query = query.eq('technician_name', params.technician_name);
  }

  if (params?.job_id) {
    query = query.eq('job_id', params.job_id);
  }

  if (params?.status) {
    query = query.eq('status', params.status);
  }

  if (params?.start_date) {
    query = query.gte('start_time', params.start_date);
  }

  if (params?.end_date) {
    query = query.lte('start_time', params.end_date);
  }

  // Apply sorting
  const sortBy = params?.sort_by || 'start_time';
  const sortOrder = params?.sort_order || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch time entries: ${error.message}`);
  }

  return {
    entries: data || [],
    total: count || 0,
  };
}

export async function updateTimeEntry(
  id: string,
  updates: TimeEntryUpdateData
): Promise<TimeEntry> {
  const { data, error } = await supabase
    .from('time_entries')
    .update(updates)
    .eq('id', id)
    .select(
      `
      *,
      breaks:time_breaks(*),
      approvals:time_approvals(*)
    `
    )
    .single();

  if (error) {
    throw new Error(`Failed to update time entry: ${error.message}`);
  }

  return data;
}

// Break Operations
export async function startBreak(data: BreakData): Promise<TimeBreak> {
  const { data: breakEntry, error } = await supabase
    .from('time_breaks')
    .insert([
      {
        time_entry_id: data.time_entry_id,
        break_type: data.break_type,
        start_time: new Date().toISOString(),
        notes: data.notes,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to start break: ${error.message}`);
  }

  return breakEntry;
}

export async function endBreak(data: EndBreakData): Promise<TimeBreak> {
  const { data: breakEntry, error } = await supabase
    .from('time_breaks')
    .update({
      end_time: new Date().toISOString(),
    })
    .eq('id', data.break_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to end break: ${error.message}`);
  }

  return breakEntry;
}

export async function getActiveBreak(
  timeEntryId: string
): Promise<TimeBreak | null> {
  const { data, error } = await supabase
    .from('time_breaks')
    .select('*')
    .eq('time_entry_id', timeEntryId)
    .is('end_time', null)
    .order('start_time', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get active break: ${error.message}`);
  }

  return data;
}

// Approval Operations
export async function submitTimeApproval(
  data: TimeApprovalData
): Promise<TimeApproval> {
  const { data: approval, error } = await supabase
    .from('time_approvals')
    .insert([
      {
        time_entry_id: data.time_entry_id,
        approver_name: data.approver_name,
        status: data.status,
        approved_hours: data.approved_hours,
        approval_notes: data.approval_notes,
        rejection_reason: data.rejection_reason,
        approved_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to submit time approval: ${error.message}`);
  }

  // Update time entry status based on approval
  const newStatus =
    data.status === 'approved'
      ? 'approved'
      : data.status === 'rejected'
        ? 'rejected'
        : 'completed';

  await supabase
    .from('time_entries')
    .update({ status: newStatus })
    .eq('id', data.time_entry_id);

  return approval;
}

export async function getPendingApprovals(): Promise<TimeApproval[]> {
  const { data, error } = await supabase
    .from('time_approvals')
    .select(
      `
      *,
      time_entry:time_entries(*)
    `
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch pending approvals: ${error.message}`);
  }

  return data || [];
}

// Technician Rate Operations
export async function setTechnicianRate(
  data: TechnicianRateData
): Promise<TechnicianRate> {
  const { data: rate, error } = await supabase
    .from('technician_rates')
    .insert([data])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to set technician rate: ${error.message}`);
  }

  return rate;
}

export async function getCurrentTechnicianRate(
  technicianName: string,
  checkDate?: Date
): Promise<number> {
  const date = checkDate || new Date();

  const { data, error } = await supabase.rpc('get_current_technician_rate', {
    tech_name: technicianName,
    check_date: date.toISOString().split('T')[0],
  });

  if (error) {
    console.warn('RPC function not available, returning default rate');
    return 0; // Default rate
  }

  return data || 0;
}

// Location Tracking
export async function recordTechnicianLocation(
  data: TechnicianLocationData
): Promise<TechnicianLocation> {
  const { data: location, error } = await supabase
    .from('technician_locations')
    .insert([
      {
        technician_name: data.technician_name,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        activity_type: data.activity_type,
        job_id: data.job_id,
        notes: data.notes,
        timestamp: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to record location: ${error.message}`);
  }

  return location;
}

export async function getTechnicianLocations(
  technicianName: string,
  hours = 24
): Promise<TechnicianLocation[]> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('technician_locations')
    .select('*')
    .eq('technician_name', technicianName)
    .gte('timestamp', since)
    .order('timestamp', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch technician locations: ${error.message}`);
  }

  return data || [];
}

// Analytics and Reporting
export async function getTimeTrackingSummary(
  params?: TimeTrackingQueryParams
): Promise<{ summary: TimeTrackingSummary[]; total: number }> {
  let query = supabase
    .from('time_tracking_summary')
    .select('*', { count: 'exact' });

  // Apply filters
  if (params?.technician_name) {
    query = query.ilike('technician_name', `%${params.technician_name}%`);
  }

  if (params?.job_id) {
    query = query.eq('job_id', params.job_id);
  }

  if (params?.status) {
    query = query.eq('status', params.status);
  }

  if (params?.approval_status) {
    query = query.eq('approval_status', params.approval_status);
  }

  if (params?.start_date) {
    query = query.gte('start_time', params.start_date);
  }

  if (params?.end_date) {
    query = query.lte('start_time', params.end_date);
  }

  // Apply sorting
  const sortBy = params?.sort_by || 'start_time';
  const sortOrder = params?.sort_order || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch time tracking summary: ${error.message}`);
  }

  return {
    summary: data || [],
    total: count || 0,
  };
}

export async function getTechnicianProductivity(
  technicianName?: string,
  months = 6
): Promise<TechnicianProductivity[]> {
  let query = supabase
    .from('technician_productivity')
    .select('*')
    .order('month', { ascending: false })
    .limit(months);

  if (technicianName) {
    query = query.eq('technician_name', technicianName);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(
      `Failed to fetch technician productivity: ${error.message}`
    );
  }

  return data || [];
}

export async function getJobTimeSummary(
  jobId?: string
): Promise<JobTimeSummary[]> {
  let query = supabase
    .from('job_time_summary')
    .select('*')
    .order('first_clock_in', { ascending: false });

  if (jobId) {
    query = query.eq('job_id', jobId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch job time summary: ${error.message}`);
  }

  return data || [];
}

export async function getTimeTrackingAnalytics(
  params?: TimeAnalyticsQueryParams
): Promise<TimeTrackingAnalytics> {
  // Mock analytics data - in production this would aggregate from the database
  const dateRange = params?.date_range || 'month';

  return {
    total_hours_today: 24.5,
    total_hours_week: 156.8,
    total_hours_month: 624.2,
    active_technicians: 3,
    pending_approvals: 5,
    avg_hourly_rate: 45.5,
    total_billed_today: 1122.25,
    productivity_trends: [
      { date: '2024-01-01', hours: 8.5, technicians: 2 },
      { date: '2024-01-02', hours: 7.2, technicians: 3 },
      { date: '2024-01-03', hours: 9.1, technicians: 2 },
      { date: '2024-01-04', hours: 6.8, technicians: 3 },
      { date: '2024-01-05', hours: 8.9, technicians: 2 },
    ],
    technician_performance: [
      {
        technician_name: 'John Smith',
        total_hours: 45.2,
        avg_rating: 4.8,
        on_time_percentage: 95,
      },
      {
        technician_name: 'Sarah Johnson',
        total_hours: 38.7,
        avg_rating: 4.6,
        on_time_percentage: 92,
      },
      {
        technician_name: 'Mike Davis',
        total_hours: 42.1,
        avg_rating: 4.9,
        on_time_percentage: 98,
      },
    ],
  };
}

// Utility Functions
function getDeviceInfo(): any {
  if (typeof window === 'undefined') return null;

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
  };
}

function getClientIP(): string | null {
  // In a real implementation, you'd get this from the server
  // For now, return null as it's handled server-side
  return null;
}
