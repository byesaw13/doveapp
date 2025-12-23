import { supabase } from '@/lib/supabase';
import type { InvoiceStatus } from '@/types/invoice';

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus
): Promise<void> {
  const { error } = await supabase
    .from('invoices')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', invoiceId);

  if (error) {
    throw new Error(`Failed to update invoice status: ${error.message}`);
  }
}
