import { supabase } from '@/lib/supabase';
import type { Payment, PaymentInsert, PaymentUpdate } from '@/types/payment';
import { logPaymentReceived } from './activities';

/**
 * Get all payments for a job
 */
export async function getPaymentsByJob(jobId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('job_id', jobId)
    .order('payment_date', { ascending: false });

  if (error) {
    console.error('Error fetching payments:', error);
    throw new Error('Failed to fetch payments');
  }

  return data || [];
}

/**
 * Get a single payment
 */
export async function getPayment(id: string): Promise<Payment | null> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching payment:', error);
    return null;
  }

  return data;
}

/**
 * Create a new payment
 */
export async function createPayment(
  payment: PaymentInsert
): Promise<Payment | null> {
  const { data, error } = await supabase
    .from('payments')
    .insert(payment)
    .select()
    .single();

  if (error) {
    console.error('Error creating payment:', error);
    throw new Error('Failed to create payment');
  }

  if (data?.job_id) {
    try {
      const { data: job } = await supabase
        .from('jobs')
        .select('id, client_id, title, job_number')
        .eq('id', data.job_id)
        .single();

      if (job?.client_id) {
        await logPaymentReceived(
          job.client_id,
          data.id,
          data.amount,
          data.payment_method || undefined
        );
      }
    } catch (activityError) {
      console.error('Failed to log payment activity:', activityError);
    }
  }

  return data;
}

/**
 * Update a payment
 */
export async function updatePayment(
  id: string,
  updates: PaymentUpdate
): Promise<Payment | null> {
  const { data, error } = await supabase
    .from('payments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating payment:', error);
    throw new Error('Failed to update payment');
  }

  return data;
}

/**
 * Delete a payment
 */
export async function deletePayment(id: string): Promise<boolean> {
  const { error } = await supabase.from('payments').delete().eq('id', id);

  if (error) {
    console.error('Error deleting payment:', error);
    throw new Error('Failed to delete payment');
  }

  return true;
}

/**
 * Get payment summary for a job
 */
export async function getJobPaymentSummary(jobId: string): Promise<{
  total: number;
  paid: number;
  remaining: number;
  status: string;
}> {
  const { data: job } = await supabase
    .from('jobs')
    .select('total, amount_paid, payment_status')
    .eq('id', jobId)
    .single();

  if (!job) {
    return { total: 0, paid: 0, remaining: 0, status: 'unpaid' };
  }

  return {
    total: parseFloat(job.total.toString()),
    paid: parseFloat(job.amount_paid.toString()),
    remaining:
      parseFloat(job.total.toString()) - parseFloat(job.amount_paid.toString()),
    status: job.payment_status,
  };
}
