import { z } from 'zod';

export const clockInSchema = z.object({
  technician_name: z
    .string()
    .min(1, 'Technician name is required')
    .max(100, 'Name is too long'),
  job_id: z.string().uuid().optional(),
  notes: z.string().optional(),
  location: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      accuracy: z.number().min(0).optional(),
    })
    .optional(),
});

export const clockOutSchema = z.object({
  time_entry_id: z.string().uuid('Invalid time entry ID'),
  notes: z.string().optional(),
  location: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      accuracy: z.number().min(0).optional(),
    })
    .optional(),
});

export const breakSchema = z.object({
  time_entry_id: z.string().uuid('Invalid time entry ID'),
  break_type: z.enum(['lunch', 'break', 'meeting', 'other']),
  notes: z.string().optional(),
});

export const endBreakSchema = z.object({
  break_id: z.string().uuid('Invalid break ID'),
});

export const timeApprovalSchema = z
  .object({
    time_entry_id: z.string().uuid('Invalid time entry ID'),
    approver_name: z
      .string()
      .min(1, 'Approver name is required')
      .max(100, 'Name is too long'),
    status: z.enum(['approved', 'rejected', 'needs_revision']),
    approved_hours: z
      .number()
      .min(0, 'Approved hours must be positive')
      .max(24, 'Hours cannot exceed 24')
      .optional(),
    approval_notes: z.string().optional(),
    rejection_reason: z
      .string()
      .min(1, 'Rejection reason is required when rejecting')
      .optional(),
  })
  .refine(
    (data) => {
      if (data.status === 'rejected' && !data.rejection_reason) {
        return false;
      }
      return true;
    },
    {
      message: 'Rejection reason is required when rejecting time entry',
      path: ['rejection_reason'],
    }
  );

export const technicianRateSchema = z.object({
  technician_name: z
    .string()
    .min(1, 'Technician name is required')
    .max(100, 'Name is too long'),
  hourly_rate: z
    .number()
    .min(0, 'Hourly rate must be positive')
    .max(1000, 'Rate is too high'),
  effective_date: z.string().min(1, 'Effective date is required'),
  end_date: z.string().optional(),
});

export const timeEntryUpdateSchema = z.object({
  id: z.string().uuid('Invalid time entry ID'),
  notes: z.string().optional(),
  hourly_rate: z
    .number()
    .min(0, 'Hourly rate must be positive')
    .max(1000, 'Rate is too high')
    .optional(),
  status: z
    .enum(['active', 'completed', 'approved', 'rejected', 'paid'])
    .optional(),
});

// Query/filter schemas
export const timeTrackingQuerySchema = z.object({
  technician_name: z.string().optional(),
  job_id: z.string().uuid().optional(),
  status: z
    .enum(['active', 'completed', 'approved', 'rejected', 'paid'])
    .optional(),
  approval_status: z
    .enum(['pending', 'approved', 'rejected', 'needs_revision'])
    .optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sort_by: z
    .enum([
      'start_time',
      'end_time',
      'total_hours',
      'total_amount',
      'technician_name',
    ])
    .default('start_time'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export const technicianLocationSchema = z.object({
  technician_name: z
    .string()
    .min(1, 'Technician name is required')
    .max(100, 'Name is too long'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).optional(),
  activity_type: z
    .enum(['tracking', 'clock_in', 'clock_out', 'job_start', 'job_end'])
    .default('tracking'),
  job_id: z.string().uuid().optional(),
  notes: z.string().optional(),
});

// Analytics query schemas
export const timeAnalyticsQuerySchema = z.object({
  technician_name: z.string().optional(),
  date_range: z
    .enum(['today', 'week', 'month', 'quarter', 'year'])
    .default('month'),
  include_location_data: z.boolean().default(false),
});

export type ClockInData = z.infer<typeof clockInSchema>;
export type ClockOutData = z.infer<typeof clockOutSchema>;
export type BreakData = z.infer<typeof breakSchema>;
export type EndBreakData = z.infer<typeof endBreakSchema>;
export type TimeApprovalData = z.infer<typeof timeApprovalSchema>;
export type TechnicianRateData = z.infer<typeof technicianRateSchema>;
export type TimeEntryUpdateData = z.infer<typeof timeEntryUpdateSchema>;
export type TimeTrackingQueryParams = z.infer<typeof timeTrackingQuerySchema>;
export type TechnicianLocationData = z.infer<typeof technicianLocationSchema>;
export type TimeAnalyticsQueryParams = z.infer<typeof timeAnalyticsQuerySchema>;
