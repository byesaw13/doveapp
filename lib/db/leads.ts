import { supabase } from '@/lib/supabase';
import type { Lead, LeadActivity, LeadStats, LeadStatus } from '@/types/lead';

/**
 * Get all leads
 */
export async function getLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get lead by ID
 */
export async function getLead(id: string): Promise<Lead | null> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create new lead
 */
export async function createLead(
  lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>
): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .insert(lead)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update lead
 */
export async function updateLead(
  id: string,
  updates: Partial<Lead>
): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete lead
 */
export async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Convert lead to client
 */
export async function convertLeadToClient(
  leadId: string,
  clientId: string
): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .update({
      status: 'converted' as LeadStatus,
      converted_to_client_id: clientId,
    })
    .eq('id', leadId)
    .select()
    .single();

  if (error) throw error;

  // Add activity
  await createLeadActivity({
    lead_id: leadId,
    activity_type: 'status_change',
    description: `Lead converted to client`,
  });

  return data;
}

/**
 * Get leads by status
 */
export async function getLeadsByStatus(status: LeadStatus): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get leads needing follow-up
 */
export async function getLeadsForFollowUp(): Promise<Lead[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .lte('follow_up_date', today)
    .neq('status', 'converted')
    .neq('status', 'lost')
    .order('follow_up_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Create lead activity
 */
export async function createLeadActivity(
  activity: Omit<LeadActivity, 'id' | 'created_at'>
): Promise<LeadActivity> {
  const { data, error } = await supabase
    .from('lead_activities')
    .insert(activity)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get lead activities
 */
export async function getLeadActivities(
  leadId: string
): Promise<LeadActivity[]> {
  const { data, error } = await supabase
    .from('lead_activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get lead statistics
 */
export async function getLeadStats(): Promise<LeadStats> {
  const { data: leads, error } = await supabase.from('leads').select('*');

  if (error) throw error;

  const total_leads = leads?.length || 0;
  const new_leads = leads?.filter((l) => l.status === 'new').length || 0;
  const qualified_leads =
    leads?.filter((l) => l.status === 'qualified').length || 0;
  const converted_leads =
    leads?.filter((l) => l.status === 'converted').length || 0;
  const lost_leads = leads?.filter((l) => l.status === 'lost').length || 0;

  const conversion_rate =
    total_leads > 0 ? (converted_leads / total_leads) * 100 : 0;
  const total_estimated_value =
    leads?.reduce((sum, l) => sum + (l.estimated_value || 0), 0) || 0;

  // Calculate average time to conversion
  const convertedLeadsWithDates =
    leads?.filter((l) => l.status === 'converted' && l.created_at) || [];
  const avgDays =
    convertedLeadsWithDates.length > 0
      ? convertedLeadsWithDates.reduce((sum, l) => {
          const created = new Date(l.created_at);
          const updated = new Date(l.updated_at);
          return (
            sum +
            (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
          );
        }, 0) / convertedLeadsWithDates.length
      : 0;

  // Count by source
  const by_source =
    leads?.reduce(
      (acc, l) => {
        acc[l.source] = (acc[l.source] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) || {};

  // Count by status
  const by_status =
    leads?.reduce(
      (acc, l) => {
        acc[l.status] = (acc[l.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) || {};

  // Count by priority
  const by_priority =
    leads?.reduce(
      (acc, l) => {
        acc[l.priority] = (acc[l.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) || {};

  return {
    total_leads,
    new_leads,
    qualified_leads,
    converted_leads,
    lost_leads,
    conversion_rate,
    average_time_to_conversion: avgDays,
    total_estimated_value,
    by_source: by_source as any,
    by_status: by_status as any,
    by_priority: by_priority as any,
  };
}

/**
 * Search leads
 */
export async function searchLeads(query: string): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .or(
      `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,company_name.ilike.%${query}%`
    )
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
