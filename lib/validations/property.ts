import { z } from 'zod';

export const propertySchema = z.object({
  client_id: z.string().uuid({ message: 'Invalid client ID' }),
  name: z
    .string()
    .min(1, { message: 'Property name is required' })
    .max(100, { message: 'Property name too long' }),
  address_line1: z
    .string()
    .max(255, { message: 'Address line 1 too long' })
    .optional()
    .nullable(),
  address_line2: z
    .string()
    .max(255, { message: 'Address line 2 too long' })
    .optional()
    .nullable(),
  city: z.string().max(100, { message: 'City too long' }).optional().nullable(),
  state: z
    .string()
    .max(50, { message: 'State too long' })
    .optional()
    .nullable(),
  zip_code: z
    .string()
    .max(20, { message: 'ZIP code too long' })
    .optional()
    .nullable(),
  property_type: z
    .enum([
      'Residential',
      'Commercial',
      'Condo',
      'Apartment',
      'Townhouse',
      'Other',
    ])
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(1000, { message: 'Notes too long' })
    .optional()
    .nullable(),
});

export type PropertyFormData = z.infer<typeof propertySchema>;
