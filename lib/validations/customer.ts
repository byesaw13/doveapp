import { z } from 'zod';

export const customerSignupSchema = z.object({
  first_name: z
    .string()
    .min(1, { message: 'First name is required' })
    .max(50, { message: 'First name too long' }),
  last_name: z
    .string()
    .min(1, { message: 'Last name is required' })
    .max(50, { message: 'Last name too long' }),
  email: z
    .string()
    .email({ message: 'Invalid email address' })
    .max(100, { message: 'Email too long' }),
  phone: z
    .string()
    .min(10, { message: 'Phone number is required' })
    .max(20, { message: 'Phone number too long' }),
  secondary_phone: z
    .string()
    .max(20, { message: 'Secondary phone too long' })
    .optional(),
  address_line1: z
    .string()
    .max(255, { message: 'Address line 1 too long' })
    .optional(),
  address_line2: z
    .string()
    .max(255, { message: 'Address line 2 too long' })
    .optional(),
  city: z.string().max(100, { message: 'City too long' }).optional(),
  state: z.string().max(50, { message: 'State too long' }).optional(),
  zip_code: z.string().max(20, { message: 'ZIP code too long' }).optional(),
});

export type CustomerSignupData = z.infer<typeof customerSignupSchema>;
