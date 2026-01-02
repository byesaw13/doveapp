import { z } from 'zod';
import { NextRequest } from 'next/server';
import { validationErrorResponse } from '@/lib/api-helpers';

/**
 * Common validation schemas
 */
export const uuidSchema = z.string().uuid('Invalid ID format');

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)');

export const emailSchema = z.string().email('Invalid email address');

export const phoneSchema = z
  .string()
  .regex(/^[\d\s\-\(\)\+]+$/, 'Invalid phone number')
  .optional();

/**
 * Invoice validation schemas
 */
export const createInvoiceSchema = z.object({
  job_id: uuidSchema,
  due_date: dateSchema.optional(),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
});

export const updateInvoiceSchema = z.object({
  status: z.enum(['draft', 'sent', 'partial', 'paid', 'void']).optional(),
  due_date: dateSchema.optional(),
  notes: z.string().max(1000).optional(),
  client_notes: z.string().max(1000).optional(),
});

export const addInvoicePaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  method: z.enum(['cash', 'check', 'card', 'online', 'bank_transfer', 'other']),
  reference: z.string().max(255).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Job validation schemas
 */
export const createJobSchema = z.object({
  client_id: uuidSchema,
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  status: z
    .enum(['scheduled', 'in_progress', 'completed', 'cancelled'])
    .default('scheduled'),
  scheduled_date: dateSchema.optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  property_id: uuidSchema.nullable().optional(),
});

export const updateJobSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z
    .enum(['scheduled', 'in_progress', 'completed', 'cancelled'])
    .optional(),
  scheduled_date: dateSchema.optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigned_tech_id: z.string().uuid().nullable().optional(),
});

/**
 * Client validation schemas
 */
export const createClientSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: emailSchema.optional(),
  phone: phoneSchema,
  company_name: z.string().max(200).optional(),
  address_line1: z.string().max(255).optional(),
  address_line2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  postal_code: z.string().max(20).optional(),
});

export const updateClientSchema = createClientSchema.partial();

/**
 * Property validation schemas
 */
export const createPropertySchema = z.object({
  client_id: uuidSchema,
  name: z.string().min(1, 'Name is required').max(100),
  address_line1: z.string().max(255).optional(),
  address_line2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip_code: z.string().max(20).optional(),
  property_type: z
    .enum([
      'Residential',
      'Commercial',
      'Condo',
      'Apartment',
      'Townhouse',
      'Other',
    ])
    .optional(),
  notes: z.string().max(1000).optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

/**
 * Estimate validation schemas
 */
export const createEstimateSchema = z.object({
  client_id: uuidSchema,
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  status: z.enum(['draft', 'sent', 'approved', 'rejected']).default('draft'),
  valid_until: dateSchema.optional(),
});

export const updateEstimateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'sent', 'approved', 'rejected']).optional(),
  valid_until: dateSchema.optional(),
});

/**
 * Validation helper to validate request body
 */
export async function validateRequest<T extends z.ZodType>(
  request: NextRequest,
  schema: T,
  body?: unknown
): Promise<{ data?: z.infer<T>; error?: Response }> {
  try {
    const parsedBody = body !== undefined ? body : await request.json();
    const data = schema.parse(parsedBody);
    return { data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.reduce(
        (acc: Record<string, string[]>, err) => {
          const path = err.path.join('.');
          if (!acc[path]) acc[path] = [];
          acc[path].push(err.message);
          return acc;
        },
        {} as Record<string, string[]>
      );

      return { error: validationErrorResponse(errors) };
    }
    return { error: validationErrorResponse('Invalid request body') };
  }
}

/**
 * Validation helper for query parameters
 */
export function validateQueryParams<T extends z.ZodType>(
  params: URLSearchParams,
  schema: T
): { data?: z.infer<T>; error?: Response } {
  try {
    const obj = Object.fromEntries(params.entries());
    const data = schema.parse(obj);
    return { data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.reduce(
        (acc: Record<string, string[]>, err) => {
          const path = err.path.join('.');
          if (!acc[path]) acc[path] = [];
          acc[path].push(err.message);
          return acc;
        },
        {} as Record<string, string[]>
      );

      return { error: validationErrorResponse(errors) };
    }
    return { error: validationErrorResponse('Invalid query parameters') };
  }
}
