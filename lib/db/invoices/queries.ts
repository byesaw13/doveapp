import type { InvoiceWithRelations } from '@/types/invoice';
import { supabase } from '@/lib/supabase';

/**
 * Get invoice by ID with all relations
 */
export async function getInvoiceByIdWithRelations(
  invoiceId: string
): Promise<InvoiceWithRelations | null> {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(
      `
      *,
      client:clients(*),
      job:jobs(
        *,
        estimate:estimates(*),
        job_line_items(*)
      ),
      payments:invoice_payments(*)
    `
    )
    .eq('id', invoiceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Invoice not found
    }
    throw new Error(`Failed to get invoice: ${error.message}`);
  }

  return invoice;
}

/**
 * List invoices with optional filtering
 */
export async function listInvoicesWithFilters(filters: {
  status?: string;
  clientId?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{
  data: InvoiceWithRelations[] | null;
  count: number;
}> {
  let query = supabase.from('invoices').select(
    `
      *,
      client:clients(*),
      job:jobs(*),
      payments:invoice_payments(*)
    `,
    { count: 'exact' }
  );

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.clientId) {
    query = query.eq('client_id', filters.clientId);
  }

  // Apply sorting
  const sortBy = filters.sortBy || 'created_at';
  const sortOrder = filters.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  if (filters.offset) {
    query = query.range(
      filters.offset,
      filters.offset + (filters.limit || 50) - 1
    );
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list invoices: ${error.message}`);
  }

  return { data, count: count || 0 };
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
      client:clients(*),
      job:jobs(*),
      payments:invoice_payments(*)
    `
    )
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get invoices for job: ${error.message}`);
  }

  return data || [];
}
