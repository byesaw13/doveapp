// Re-export from organized modules
export * from './invoices/index';

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

  // Calculate totals from job line items
  const subtotal =
    job.job_line_items?.reduce(
      (sum: number, item: any) => sum + (item.total || 0),
      0
    ) || 0;
  const total = subtotal; // For now, no additional taxes/fees
  const balanceDue = total;

  // Set due date (14 days from now by default)
  const dueDate =
    options.dueDate ||
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Create invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      job_id: jobId,
      estimate_id: job.estimate_id,
      client_id: job.client_id,
      status: 'draft',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: dueDate,
      subtotal,
      total,
      balance_due: balanceDue,
    })
    .select()
    .single();

  if (invoiceError || !invoice) {
    console.error('Failed to create invoice:', invoiceError);
    throw new Error('Failed to create invoice');
  }

  // Create invoice line items from job line items
  if (job.job_line_items && job.job_line_items.length > 0) {
    const lineItems = job.job_line_items.map((item: any) => ({
      invoice_id: invoice.id,
      service_id: item.service_id,
      description: item.description,
      quantity: item.quantity,
      tier: item.tier,
      unit_price: item.unit_price,
      line_total: item.total,
    }));

    const { error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .insert(lineItems);

    if (lineItemsError) {
      console.error('Failed to create invoice line items:', lineItemsError);
      // Don't throw here - invoice is created, just log the error
    }
  }

  try {
    await scheduleInvoiceFollowUps(invoice.id);
  } catch (automationError) {
    console.error('Failed to schedule invoice follow-ups:', automationError);
  }

  return invoice;
}

/**
 * Get invoice by ID with all relations
 */
export async function getInvoiceByIdWithRelations(
  invoiceId: string
): Promise<InvoiceWithRelations | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select(
      `
      *,
      job:jobs(
        id,
        job_number,
        title,
        status
      ),
      estimate:estimates(
        id,
        estimate_number,
        title
      ),
      client:clients(
        id,
        first_name,
        last_name,
        email,
        phone
      ),
      invoice_line_items(*),
      invoice_payments(*)
    `
    )
    .eq('id', invoiceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching invoice with relations:', error);
    throw new Error('Failed to fetch invoice');
  }

  return data as InvoiceWithRelations;
}

/**
 * List invoices with filters
 */
export async function listInvoicesWithFilters(filters: {
  status?: InvoiceStatus | 'all';
  search?: string;
}): Promise<InvoiceWithRelations[]> {
  let query = supabase
    .from('invoices')
    .select(
      `
      *,
      job:jobs(
        id,
        job_number,
        title,
        status
      ),
      estimate:estimates(
        id,
        estimate_number,
        title
      ),
      client:clients(
        id,
        first_name,
        last_name,
        email,
        phone
      ),
      invoice_line_items(*),
      invoice_payments(*)
    `
    )
    .order('created_at', { ascending: false });

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.search) {
    // Search by invoice number or customer name
    query = query.or(
      `invoice_number.ilike.%${filters.search}%,customer.first_name.ilike.%${filters.search}%,customer.last_name.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching invoices with filters:', error);
    throw new Error('Failed to fetch invoices');
  }

  return (data || []) as InvoiceWithRelations[];
}

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus
): Promise<void> {
  const { error } = await supabase
    .from('invoices')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId);

  if (error) {
    console.error('Error updating invoice status:', error);
    throw new Error('Failed to update invoice status');
  }
}

/**
 * Add payment to invoice and update balance
 */
export async function addInvoicePayment(
  invoiceId: string,
  paymentData: {
    amount: number;
    method: PaymentMethod;
    reference?: string;
    notes?: string;
  }
): Promise<Invoice> {
  // Get current invoice
  const invoice = await getInvoiceByIdWithRelations(invoiceId);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Insert payment to invoice_payments table
  const { data: payment, error: paymentError } = await supabase
    .from('invoice_payments')
    .insert({
      invoice_id: invoiceId,
      amount: paymentData.amount,
      method: paymentData.method,
      reference: paymentData.reference,
      notes: paymentData.notes,
    })
    .select()
    .single();

  if (paymentError || !payment) {
    console.error('Failed to record payment:', paymentError);
    throw new Error('Failed to record payment');
  }

  // Calculate new balance and status
  const totalPaid =
    (invoice.invoice_payments || []).reduce((sum, p) => sum + p.amount, 0) +
    paymentData.amount;
  const newBalanceDue = Math.max(0, invoice.total - totalPaid);

  let newStatus: InvoiceStatus = invoice.status;
  if (totalPaid >= invoice.total) {
    newStatus = 'paid';
  } else if (totalPaid > 0) {
    newStatus = 'partial';
  }

  // Update invoice
  const { data: updatedInvoice, error: updateError } = await supabase
    .from('invoices')
    .update({
      balance_due: newBalanceDue,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
    .select()
    .single();

  if (updateError || !updatedInvoice) {
    console.error('Failed to update invoice balance:', updateError);
    throw new Error('Failed to update invoice balance');
  }

  return updatedInvoice;
}

/**
 * Get invoice statistics
 */
export async function getInvoiceStats(): Promise<{
  total_invoices: number;
  draft_invoices: number;
  sent_invoices: number;
  paid_invoices: number;
  total_revenue: number;
  outstanding_balance: number;
}> {
  const { data, error } = await supabase.from('invoices').select('*');

  if (error) {
    console.error('Error fetching invoice stats:', error);
    throw new Error('Failed to fetch invoice stats');
  }

  const stats = {
    total_invoices: data.length,
    draft_invoices: data.filter((inv) => inv.status === 'draft').length,
    sent_invoices: data.filter((inv) => inv.status === 'sent').length,
    paid_invoices: data.filter((inv) => inv.status === 'paid').length,
    total_revenue: data.reduce(
      (sum, inv) => sum + (inv.total - inv.balance_due),
      0
    ),
    outstanding_balance: data.reduce((sum, inv) => sum + inv.balance_due, 0),
  };

  return stats;
}

/**
 * Delete an invoice payment
 */
export async function deleteInvoicePayment(paymentId: string): Promise<void> {
  // Get payment to find invoice_id
  const { data: payment, error: fetchError } = await supabase
    .from('invoice_payments')
    .select('invoice_id, amount')
    .eq('id', paymentId)
    .single();

  if (fetchError || !payment) {
    throw new Error('Payment not found');
  }

  // Delete payment
  const { error: deleteError } = await supabase
    .from('invoice_payments')
    .delete()
    .eq('id', paymentId);

  if (deleteError) {
    console.error('Error deleting payment:', deleteError);
    throw new Error('Failed to delete payment');
  }

  // Recalculate invoice balance
  const invoice = await getInvoiceByIdWithRelations(payment.invoice_id);
  if (invoice) {
    const totalPaid = (invoice.invoice_payments || []).reduce(
      (sum, p) => sum + p.amount,
      0
    );
    const newBalanceDue = Math.max(0, invoice.total - totalPaid);

    let newStatus: InvoiceStatus = 'draft';
    if (totalPaid >= invoice.total) {
      newStatus = 'paid';
    } else if (totalPaid > 0) {
      newStatus = 'partial';
    } else if (invoice.status === 'sent' || invoice.status === 'partial') {
      newStatus = 'sent';
    }

    await supabase
      .from('invoices')
      .update({
        balance_due: newBalanceDue,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.invoice_id);
  }
}

/**
 * Get all invoices for a specific job
 */
export async function getInvoicesByJobId(
  jobId: string
): Promise<InvoiceWithRelations[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select(
      `
      *,
      job:jobs(
        id,
        job_number,
        title,
        status
      ),
      client:clients(
        id,
        first_name,
        last_name,
        email,
        phone
      ),
      invoice_line_items(*),
      invoice_payments(*)
    `
    )
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching job invoices:', error);
    throw new Error('Failed to fetch job invoices');
  }

  return (data || []) as InvoiceWithRelations[];
}

/**
 * Alias for addInvoicePayment for backward compatibility
 */
export const addPayment = addInvoicePayment;
