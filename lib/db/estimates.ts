import { supabase } from '@/lib/supabase';
import type {
  Estimate,
  EstimateTemplate,
  EstimateStats,
  EstimateWithRelations,
  EstimateStatus,
} from '@/types/estimate';
import {
  logEstimateSent,
  logEstimateAccepted,
  logEstimateDeclined,
} from './activities';

/**
 * Get all estimates
 */
export async function getEstimates(): Promise<EstimateWithRelations[]> {
  // Try with relationships first
  let { data, error } = await supabase
    .from('estimates')
    .select(
      `
      *,
      lead:leads(id, first_name, last_name, email, phone),
      client:clients(id, first_name, last_name, company_name, email, phone)
    `
    )
    .order('created_at', { ascending: false });

  // If relationship error, fallback to simple query
  if (error && error.code === 'PGRST200') {
    console.warn(
      'Foreign key relationship not found. Run migration 025_ensure_estimates_leads_relationship.sql'
    );
    const fallback = await supabase
      .from('estimates')
      .select('*')
      .order('created_at', { ascending: false });

    if (fallback.error) throw fallback.error;
    return (fallback.data || []) as EstimateWithRelations[];
  }

  if (error) throw error;
  return data || [];
}

/**
 * Get estimate by ID
 */
export async function getEstimate(
  id: string
): Promise<EstimateWithRelations | null> {
  let { data, error } = await supabase
    .from('estimates')
    .select(
      `
      *,
      lead:leads(id, first_name, last_name, email, phone),
      client:clients(id, first_name, last_name, company_name, email, phone)
    `
    )
    .eq('id', id)
    .single();

  // If relationship error, fallback to simple query
  if (error && error.code === 'PGRST200') {
    const fallback = await supabase
      .from('estimates')
      .select('*')
      .eq('id', id)
      .single();

    if (fallback.error) throw fallback.error;
    return (fallback.data || null) as EstimateWithRelations | null;
  }

  if (error) throw error;
  return data;
}

/**
 * Create new estimate
 */
export async function createEstimate(
  estimate: Omit<
    Estimate,
    'id' | 'estimate_number' | 'created_at' | 'updated_at'
  >
): Promise<Estimate> {
  const { data, error } = await supabase
    .from('estimates')
    .insert(estimate)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update estimate
 */
export async function updateEstimate(
  id: string,
  updates: Partial<Estimate>
): Promise<Estimate> {
  const { data, error } = await supabase
    .from('estimates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete estimate
 */
export async function deleteEstimate(id: string): Promise<void> {
  const { error } = await supabase.from('estimates').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Send estimate
 */
export async function sendEstimate(id: string): Promise<Estimate> {
  const { data, error } = await supabase
    .from('estimates')
    .update({
      status: 'sent' as EstimateStatus,
      sent_date: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (data?.client_id) {
    try {
      await logEstimateSent(
        data.client_id,
        data.id,
        data.estimate_number,
        data.total ?? 0
      );
    } catch (activityError) {
      console.error('Failed to log estimate sent activity:', activityError);
    }
  }

  return data;
}

/**
 * Mark estimate as viewed
 */
export async function markEstimateViewed(id: string): Promise<Estimate> {
  const { data, error } = await supabase
    .from('estimates')
    .update({
      status: 'viewed' as EstimateStatus,
      viewed_date: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Accept estimate
 */
export async function acceptEstimate(id: string): Promise<Estimate> {
  const { data, error } = await supabase
    .from('estimates')
    .update({
      status: 'accepted' as EstimateStatus,
      accepted_date: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (data?.client_id) {
    try {
      await logEstimateAccepted(
        data.client_id,
        data.id,
        data.estimate_number,
        data.total ?? 0
      );
    } catch (activityError) {
      console.error('Failed to log estimate accepted activity:', activityError);
    }
  }

  return data;
}

/**
 * Decline estimate
 */
export async function declineEstimate(
  id: string,
  reason?: string
): Promise<Estimate> {
  const { data, error } = await supabase
    .from('estimates')
    .update({
      status: 'declined' as EstimateStatus,
      declined_date: new Date().toISOString(),
      decline_reason: reason,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (data?.client_id) {
    try {
      await logEstimateDeclined(
        data.client_id,
        data.id,
        data.estimate_number,
        reason
      );
    } catch (activityError) {
      console.error('Failed to log estimate declined activity:', activityError);
    }
  }

  return data;
}

/**
 * Convert estimate to job
 */
export async function convertEstimateToJob(
  estimateId: string,
  jobId: string
): Promise<Estimate> {
  const { data, error } = await supabase
    .from('estimates')
    .update({
      status: 'accepted' as EstimateStatus,
      converted_to_job_id: jobId,
      accepted_date: new Date().toISOString(),
    })
    .eq('id', estimateId)
    .select()
    .single();

  if (error) throw error;

  if (data?.client_id) {
    try {
      await logEstimateAccepted(
        data.client_id,
        data.id,
        data.estimate_number,
        data.total ?? 0
      );
    } catch (activityError) {
      console.error(
        'Failed to log estimate conversion activity:',
        activityError
      );
    }
  }

  return data;
}

/**
 * Get estimates by status
 */
export async function getEstimatesByStatus(
  status: EstimateStatus
): Promise<EstimateWithRelations[]> {
  const { data, error } = await supabase
    .from('estimates')
    .select(
      `
      *,
      lead:leads(id, first_name, last_name, email, phone),
      client:clients(id, first_name, last_name, company_name, email, phone)
    `
    )
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get expired estimates
 */
export async function getExpiredEstimates(): Promise<EstimateWithRelations[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('estimates')
    .select(
      `
      *,
      lead:leads(id, first_name, last_name, email, phone),
      client:clients(id, first_name, last_name, company_name, email, phone)
    `
    )
    .lt('valid_until', today)
    .in('status', ['draft', 'sent', 'viewed'])
    .order('valid_until', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get estimate statistics
 */
export async function getEstimateStats(): Promise<EstimateStats> {
  const { data: estimates, error } = await supabase
    .from('estimates')
    .select('*');

  if (error) throw error;

  const total_estimates = estimates?.length || 0;
  const draft_estimates =
    estimates?.filter((e) => e.status === 'draft').length || 0;
  const sent_estimates =
    estimates?.filter((e) => e.status === 'sent').length || 0;
  const accepted_estimates =
    estimates?.filter((e) => e.status === 'accepted').length || 0;
  const declined_estimates =
    estimates?.filter((e) => e.status === 'declined').length || 0;

  const sentOrBeyond = estimates?.filter((e) =>
    ['sent', 'viewed', 'accepted', 'declined'].includes(e.status)
  );
  const acceptance_rate =
    sentOrBeyond && sentOrBeyond.length > 0
      ? (accepted_estimates / sentOrBeyond.length) * 100
      : 0;

  const total_value =
    estimates?.reduce((sum, e) => sum + Number(e.total), 0) || 0;
  const accepted_value =
    estimates
      ?.filter((e) => e.status === 'accepted')
      .reduce((sum, e) => sum + Number(e.total), 0) || 0;

  const average_estimate_value =
    total_estimates > 0 ? total_value / total_estimates : 0;

  // Calculate average time to acceptance
  const acceptedWithDates =
    estimates?.filter(
      (e) => e.status === 'accepted' && e.sent_date && e.accepted_date
    ) || [];
  const avgDays =
    acceptedWithDates.length > 0
      ? acceptedWithDates.reduce((sum, e) => {
          const sent = new Date(e.sent_date!);
          const accepted = new Date(e.accepted_date!);
          return (
            sum + (accepted.getTime() - sent.getTime()) / (1000 * 60 * 60 * 24)
          );
        }, 0) / acceptedWithDates.length
      : 0;

  // Count by status
  const by_status =
    estimates?.reduce(
      (acc, e) => {
        acc[e.status] = (acc[e.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) || {};

  return {
    total_estimates,
    draft_estimates,
    sent_estimates,
    accepted_estimates,
    declined_estimates,
    acceptance_rate,
    total_value,
    accepted_value,
    average_estimate_value,
    average_time_to_acceptance: avgDays,
    by_status: by_status as any,
  };
}

/**
 * Get estimate templates
 */
export async function getEstimateTemplates(): Promise<EstimateTemplate[]> {
  const { data, error } = await supabase
    .from('estimate_templates')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get estimate template by ID
 */
export async function getEstimateTemplate(
  id: string
): Promise<EstimateTemplate | null> {
  const { data, error } = await supabase
    .from('estimate_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create estimate template
 */
export async function createEstimateTemplate(
  template: Omit<EstimateTemplate, 'id' | 'created_at' | 'updated_at'>
): Promise<EstimateTemplate> {
  const { data, error } = await supabase
    .from('estimate_templates')
    .insert(template)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update estimate template
 */
export async function updateEstimateTemplate(
  id: string,
  updates: Partial<EstimateTemplate>
): Promise<EstimateTemplate> {
  const { data, error } = await supabase
    .from('estimate_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete estimate template
 */
export async function deleteEstimateTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('estimate_templates')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/**
 * Create estimate from template
 */
export async function createEstimateFromTemplate(
  templateId: string,
  estimateData: {
    lead_id?: string;
    client_id?: string;
    property_id?: string;
    title: string;
  }
): Promise<Estimate> {
  const template = await getEstimateTemplate(templateId);
  if (!template) throw new Error('Template not found');

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + template.default_valid_days);

  const estimate: Omit<
    Estimate,
    'id' | 'estimate_number' | 'created_at' | 'updated_at'
  > = {
    ...estimateData,
    description: template.description || '',
    status: 'draft',
    line_items: template.default_line_items,
    subtotal: 0,
    tax_rate: 0,
    tax_amount: 0,
    discount_amount: 0,
    total: 0,
    valid_until: validUntil.toISOString().split('T')[0],
    terms_and_conditions: template.default_terms,
    payment_terms: template.default_payment_terms,
  };

  return createEstimate(estimate);
}

/**
 * Search estimates
 */
export async function searchEstimates(
  query: string
): Promise<EstimateWithRelations[]> {
  const { data, error } = await supabase
    .from('estimates')
    .select(
      `
      *,
      lead:leads(id, first_name, last_name, email, phone),
      client:clients(id, first_name, last_name, company_name, email, phone)
    `
    )
    .or(`estimate_number.ilike.%${query}%,title.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
