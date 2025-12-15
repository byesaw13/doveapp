import { SupabaseClient } from '@supabase/supabase-js';
import type { Client, ClientInsert, ClientUpdate } from '@/types/client';

export interface ClientServiceContext {
  accountId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'TECH' | 'CUSTOMER';
  supabase: SupabaseClient;
}

export interface ClientFilters {
  search?: string;
}

/**
 * List clients with portal-aware filtering and access control
 */
export async function listClients(
  context: ClientServiceContext,
  filters: ClientFilters = {}
): Promise<{ data: Client[] | null; error: Error | null }> {
  try {
    // Only admins and techs can list all clients
    if (context.role === 'CUSTOMER') {
      return { data: null, error: new Error('Customers cannot list clients') };
    }

    let query = context.supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    // Enforce tenant scoping
    query = query.eq('account_id', context.accountId);

    if (filters.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching clients:', error);
      return { data: null, error: new Error('Failed to fetch clients') };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Unexpected error in listClients:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get a single client by ID with access control
 */
export async function getClientById(
  context: ClientServiceContext,
  clientId: string
): Promise<{ data: Client | null; error: Error | null }> {
  try {
    // Only admins and techs can view client details
    if (context.role === 'CUSTOMER') {
      return {
        data: null,
        error: new Error('Customers cannot view client details'),
      };
    }

    const { data, error } = await context.supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('account_id', context.accountId) // Enabled after backfill
      .single();

    if (error) {
      console.error('Error fetching client:', error);
      return { data: null, error: new Error('Failed to fetch client') };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error in getClientById:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Create a new client (admin only)
 */
export async function createClient(
  context: ClientServiceContext,
  clientData: ClientInsert
): Promise<{ data: Client | null; error: Error | null }> {
  try {
    // Only admins can create clients
    if (context.role !== 'OWNER' && context.role !== 'ADMIN') {
      return { data: null, error: new Error('Only admins can create clients') };
    }

    // Add account_id to client data
    const dataWithContext = {
      ...clientData,
      account_id: context.accountId,
    };

    const { data, error } = await context.supabase
      .from('clients')
      .insert(dataWithContext)
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      return { data: null, error: new Error('Failed to create client') };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error in createClient:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update a client (admin only)
 */
export async function updateClient(
  context: ClientServiceContext,
  clientId: string,
  updates: ClientUpdate
): Promise<{ data: Client | null; error: Error | null }> {
  try {
    // Only admins can update clients
    if (context.role !== 'OWNER' && context.role !== 'ADMIN') {
      return { data: null, error: new Error('Only admins can update clients') };
    }

    const { data, error } = await context.supabase
      .from('clients')
      .update({ ...updates, account_id: context.accountId })
      .eq('id', clientId)
      .eq('account_id', context.accountId)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      return { data: null, error: new Error('Failed to update client') };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error in updateClient:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a client (admin only)
 */
export async function deleteClient(
  context: ClientServiceContext,
  clientId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // Only admins can delete clients
    if (context.role !== 'OWNER' && context.role !== 'ADMIN') {
      return {
        success: false,
        error: new Error('Only admins can delete clients'),
      };
    }

    const { error } = await context.supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('account_id', context.accountId);

    if (error) {
      console.error('Error deleting client:', error);
      return { success: false, error: new Error('Failed to delete client') };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error in deleteClient:', error);
    return { success: false, error: error as Error };
  }
}
