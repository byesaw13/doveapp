import { supabase } from '@/lib/supabase';
import type { InvoicePayment } from '@/types/invoice';

/**
 * Add payment to invoice
 */
export async function addInvoicePayment(
  invoiceId: string,
  payment: Omit<InvoicePayment, 'id' | 'invoice_id' | 'created_at'>
): Promise<InvoicePayment> {
  // Validate invoice exists and get current status
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('status, total, payments:invoice_payments(amount)')
    .eq('id', invoiceId)
    .single();

  if (invoiceError || !invoice) {
    throw new Error('Invoice not found');
  }

  // Calculate current paid amount
  const currentPaid =
    invoice.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
  const newPaidAmount = currentPaid + payment.amount;

  // Determine new status based on payment
  let newStatus = invoice.status;
  if (newPaidAmount >= invoice.total) {
    newStatus = 'paid';
  } else if (newPaidAmount > 0) {
    newStatus = 'partial';
  }

  // Insert payment
  const { data: newPayment, error: paymentError } = await supabase
    .from('invoice_payments')
    .insert({
      invoice_id: invoiceId,
      amount: payment.amount,
      method: payment.method,
      paid_at: payment.paid_at,
      notes: payment.notes,
    })
    .select()
    .single();

  if (paymentError) {
    throw new Error(`Failed to add payment: ${paymentError.message}`);
  }

  // Update invoice status if needed
  if (newStatus !== invoice.status) {
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ status: newStatus })
      .eq('id', invoiceId);

    if (updateError) {
      console.error(
        'Failed to update invoice status after payment:',
        updateError
      );
    }
  }

  return newPayment;
}

/**
 * Delete invoice payment
 */
export async function deleteInvoicePayment(paymentId: string): Promise<void> {
  // Get payment details before deletion
  const { data: payment, error: getError } = await supabase
    .from('invoice_payments')
    .select('invoice_id, amount')
    .eq('id', paymentId)
    .single();

  if (getError || !payment) {
    throw new Error('Payment not found');
  }

  // Delete the payment
  const { error: deleteError } = await supabase
    .from('invoice_payments')
    .delete()
    .eq('id', paymentId);

  if (deleteError) {
    throw new Error(`Failed to delete payment: ${deleteError.message}`);
  }

  // Recalculate invoice status
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('total, payments:invoice_payments(amount)')
    .eq('id', payment.invoice_id)
    .single();

  if (invoiceError) {
    console.error(
      'Failed to recalculate invoice status after payment deletion:',
      invoiceError
    );
    return;
  }

  const remainingPaid =
    invoice.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
  let newStatus = 'sent'; // Default back to sent

  if (remainingPaid >= invoice.total) {
    newStatus = 'paid';
  } else if (remainingPaid > 0) {
    newStatus = 'partial';
  }

  const { error: updateError } = await supabase
    .from('invoices')
    .update({ status: newStatus })
    .eq('id', payment.invoice_id);

  if (updateError) {
    console.error(
      'Failed to update invoice status after payment deletion:',
      updateError
    );
  }
}
