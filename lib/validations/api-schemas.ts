import { z } from 'zod';

/**
 * Common validation schemas for API requests
 * Using Zod for runtime type checking and validation
 */

// UUID validation
export const uuidSchema = z.string().uuid();

// Email validation
export const emailSchema = z.string().email();

// Phone validation (US format)
export const phoneSchema = z
  .string()
  .regex(/^\+?1?\d{10,14}$/, 'Invalid phone number');

// Client/Customer schemas
export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  company: z.string().max(255).optional(),
  address_line1: z.string().max(500).optional(),
  address_line2: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip_code: z.string().max(20).optional(),
  notes: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial();

// Job schemas
export const createJobSchema = z.object({
  client_id: uuidSchema,
  property_id: uuidSchema.optional(),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  status: z.enum([
    'scheduled',
    'in_progress',
    'completed',
    'cancelled',
    'on_hold',
  ]),
  service_date: z.string().datetime(),
  scheduled_time: z.string().optional(),
  notes: z.string().optional(),
  subtotal: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0).default(0),
  line_items: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().min(0),
        unit_price: z.number().min(0),
        total: z.number().min(0),
      })
    )
    .optional(),
});

export const updateJobSchema = createJobSchema.partial();

// Estimate schemas
export const createEstimateSchema = z.object({
  client_id: uuidSchema,
  estimate_number: z.string().min(1, 'Estimate number is required'),
  subject: z.string().min(1, 'Subject is required').max(255),
  notes: z.string().optional(),
  status: z
    .enum(['pending', 'approved', 'declined', 'expired'])
    .default('pending'),
  subtotal: z.number().min(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0),
  valid_until: z.string().datetime().optional(),
  line_items: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().min(0),
        unit_price: z.number().min(0),
        total: z.number().min(0),
      })
    )
    .optional(),
});

export const updateEstimateSchema = createEstimateSchema.partial();

// Invoice schemas
export const createInvoiceSchema = z.object({
  client_id: uuidSchema,
  job_id: uuidSchema.optional(),
  invoice_number: z.string().min(1, 'Invoice number is required'),
  issue_date: z.string().datetime(),
  due_date: z.string().datetime(),
  notes: z.string().optional(),
  payment_status: z
    .enum(['pending', 'paid', 'overdue', 'cancelled'])
    .default('pending'),
  subtotal: z.number().min(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0),
  amount_paid: z.number().min(0).default(0),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

// Lead schemas
export const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  company: z.string().max(255).optional(),
  source: z.string().max(100).optional(),
  status: z
    .enum([
      'new',
      'contacted',
      'qualified',
      'proposal_sent',
      'negotiating',
      'converted',
      'lost',
      'unqualified',
    ])
    .default('new'),
  estimated_value: z.number().min(0).optional(),
  notes: z.string().optional(),
  next_follow_up_date: z.string().datetime().optional(),
});

export const updateLeadSchema = createLeadSchema.partial();

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Helper function to validate request body
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: result.error };
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim()
    .slice(0, 10000); // Limit length
}

/**
 * Validate and sanitize email
 */
export function validateEmail(email: string): boolean {
  const result = emailSchema.safeParse(email);
  return result.success;
}
