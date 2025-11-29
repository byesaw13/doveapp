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
