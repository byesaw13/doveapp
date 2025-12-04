import { supabase } from '@/lib/supabase';
import type {
  Property,
  PropertyWithClient,
  PropertyInsert,
  PropertyUpdate,
} from '@/types/property';
import { logPropertyAdded } from './activities';

/**
 * Get all properties for a client
 */
export async function getPropertiesByClient(
  clientId: string
): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching properties:', error);
    throw new Error('Failed to fetch properties');
  }

  return data || [];
}

/**
 * Get a single property by ID
 */
export async function getProperty(id: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching property:', error);
    return null;
  }

  return data;
}

/**
 * Get a property with client information
 */
export async function getPropertyWithClient(
  id: string
): Promise<PropertyWithClient | null> {
  const { data, error } = await supabase
    .from('properties')
    .select(
      `
      *,
      client:clients (
        id,
        first_name,
        last_name,
        company_name,
        email,
        phone
      )
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching property with client:', error);
    return null;
  }

  return data as unknown as PropertyWithClient;
}

/**
 * Create a new property
 */
export async function createProperty(
  property: PropertyInsert
): Promise<Property | null> {
  const { data, error } = await supabase
    .from('properties')
    .insert(property)
    .select()
    .single();

  if (error) {
    console.error('Error creating property:', error);
    throw new Error('Failed to create property');
  }

  if (data?.client_id) {
    try {
      await logPropertyAdded(
        data.client_id,
        data.id,
        data.name,
        data.city || undefined,
        data.state || undefined
      );
    } catch (activityError) {
      console.error('Failed to log property activity:', activityError);
    }
  }

  return data;
}

/**
 * Update an existing property
 */
export async function updateProperty(
  id: string,
  updates: PropertyUpdate
): Promise<Property | null> {
  const { data, error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating property:', error);
    throw new Error('Failed to update property');
  }

  return data;
}

/**
 * Delete a property
 */
export async function deleteProperty(id: string): Promise<boolean> {
  const { error } = await supabase.from('properties').delete().eq('id', id);

  if (error) {
    console.error('Error deleting property:', error);
    throw new Error('Failed to delete property');
  }

  return true;
}

/**
 * Search properties by name, address, or type
 */
export async function searchProperties(
  query: string
): Promise<PropertyWithClient[]> {
  const { data, error } = await supabase
    .from('properties')
    .select(
      `
      *,
      client:clients (
        id,
        first_name,
        last_name,
        company_name,
        email,
        phone
      )
    `
    )
    .or(
      `name.ilike.%${query}%,address_line1.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%,property_type.ilike.%${query}%`
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching properties:', error);
    throw new Error('Failed to search properties');
  }

  return (data as unknown as PropertyWithClient[]) || [];
}

/**
 * Get all properties (for admin purposes)
 */
export async function getAllProperties(): Promise<PropertyWithClient[]> {
  const { data, error } = await supabase
    .from('properties')
    .select(
      `
      *,
      client:clients (
        id,
        first_name,
        last_name,
        company_name,
        email,
        phone
      )
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all properties:', error);
    throw new Error('Failed to fetch all properties');
  }

  return (data as unknown as PropertyWithClient[]) || [];
}
