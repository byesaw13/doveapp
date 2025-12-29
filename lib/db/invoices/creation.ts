import type {
  Invoice,
  InvoiceWithRelations,
  InvoiceLineItem,
  InvoicePayment,
  InvoiceStatus,
  PaymentMethod,
} from '@/types/invoice';
import { supabase } from '@/lib/supabase';
import { scheduleInvoiceFollowUps } from '@/lib/db/automation_triggers';

export interface CreateInvoiceFromJobOptions {
  dueDate?: string; // Optional custom due date
}

/**
 * Create an invoice from a completed job
 */
export async function createInvoiceFromJob(
  jobId: string,
  options: CreateInvoiceFromJobOptions = {}
): Promise<Invoice> {
  // Get job with relations
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select(
      `
      *,
      client:clients(id, first_name, last_name, email, phone),
      estimate:estimates(id, estimate_number, title),
      job_line_items(*)
    `
    )
    .eq('id', jobId)
    .single();

  if (jobError || !job) {
    throw new Error('Job not found');
  }

  if (!job.ready_for_invoice) {
    throw new Error('Job is not ready for invoicing');
  }

  // Check if invoice already exists for this job
  const { data: existingInvoice } = await supabase
    .from('invoices')
    .select('id')
    .eq('job_id', jobId)
    .single();

  if (existingInvoice) {
    throw new Error('Invoice already exists for this job');
  }

  // Generate invoice number
  const { data: lastInvoice } = await supabase
    .from('invoices')
    .select('invoice_number')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const nextNumber = lastInvoice
    ? parseInt(lastInvoice.invoice_number.replace('INV-', '')) + 1
    : 1;
  const invoiceNumber = `INV-${nextNumber.toString().padStart(4, '0')}`;

  // Calculate totals from job line items
  const lineItems: InvoiceLineItem[] = job.job_line_items.map((item: any) => ({
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: item.quantity * item.unit_price,
  }));

  const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0);
  const taxRate = 0.08; // Default 8% tax - should be configurable
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  // Create invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      job_id: jobId,
      client_id: job.client_id,
      invoice_number: invoiceNumber,
      status: 'draft',
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      due_date:
        options.dueDate ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0], // 30 days from now
      line_items: lineItems,
    })
    .select()
    .single();

  if (invoiceError) {
    throw new Error(`Failed to create invoice: ${invoiceError.message}`);
  }

  // Schedule follow-up automations
  try {
    await scheduleInvoiceFollowUps(invoice.id);
  } catch (error) {
    console.error('Failed to schedule invoice follow-ups:', error);
    // Don't fail the invoice creation if automations fail
  }

  return invoice;
}
