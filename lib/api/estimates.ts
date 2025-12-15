import { SupabaseClient } from '@supabase/supabase-js';
import type { EstimateWithRelations, EstimateStatus } from '@/types/estimate';

export interface EstimateServiceContext {
  accountId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'TECH' | 'CUSTOMER';
  supabase: SupabaseClient;
}

export interface EstimateFilters {
  status?: string;
  search?: string;
  customerId?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  dir?: 'asc' | 'desc';
}

/**
 * List estimates with portal-aware filtering and access control
 */
export async function listEstimates(
  context: EstimateServiceContext,
  filters: EstimateFilters = {}
): Promise<{
  data: EstimateWithRelations[] | null;
  page: number;
  pageSize: number;
  total: number;
  error: Error | null;
}> {
  try {
    let query = context.supabase
      .from('estimates')
      .select(
        `
        *,
        lead:leads(id, first_name, last_name, email, phone),
        client:clients(id, first_name, last_name, company_name, email, phone)
      `
      )
      .order('created_at', { ascending: false });

    // CRITICAL: Filter by account_id for multi-tenancy
    query = query.eq('account_id', context.accountId);

    // Role-specific filtering
    if (context.role === 'CUSTOMER') {
      // For now, customers see all estimates in their account
      // TODO: Filter by customer_id when estimates.customer_id is populated
    }

    // Additional filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,estimate_number.ilike.%${filters.search}%`
      );
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
      console.error('Error fetching estimates:', error);
      return {
        data: null,
        page,
        pageSize,
        total: 0,
        error: new Error('Failed to fetch estimates'),
      };
    }

    return { data: data || [], page, pageSize, total: count || 0, error: null };
  } catch (error) {
    console.error('Unexpected error in listEstimates:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get a single estimate by ID with access control
 */
export async function getEstimateById(
  context: EstimateServiceContext,
  estimateId: string
): Promise<{ data: EstimateWithRelations | null; error: Error | null }> {
  try {
    const { data, error } = await context.supabase
      .from('estimates')
      .select(
        `
        *,
        lead:leads(id, first_name, last_name, email, phone),
        client:clients(id, first_name, last_name, company_name, email, phone)
      `
      )
      .eq('id', estimateId)
      .eq('account_id', context.accountId)
      .single();

    if (error) {
      console.error('Error fetching estimate:', error);
      return { data: null, error: new Error('Failed to fetch estimate') };
    }

    // Role-based access control
    if (context.role === 'CUSTOMER') {
      // For now, allow access to all estimates in account
      // TODO: Check customer_id when populated
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error in getEstimateById:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Create a new estimate (admin only)
 */
export async function createEstimate(
  context: EstimateServiceContext,
  estimateData: any
): Promise<{ data: any | null; error: Error | null }> {
  try {
    // Only admins can create estimates
    if (context.role !== 'OWNER' && context.role !== 'ADMIN') {
      return {
        data: null,
        error: new Error('Only admins can create estimates'),
      };
    }

    // Add account_id to estimate data
    const dataWithContext = {
      ...estimateData,
      account_id: context.accountId,
    };

    const { data, error } = await context.supabase
      .from('estimates')
      .insert(dataWithContext)
      .select()
      .single();

    if (error) {
      console.error('Error creating estimate:', error);
      return { data: null, error: new Error('Failed to create estimate') };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error in createEstimate:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update an estimate (admin only, customers can approve/decline)
 */
export async function updateEstimate(
  context: EstimateServiceContext,
  estimateId: string,
  updates: any
): Promise<{ data: any | null; error: Error | null }> {
  try {
    // Check permissions based on update type
    const isApprovalAction =
      updates.status === 'approved' || updates.status === 'declined';

    if (context.role === 'CUSTOMER') {
      // Customers can only approve/decline their own estimates
      if (!isApprovalAction) {
        return {
          data: null,
          error: new Error('Customers can only approve or decline estimates'),
        };
      }

      // Verify ownership
      const { data: existingEstimate } = await context.supabase
        .from('estimates')
        .select('customer_id')
        .eq('id', estimateId)
        .single();

      if (
        !existingEstimate ||
        existingEstimate.customer_id !== context.userId
      ) {
        return {
          data: null,
          error: new Error('Access denied: Not your estimate'),
        };
      }
    } else if (context.role === 'TECH') {
      return { data: null, error: new Error('Techs cannot update estimates') };
    }

    const { data, error } = await context.supabase
      .from('estimates')
      .update(updates)
      .eq('id', estimateId)
      .eq('account_id', context.accountId)
      .select()
      .single();

    if (error) {
      console.error('Error updating estimate:', error);
      return { data: null, error: new Error('Failed to update estimate') };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error in updateEstimate:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete an estimate (admin only)
 */
export async function deleteEstimate(
  context: EstimateServiceContext,
  estimateId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // Only admins can delete estimates
    if (context.role !== 'OWNER' && context.role !== 'ADMIN') {
      return {
        success: false,
        error: new Error('Only admins can delete estimates'),
      };
    }

    const { error } = await context.supabase
      .from('estimates')
      .delete()
      .eq('id', estimateId)
      .eq('account_id', context.accountId);

    if (error) {
      console.error('Error deleting estimate:', error);
      return { success: false, error: new Error('Failed to delete estimate') };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error in deleteEstimate:', error);
    return { success: false, error: error as Error };
  }
}
