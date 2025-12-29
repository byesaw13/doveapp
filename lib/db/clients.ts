import { supabase } from '@/lib/supabase';
import type { Client, ClientInsert, ClientUpdate } from '@/types/client';

/**
 * Get all clients
 */
export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clients:', error);
    throw new Error('Failed to fetch clients');
  }

  return data || [];
}

/**
 * Get all clients with outstanding balance
 */
export async function getClientsWithOutstandingBalance(): Promise<
  (Client & { outstanding_balance: number })[]
> {
  // First get all clients
  const clients = await getClients();

  // Get outstanding balances for all clients in one query
  const clientIds = clients.map((c) => c.id);
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('client_id, balance_due, status')
    .in('client_id', clientIds)
    .neq('status', 'paid');

  if (error) {
    console.error('Error fetching outstanding balances:', error);
    // Return clients with 0 balance if query fails
    return clients.map((client) => ({ ...client, outstanding_balance: 0 }));
  }

  // Calculate balance per client
  const balanceMap = new Map<string, number>();
  invoices?.forEach((invoice) => {
    const current = balanceMap.get(invoice.client_id) || 0;
    balanceMap.set(invoice.client_id, current + (invoice.balance_due || 0));
  });

  return clients.map((client) => ({
    ...client,
    outstanding_balance: balanceMap.get(client.id) || 0,
  }));
}

/**
 * Get a single client by ID
 */
export async function getClient(id: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching client:', error);
    return null;
  }

  return data;
}

/**
 * Create a new client
 */
export async function createClient(
  client: ClientInsert & { account_id?: string; name?: string }
): Promise<Client | null> {
  // If account_id not provided, try to get from session (client-side)
  let accountId = client.account_id;
  if (!accountId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: membership } = await supabase
        .from('account_memberships')
        .select('account_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      accountId = membership?.account_id;
    }
  }

  if (!accountId) {
    throw new Error('No account found for current user');
  }

  // Map name to first_name and last_name
  let firstName = client.first_name;
  let lastName = client.last_name;
  if (client.name && (!firstName || !lastName)) {
    const parts = client.name.trim().split(/\s+/);
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || 'Unknown';
  }

  const clientData = {
    ...client,
    account_id: accountId,
    first_name: firstName,
    last_name: lastName,
  };

  const { data, error } = await supabase
    .from('clients')
    .insert(clientData)
    .select()
    .single();

  if (error) {
    console.error('Error creating client:', error);
    throw new Error(error?.message ?? JSON.stringify(error));
  }

  return data;
}

/**
 * Update an existing client
 */
export async function updateClient(
  id: string,
  updates: ClientUpdate
): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating client:', error);
    throw new Error('Failed to update client');
  }

  return data;
}

/**
 * Delete a client
 */
export async function deleteClient(id: string): Promise<boolean> {
  const { error } = await supabase.from('clients').delete().eq('id', id);

  if (error) {
    console.error('Error deleting client:', error);
    throw new Error('Failed to delete client');
  }

  return true;
}

/**
 * Search clients by name, email, or company
 */
export async function searchClients(query: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .or(
      `first_name.ilike.%${query}%,last_name.ilike.%${query}%,company_name.ilike.%${query}%,email.ilike.%${query}%`
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching clients:', error);
    throw new Error('Failed to search clients');
  }

  return data || [];
}

/**
 * Bulk insert clients (for Square import)
 */
export async function bulkInsertClients(
  clients: ClientInsert[]
): Promise<{ success: number; errors: string[] }> {
  const errors: string[] = [];
  let success = 0;

  for (const client of clients) {
    try {
      const { error } = await supabase.from('clients').insert(client);

      if (error) {
        errors.push(
          `Failed to import ${client.first_name} ${client.last_name}: ${error.message}`
        );
      } else {
        success++;
      }
    } catch (err) {
      errors.push(
        `Failed to import ${client.first_name} ${client.last_name}: ${err}`
      );
    }
  }

  return { success, errors };
}
