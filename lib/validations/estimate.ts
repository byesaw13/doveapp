import { z } from 'zod';

export const estimateLineItemSchema = z.object({
  serviceId: z.union([z.number(), z.string()]).optional(), // For pricebook integration
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit_price: z.number().min(0, 'Unit price must be positive'),
  unit: z.string().optional(),
  materialCost: z.number().min(0).optional(), // For pricebook integration
  tier: z.enum(['basic', 'standard', 'premium']).optional(), // For pricebook integration
});

export const estimateSchema = z
  .object({
    client_id: z.string().optional(),
    lead_id: z.string().optional(),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    line_items: z
      .array(estimateLineItemSchema)
      .min(1, 'At least one line item is required'),
    tax_rate: z.number().min(0).max(100).default(0),
    discount_amount: z.number().min(0).default(0),
    valid_until: z.string().min(1, 'Valid until date is required'),
    payment_terms: z.string().optional(),
    terms_and_conditions: z.string().optional(),
    status: z
      .enum([
        'draft',
        'sent',
        'viewed',
        'accepted',
        'declined',
        'expired',
        'revised',
      ])
      .default('draft'),
  })
  .refine(
    (data) => {
      const hasClient =
        data.client_id && data.client_id !== '' && data.client_id !== 'none';
      const hasLead =
        data.lead_id && data.lead_id !== '' && data.lead_id !== 'none';
      return hasClient || hasLead;
    },
    {
      message: 'Please select either a client or a lead',
      path: ['client_id'],
    }
  );

export type EstimateFormData = z.infer<typeof estimateSchema>;
export type EstimateLineItemFormData = z.infer<typeof estimateLineItemSchema>;
