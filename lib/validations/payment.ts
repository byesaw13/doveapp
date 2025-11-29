import { z } from 'zod';

export const paymentSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  payment_method: z.string().optional(),
  payment_date: z.string().min(1, 'Payment date is required'),
  notes: z.string().optional(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;
