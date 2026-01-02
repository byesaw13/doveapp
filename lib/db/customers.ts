import { supabase } from '@/lib/supabase';
import type {
  Customer,
  CustomerInsert,
  CustomerUpdate,
} from '@/types/customer';

/**
 * Get all customers
 */
export async function getAllCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching customers:', error);
    throw new Error('Failed to fetch customers');
  }

  return data || [];
}

/**
 * Get a single customer by ID
 */
export async function getCustomer(id: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching customer:', error);
    return null;
  }

  return data;
}

/**
 * Create a new customer
 */
export async function createCustomer(
  customer: CustomerInsert
): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .insert(customer)
    .select()
    .single();

  if (error) {
    console.error('Error creating customer:', error);
    throw new Error('Failed to create customer');
  }

  return data;
}

/**
 * Update an existing customer
 */
export async function updateCustomer(
  id: string,
  updates: CustomerUpdate
): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating customer:', error);
    throw new Error('Failed to update customer');
  }

  return data;
}

/**
 * Delete a customer
 */
export async function deleteCustomer(id: string): Promise<boolean> {
  const { error } = await supabase.from('customers').delete().eq('id', id);

  if (error) {
    console.error('Error deleting customer:', error);
    throw new Error('Failed to delete customer');
  }

  return true;
}

/**
 * Search customers by name or email
 */
export async function searchCustomers(query: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(
      `name.ilike.%${query}%,email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching customers:', error);
    throw new Error('Failed to search customers');
  }

  return data || [];
}
