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
  client: ClientInsert
): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select()
    .single();

  if (error) {
    console.error('Error creating client:', error);
    throw new Error('Failed to create client');
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
