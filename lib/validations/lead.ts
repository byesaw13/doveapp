import { z } from 'zod';

export const leadSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  company_name: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  alternate_phone: z.string().optional(),
  source: z.enum([
    'website',
    'referral',
    'social_media',
    'email',
    'phone',
    'walk_in',
    'advertisement',
    'other',
  ]),
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
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  service_type: z.string().optional(),
  service_description: z.string().optional(),
  estimated_value: z.number().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  follow_up_date: z.string().optional(),
  notes: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;
