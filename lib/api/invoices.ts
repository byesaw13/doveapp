import { SupabaseClient } from '@supabase/supabase-js';
import type { InvoiceWithRelations, InvoiceStatus } from '@/types/invoice';

export interface InvoiceServiceContext {
  accountId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'TECH' | 'CUSTOMER';
  supabase: SupabaseClient;
}

export interface InvoiceFilters {
  status?: string;
  search?: string;
  customerId?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  dir?: 'asc' | 'desc';
}

/**
 * List invoices with portal-aware filtering and access control
 */
export async function listInvoices(
  context: InvoiceServiceContext,
  filters: InvoiceFilters = {}
): Promise<{
  data: InvoiceWithRelations[] | null;
  page: number;
  pageSize: number;
  total: number;
  error: Error | null;
}> {
  try {
    let query = context.supabase
      .from('invoices')
      .select(
        `
        *,
        job:jobs(id, job_number, title, status),
        estimate:estimates(id, estimate_number, title),
        customer:clients(id, first_name, last_name, email, phone)
      `
      )
      .order('created_at', { ascending: false });

    // CRITICAL: Filter by account_id for multi-tenancy
    query = query.eq('account_id', context.accountId);

    // Role-specific filtering
    if (context.role === 'CUSTOMER') {
      // For now, customers see all invoices in their account
      // TODO: Filter by customer_id when invoices.customer_id is populated
    }

    // Additional filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.search) {
      query = query.or(`invoice_number.ilike.%${filters.search}%`);
    }

    // Pagination defaults
    const page = filters.page || 1;
    const pageSize = Math.min(filters.pageSize || 20, 100);
    const offset = (page - 1) * pageSize;

    // Sorting
    const sortField = filters.sort || 'created_at';
    const sortDir = filters.dir || 'desc';
    query = query.order(sortField, { ascending: sortDir === 'asc' });

    const { data, error, count } = await query
      .select('*', { count: 'exact' })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Error fetching invoices:', error);
      return {
        data: null,
        page,
        pageSize,
        total: 0,
        error: new Error('Failed to fetch invoices'),
      };
    }

    return { data: data || [], page, pageSize, total: count || 0, error: null };
  } catch (error) {
    console.error('Unexpected error in listInvoices:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get a single invoice by ID with access control
 */
export async function getInvoiceById(
  context: InvoiceServiceContext,
  invoiceId: string
): Promise<{ data: InvoiceWithRelations | null; error: Error | null }> {
  try {
    const { data, error } = await context.supabase
      .from('invoices')
      .select(
        `
        *,
        job:jobs(id, job_number, title, status),
        estimate:estimates(id, estimate_number, title),
        customer:clients(id, first_name, last_name, email, phone)
      `
      )
      .eq('id', invoiceId)
      .eq('account_id', context.accountId)
      .single();

    if (error) {
      console.error('Error fetching invoice:', error);
      return { data: null, error: new Error('Failed to fetch invoice') };
    }

    // Role-based access control
    if (context.role === 'CUSTOMER') {
      // For now, allow access to all invoices in account
      // TODO: Check customer_id when populated
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error in getInvoiceById:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Create a new invoice (admin only)
 */
export async function createInvoice(
  context: InvoiceServiceContext,
  invoiceData: any
): Promise<{ data: any | null; error: Error | null }> {
  try {
    // Only admins can create invoices
    if (context.role !== 'OWNER' && context.role !== 'ADMIN') {
      return {
        data: null,
        error: new Error('Only admins can create invoices'),
      };
    }

    // Add account_id to invoice data
    const dataWithContext = {
      ...invoiceData,
      account_id: context.accountId,
    };

    const { data, error } = await context.supabase
      .from('invoices')
      .insert(dataWithContext)
      .select()
      .single();

    if (error) {
      console.error('Error creating invoice:', error);
      return { data: null, error: new Error('Failed to create invoice') };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error in createInvoice:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update an invoice (admin only)
 */
export async function updateInvoice(
  context: InvoiceServiceContext,
  invoiceId: string,
  updates: any
): Promise<{ data: any | null; error: Error | null }> {
  try {
    // Only admins can update invoices
    if (context.role !== 'OWNER' && context.role !== 'ADMIN') {
      return {
        data: null,
        error: new Error('Only admins can update invoices'),
      };
    }

    const { data, error } = await context.supabase
      .from('invoices')
      .update(updates)
      .eq('id', invoiceId)
      .eq('account_id', context.accountId)
      .select()
      .single();

    if (error) {
      console.error('Error updating invoice:', error);
      return { data: null, error: new Error('Failed to update invoice') };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error in updateInvoice:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete an invoice (admin only)
 */
export async function deleteInvoice(
  context: InvoiceServiceContext,
  invoiceId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // Only admins can delete invoices
    if (context.role !== 'OWNER' && context.role !== 'ADMIN') {
      return {
        success: false,
        error: new Error('Only admins can delete invoices'),
      };
    }

    const { error } = await context.supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId)
      .eq('account_id', context.accountId);

    if (error) {
      console.error('Error deleting invoice:', error);
      return { success: false, error: new Error('Failed to delete invoice') };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error in deleteInvoice:', error);
    return { success: false, error: error as Error };
  }
}
