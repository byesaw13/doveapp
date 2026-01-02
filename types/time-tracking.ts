// Time Tracking Types

import type { JsonObject, JsonValue } from '@/types/json';

export interface TechnicianGeoPoint {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: string;
}

export type GeoPoint = TechnicianGeoPoint;

export type DeviceInfo = JsonObject;

export interface JobSummary {
  id: string;
  title?: string;
  job_number?: string;
  status?: string;
  client_id?: string;
  client_name?: string;
  [key: string]: JsonValue | undefined;
}

export interface TimeEntry {
  id: string;
  technician_id?: string;
  technician_name: string;
  job_id?: string;
  start_time: string;
  end_time?: string;
  total_hours?: number;
  billable_hours?: number;
  hourly_rate?: number;
  total_amount?: number;
  status: 'active' | 'completed' | 'approved' | 'rejected' | 'paid';
  notes?: string;
  location_start?: TechnicianGeoPoint | null;
  location_end?: TechnicianGeoPoint | null;
  device_info?: JsonObject | null;
  ip_address?: string;
  created_at: string;
  updated_at: string;
  // Populated from joins
  job?: JobSummary | null;
  breaks?: TimeBreak[];
  approvals?: TimeApproval[];
}

export interface TimeBreak {
  id: string;
  time_entry_id: string;
  break_type: 'lunch' | 'break' | 'meeting' | 'other';
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  notes?: string;
  created_at: string;
}

export interface TimeApproval {
  id: string;
  time_entry_id: string;
  approver_id?: string;
  approver_name?: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  approved_hours?: number;
  approved_amount?: number;
  approval_notes?: string;
  rejection_reason?: string;
  approved_at?: string;
  created_at: string;
}

export interface TechnicianLocation {
  id: string;
  technician_id?: string;
  technician_name: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  activity_type:
    | 'tracking'
    | 'clock_in'
    | 'clock_out'
    | 'job_start'
    | 'job_end';
  job_id?: string;
  notes?: string;
  created_at: string;
}

export interface TechnicianRate {
  id: string;
  technician_id?: string;
  technician_name: string;
  hourly_rate: number;
  effective_date: string;
  end_date?: string;
  created_at: string;
}

export interface TimeTrackingSummary {
  id: string;
  technician_name: string;
  job_id?: string;
  job_number?: string;
  job_title?: string;
  client_name?: string;
  start_time: string;
  end_time?: string;
  total_hours?: number;
  billable_hours?: number;
  hourly_rate?: number;
  total_amount?: number;
  status: string;
  notes?: string;
  total_breaks: number;
  total_break_minutes: number;
  approval_status?: string;
  approver_name?: string;
  approved_at?: string;
}

export interface TechnicianProductivity {
  technician_name: string;
  month: string;
  total_entries: number;
  total_hours: number;
  billable_hours: number;
  avg_hourly_rate: number;
  total_amount: number;
  avg_hours_per_entry: number;
  approved_entries: number;
  rejected_entries: number;
}

export interface JobTimeSummary {
  job_id: string;
  job_number: string;
  title: string;
  client_name?: string;
  time_entries: number;
  total_hours: number;
  billable_hours: number;
  total_billed: number;
  avg_hourly_rate: number;
  first_clock_in?: string;
  last_clock_out?: string;
}

// Form Data Types
export interface ClockInData {
  technician_name: string;
  job_id?: string;
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

export interface ClockOutData {
  time_entry_id: string;
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

export interface BreakData {
  time_entry_id: string;
  break_type: 'lunch' | 'break' | 'meeting' | 'other';
  notes?: string;
}

export interface EndBreakData {
  break_id: string;
}

export interface TimeApprovalData {
  time_entry_id: string;
  approver_name: string;
  status: 'approved' | 'rejected' | 'needs_revision';
  approved_hours?: number;
  approval_notes?: string;
  rejection_reason?: string;
}

export interface TechnicianRateData {
  technician_name: string;
  hourly_rate: number;
  effective_date: string;
  end_date?: string;
}

export interface TimeEntryUpdateData {
  notes?: string;
  hourly_rate?: number;
  status?: 'active' | 'completed' | 'approved' | 'rejected' | 'paid';
}

export interface TimeTrackingQueryParams {
  technician_name?: string;
  job_id?: string;
  status?: 'active' | 'completed' | 'approved' | 'rejected' | 'paid';
  approval_status?: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
  sort_by?:
    | 'start_time'
    | 'end_time'
    | 'total_hours'
    | 'total_amount'
    | 'technician_name';
  sort_order?: 'asc' | 'desc';
}

export interface TechnicianLocationData {
  technician_name: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  activity_type?:
    | 'tracking'
    | 'clock_in'
    | 'clock_out'
    | 'job_start'
    | 'job_end';
  job_id?: string;
  notes?: string;
}

export interface TimeAnalyticsQueryParams {
  technician_name?: string;
  date_range?: 'today' | 'week' | 'month' | 'quarter' | 'year';
  include_location_data?: boolean;
}

// Analytics Types
export interface TimeTrackingAnalytics {
  total_hours_today: number;
  total_hours_week: number;
  total_hours_month: number;
  active_technicians: number;
  pending_approvals: number;
  avg_hourly_rate: number;
  total_billed_today: number;
  productivity_trends: Array<{
    date: string;
    hours: number;
    technicians: number;
  }>;
  technician_performance: Array<{
    technician_name: string;
    total_hours: number;
    avg_rating: number;
    on_time_percentage: number;
  }>;
}
