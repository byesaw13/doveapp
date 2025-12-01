import { z } from 'zod';

export const jobStatusEnum = z.enum([
  'quote',
  'scheduled',
  'in_progress',
  'completed',
  'invoiced',
  'cancelled',
]);

export const lineItemSchema = z.object({
  item_type: z.enum(['labor', 'material']),
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(0.01, 'Quantity must be greater than 0'),
  unit_price: z.coerce.number().min(0, 'Unit price must be 0 or greater'),
});

export const jobSchema = z.object({
  client_id: z.string().uuid('Please select a client'),
  property_id: z.string().optional(),
  title: z.string().min(1, 'Job title is required'),
  description: z.string().optional(),
  status: jobStatusEnum,
  service_date: z.string().optional(),
  scheduled_time: z.string().optional(),
  notes: z.string().optional(),
});

export type JobFormData = z.infer<typeof jobSchema>;
export type LineItemFormData = z.infer<typeof lineItemSchema>;

// Job Template Schema
export const jobTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(100, 'Name is too long'),
  description: z.string().optional(),
  category: z.string().optional(),
  estimated_duration_hours: z.coerce.number().min(0).optional(),
  estimated_cost: z.coerce.number().min(0).optional(),
  default_priority: z
    .enum(['low', 'medium', 'high', 'urgent'])
    .default('medium'),
  title_template: z.string().min(1, 'Title template is required'),
  description_template: z.string().optional(),
  service_date_offset_days: z.coerce.number().min(0).default(0),
  default_line_items: z.array(lineItemSchema).default([]),
});

export type JobTemplateFormData = z.infer<typeof jobTemplateSchema>;
