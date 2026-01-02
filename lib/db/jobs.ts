import { supabase } from '@/lib/supabase';
import type {
  Job,
  JobWithClient,
  JobWithDetails,
  JobInsert,
  JobUpdate,
  LineItemInsert,
  JobStatus,
} from '@/types/job';
import {
  handleLineItemChange,
  handlePaymentChange,
  handleJobStatusChange,
} from '@/lib/job-automation';
import {
  logJobCreated,
  logJobCompleted,
  logJobStarted,
  logJobCancelled,
} from './activities';
import { scheduleJobCompletionAutomations } from '@/lib/db/automation_triggers';

/**
 * Get all jobs with client information
 */
export async function getJobs(): Promise<JobWithClient[]> {
  // Try with relationships first - specify the foreign key to use
  const { data, error } = await supabase
    .from('jobs')
    .select(
      `
      *,
      client:clients!jobs_client_id_fkey (
        id,
        first_name,
        last_name,
        email,
        phone
      )
    `
    )
    .order('created_at', { ascending: false });

  // If relationship error, fallback to simple query
  if (error && error.code === 'PGRST200') {
    console.warn(
      'Foreign key relationship not found for jobs-clients. Jobs will load without client details.'
    );
    const fallback = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (fallback.error) throw fallback.error;
    return (fallback.data || []) as JobWithClient[];
  }

  if (error) {
    console.error('Error fetching jobs:', error);
    throw error; // Throw error instead of returning empty array
  }

  return data || [];
}

/**
 * Get a single job with full details
 */
export async function getJob(id: string): Promise<JobWithDetails | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select(
      `
      *,
      line_items:job_line_items (*),
      client:clients!jobs_client_id_fkey (
        id,
        first_name,
        last_name,
        company_name,
        email,
        phone,
        address_line1,
        city,
        state,
        zip_code
      )
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching job:', error);
    return null;
  }

  return data as unknown as JobWithDetails;
}

/**
 * Create a new job
 */
export async function createJob(
  job: JobInsert,
  lineItems: LineItemInsert[]
): Promise<Job | null> {
  if (!job.account_id) {
    throw new Error('account_id is required to create a job');
  }

  // Generate job number
  const { data: jobNumberData } = await supabase.rpc('generate_job_number');
  const jobNumber = jobNumberData || 'JOB-00001';

  // Create job
  const { data: jobData, error: jobError } = await supabase
    .from('jobs')
    .insert({
      ...job,
      job_number: jobNumber,
    })
    .select()
    .single();

  if (jobError) {
    console.error('Error creating job:', jobError);
    throw new Error('Failed to create job');
  }

  // Create line items if any
  if (lineItems.length > 0) {
    const accountId = jobData.account_id || job.account_id;
    if (!accountId) {
      throw new Error('account_id is required to create job line items');
    }
    const itemsWithJobId = lineItems.map((item) => ({
      ...item,
      job_id: jobData.id,
      account_id: accountId,
      total: item.quantity * item.unit_price,
    }));

    const { error: itemsError } = await supabase
      .from('job_line_items')
      .insert(itemsWithJobId);

    if (itemsError) {
      console.error('Error creating line items:', itemsError);
      // Job created but items failed - should handle this
    }
  }

  // Recalculate totals
  await recalculateJobTotals(jobData.id);

  if (jobData.client_id) {
    try {
      await logJobCreated(
        jobData.client_id,
        jobData.id,
        jobData.title || jobData.job_number,
        jobData.total ?? 0
      );
    } catch (error) {
      console.error('Failed to log job creation activity:', error);
    }
  }

  return jobData;
}

/**
 * Update an existing job
 */
export async function updateJob(
  id: string,
  updates: JobUpdate
): Promise<Job | null> {
  // Get current job status before update (for automation and activity logging)
  const { data: currentJob } = await supabase
    .from('jobs')
    .select('status, client_id, title, job_number')
    .eq('id', id)
    .single();

  const { data, error } = await supabase
    .from('jobs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating job:', error);
    throw new Error('Failed to update job');
  }

  // Trigger automation if status changed
  if (currentJob && updates.status && currentJob.status !== updates.status) {
    const automationResult = await handleJobStatusChange(
      id,
      currentJob.status,
      updates.status
    );
    if (automationResult.actions.length > 0) {
      console.log('Job automation triggered:', automationResult.actions);
    }
    if (automationResult.errors && automationResult.errors.length > 0) {
      console.error('Job automation errors:', automationResult.errors);
    }

    if (data?.client_id) {
      const jobTitle = data.title || data.job_number;
      try {
        if (updates.status === 'in_progress') {
          await logJobStarted(data.client_id, data.id, jobTitle);
        } else if (updates.status === 'completed') {
          await logJobCompleted(data.client_id, data.id, jobTitle);
        } else if (updates.status === 'cancelled') {
          await logJobCancelled(
            data.client_id,
            data.id,
            jobTitle,
            updates.notes || undefined
          );
        }
      } catch (error) {
        console.error('Failed to log job status activity:', error);
      }
    }

    if (updates.status === 'completed') {
      try {
        await scheduleJobCompletionAutomations(id);
      } catch (automationError) {
        console.error(
          'Failed to schedule job completion automations:',
          automationError
        );
      }
    }
  }

  return data;
}

/**
 * Delete a job
 */
export async function deleteJob(id: string): Promise<boolean> {
  const { error } = await supabase.from('jobs').delete().eq('id', id);

  if (error) {
    console.error('Error deleting job:', error);
    throw new Error('Failed to delete job');
  }

  return true;
}

/**
 * Update job status
 */
export async function updateJobStatus(
  id: string,
  status: string
): Promise<Job | null> {
  return updateJob(id, { status } as JobUpdate);
}

/**
 * Recalculate job totals based on line items
 * Now uses automation system
 */
export async function recalculateJobTotals(
  jobId: string,
  taxRate: number = 0.0
): Promise<void> {
  // Use automation system to handle all calculations
  const result = await handleLineItemChange(jobId, taxRate);

  if (result.errors && result.errors.length > 0) {
    console.error('Error recalculating job totals:', result.errors);
    throw new Error('Failed to recalculate job totals');
  }
}

/**
 * Add line item to job
 */
export async function addLineItem(
  jobId: string,
  item: LineItemInsert,
  taxRate: number = 0.0
): Promise<void> {
  const { error } = await supabase.from('job_line_items').insert({
    ...item,
    job_id: jobId,
    total: item.quantity * item.unit_price,
  });

  if (error) {
    console.error('Error adding line item:', error);
    throw new Error('Failed to add line item');
  }

  await recalculateJobTotals(jobId, taxRate);
}

/**
 * Delete line item
 */
export async function deleteLineItem(
  itemId: string,
  jobId: string,
  taxRate: number = 0.0
): Promise<void> {
  const { error } = await supabase
    .from('job_line_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    console.error('Error deleting line item:', error);
    throw new Error('Failed to delete line item');
  }

  await recalculateJobTotals(jobId, taxRate);
}

/**
 * Update job payment amount
 * Triggers auto-update of payment status
 */
export async function updateJobPayment(
  jobId: string,
  amountPaid: number
): Promise<Job | null> {
  const { data, error } = await supabase
    .from('jobs')
    .update({
      amount_paid: amountPaid,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .select()
    .single();

  if (error) {
    console.error('Error updating job payment:', error);
    throw new Error('Failed to update job payment');
  }

  // Trigger automation to update payment status
  const automationResult = await handlePaymentChange(jobId);
  if (automationResult.actions.length > 0) {
    console.log('Payment automation triggered:', automationResult.actions);
  }
  if (automationResult.errors && automationResult.errors.length > 0) {
    console.error('Payment automation errors:', automationResult.errors);
  }

  return data;
}

/**
 * Get jobs for a specific client
 */
export async function getJobsByClient(
  clientId: string
): Promise<JobWithClient[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select(
      `
      *,
      client:clients!jobs_client_id_fkey (
        id,
        first_name,
        last_name,
        email,
        phone
      )
    `
    )
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client jobs:', error);
    throw new Error('Failed to fetch client jobs');
  }

  return data || [];
}

// ===== JOB TEMPLATES =====

export interface JobTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  estimated_duration_hours?: number;
  estimated_cost?: number;
  default_priority: string;
  is_active: boolean;
  title_template: string;
  description_template?: string;
  service_date_offset_days: number;
  default_line_items: any[];
  created_at: string;
  updated_at: string;
}

export interface JobTemplateInsert {
  name: string;
  description?: string;
  category?: string;
  estimated_duration_hours?: number;
  estimated_cost?: number;
  default_priority?: string;
  title_template: string;
  description_template?: string;
  service_date_offset_days?: number;
  default_line_items?: any[];
}

export interface LineItemData {
  item_type: 'labor' | 'material';
  description: string;
  quantity: number;
  unit_price: number;
}

/**
 * Get all active job templates
 */
export async function getJobTemplates(): Promise<JobTemplate[]> {
  const { data, error } = await supabase
    .from('job_templates')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching job templates:', error);
    throw new Error('Failed to fetch job templates');
  }

  return data || [];
}

/**
 * Get job template by ID
 */
export async function getJobTemplateById(
  id: string
): Promise<JobTemplate | null> {
  const { data, error } = await supabase
    .from('job_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching job template:', error);
    throw new Error('Failed to fetch job template');
  }

  return data;
}

/**
 * Create a new job template
 */
export async function createJobTemplate(
  template: JobTemplateInsert
): Promise<JobTemplate> {
  const { data, error } = await supabase
    .from('job_templates')
    .insert([template])
    .select()
    .single();

  if (error) {
    console.error('Error creating job template:', error);
    throw new Error('Failed to create job template');
  }

  return data;
}

/**
 * Update job template
 */
export async function updateJobTemplate(
  id: string,
  updates: Partial<JobTemplateInsert>
): Promise<JobTemplate> {
  const { data, error } = await supabase
    .from('job_templates')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating job template:', error);
    throw new Error('Failed to update job template');
  }

  return data;
}

/**
 * Delete job template (soft delete by setting is_active to false)
 */
export async function deleteJobTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('job_templates')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error deleting job template:', error);
    throw new Error('Failed to delete job template');
  }
}

/**
 * Record template usage
 */
export async function recordTemplateUsage(
  templateId: string,
  jobId: string,
  userId?: string
): Promise<void> {
  const { error } = await supabase.from('job_template_usage').insert([
    {
      template_id: templateId,
      job_id: jobId,
      used_by: userId,
    },
  ]);

  if (error) {
    console.error('Error recording template usage:', error);
    // Don't throw error for usage tracking failures
  }
}

/**
 * Create job from template
 */
export async function createJobFromTemplate(
  templateId: string,
  overrides: {
    client_id: string;
    property_id?: string;
    service_date?: string;
    scheduled_time?: string;
    notes?: string;
  },
  userId?: string
): Promise<Job> {
  // Get template
  const template = await getJobTemplateById(templateId);
  if (!template) {
    throw new Error('Job template not found');
  }

  // Generate title and description from template
  const title = template.title_template
    .replace('{client_name}', 'Client') // Will be updated after client lookup
    .replace('{date}', new Date().toLocaleDateString());

  const description = template.description_template || template.description;

  // Calculate service date
  const serviceDate = overrides.service_date
    ? new Date(overrides.service_date)
    : new Date(
        Date.now() + template.service_date_offset_days * 24 * 60 * 60 * 1000
      );

  // Prepare line items from template
  const lineItems: LineItemData[] =
    template.default_line_items?.map((item) => ({
      item_type: item.item_type,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })) || [];

  // Create job
  const jobData: JobInsert = {
    client_id: overrides.client_id,
    property_id: overrides.property_id,
    title,
    description,
    status: 'scheduled',
    service_date: serviceDate.toISOString().split('T')[0],
    scheduled_time: overrides.scheduled_time,
    notes: overrides.notes,
    subtotal: 0,
    tax: 0,
    total: 0,
  };

  const job = await createJob(jobData, lineItems as any);

  if (!job) {
    throw new Error('Failed to create job from template');
  }

  // Record template usage
  await recordTemplateUsage(templateId, job.id, userId);

  return job;
}

/**
 * Create a job from an approved estimate
 */
export async function createJobFromEstimate(estimateId: string): Promise<Job> {
  // Import here to avoid circular dependency
  const { getEstimate } = await import('./estimates');

  const estimate = await getEstimate(estimateId);
  if (!estimate) {
    throw new Error('Estimate not found');
  }

  if (estimate.status !== 'approved') {
    throw new Error('Estimate must be approved to create a job');
  }

  if (!estimate.account_id) {
    throw new Error('Estimate is missing account context');
  }

  // Create job data
  const jobData = {
    client_id: estimate.client_id || '',
    account_id: estimate.account_id,
    estimate_id: estimateId,
    title: estimate.title,
    description: estimate.description,
    status: 'quote' as const,
    subtotal: estimate.subtotal,
    tax: 0,
    total: estimate.total,
  };

  // Create line items from estimate line items
  const lineItems = (estimate.line_items || []).map((item: any) => ({
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: item.total,
    item_type: 'labor' as const,
    service_id: item.serviceId,
    tier: item.tier,
  }));

  const job = await createJob(jobData, lineItems as any);

  if (!job) {
    throw new Error('Failed to create job from estimate');
  }

  try {
    await supabase.from('job_notes').insert({
      job_id: job.id,
      technician_id: null,
      note: 'Job created from approved estimate',
      account_id: estimate.account_id,
    });
  } catch (error) {
    console.error('Failed to log job creation note:', error);
  }

  // Update estimate with job reference
  const { updateEstimate } = await import('./estimates');
  await updateEstimate(estimateId, {
    converted_to_job_id: job.id,
  });

  return job;
}

/**
 * Get a single job with full details including estimate and line items
 */
export async function getJobByIdWithRelations(
  jobId: string
): Promise<JobWithDetails | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select(
      `
      *,
      client:clients!jobs_client_id_fkey (
        id,
        first_name,
        last_name,
        email,
        phone
      ),
      estimate:estimates (
        id,
        estimate_number,
        title,
        status
      ),
      job_line_items (*)
    `
    )
    .eq('id', jobId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching job with relations:', error);
    throw new Error('Failed to fetch job');
  }

  return data;
}

/**
 * List jobs with filters
 */
export async function listJobsWithFilters(filters: {
  status?: JobStatus | 'all';
  search?: string;
}): Promise<JobWithClient[]> {
  let query = supabase
    .from('jobs')
    .select(
      `
      *,
      client:clients!jobs_client_id_fkey (
        id,
        first_name,
        last_name,
        email,
        phone
      )
    `
    )
    .order('created_at', { ascending: false });

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.search) {
    // Search by job number or client name
    query = query.or(
      `job_number.ilike.%${filters.search}%,client.first_name.ilike.%${filters.search}%,client.last_name.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching jobs with filters:', error);
    throw new Error('Failed to fetch jobs');
  }

  return data || [];
}

/**
 * List jobs with advanced filters
 */
export async function listJobsWithAdvancedFilters(filters: {
  status?: JobStatus | 'all';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  statuses?: string[];
  clientIds?: string[];
}): Promise<JobWithClient[]> {
  let query = supabase
    .from('jobs')
    .select(
      `
      *,
      client:clients!jobs_client_id_fkey (
        id,
        first_name,
        last_name,
        email,
        phone
      )
    `
    )
    .order('created_at', { ascending: false });

  // Basic filters
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.search) {
    // Search by job number or client name
    query = query.or(
      `job_number.ilike.%${filters.search}%,client.first_name.ilike.%${filters.search}%,client.last_name.ilike.%${filters.search}%`
    );
  }

  // Advanced filters
  if (filters.dateFrom) {
    query = query.gte('service_date', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('service_date', filters.dateTo);
  }

  if (filters.minAmount !== undefined) {
    query = query.gte('total', filters.minAmount);
  }

  if (filters.maxAmount !== undefined) {
    query = query.lte('total', filters.maxAmount);
  }

  if (filters.statuses && filters.statuses.length > 0) {
    query = query.in('status', filters.statuses);
  }

  if (filters.clientIds && filters.clientIds.length > 0) {
    query = query.in('client_id', filters.clientIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching jobs with advanced filters:', error);
    throw new Error('Failed to fetch jobs');
  }

  return data || [];
}

/**
 * Update job scheduling
 */
export async function updateJobScheduling(
  jobId: string,
  updates: { scheduledFor: string | null }
): Promise<void> {
  const { error } = await supabase
    .from('jobs')
    .update({
      scheduled_for: updates.scheduledFor,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) {
    console.error('Error updating job scheduling:', error);
    throw new Error('Failed to update job scheduling');
  }
}

/**
 * Update job notes
 */
export async function updateJobNotes(
  jobId: string,
  updates: { internalNotes?: string; clientNotes?: string }
): Promise<void> {
  const { error } = await supabase
    .from('jobs')
    .update({
      internal_notes: updates.internalNotes,
      client_notes: updates.clientNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (error) {
    console.error('Error updating job notes:', error);
    throw new Error('Failed to update job notes');
  }
}

/**
 * Update job status with validation and business logic
 */
export async function updateJobStatusWithValidation(
  jobId: string,
  newStatus: JobStatus
): Promise<void> {
  // Get current job to validate transition
  const job = await getJobById(jobId);
  if (!job) {
    throw new Error('Job not found');
  }

  // Validate status transitions
  const validTransitions: Record<JobStatus, JobStatus[]> = {
    draft: ['scheduled', 'cancelled'],
    quote: ['scheduled', 'cancelled'],
    scheduled: ['in_progress', 'cancelled'],
    in_progress: ['completed'],
    completed: [], // Terminal state
    invoiced: [], // Terminal state
    cancelled: [], // Terminal state
  };

  if (!validTransitions[job.status]?.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${job.status} to ${newStatus}`
    );
  }

  const updates: any = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  // If completing job, mark as ready for invoice
  if (newStatus === 'completed') {
    updates.ready_for_invoice = true;
  }

  const { error } = await supabase.from('jobs').update(updates).eq('id', jobId);

  if (error) {
    console.error('Error updating job status:', error);
    throw new Error('Failed to update job status');
  }

  // Log status change activity
  if (job.client_id) {
    const jobTitle = job.title || job.job_number;
    try {
      switch (newStatus) {
        case 'in_progress':
          await logJobStarted(job.client_id, jobId, jobTitle);
          break;
        case 'completed':
          await logJobCompleted(job.client_id, jobId, jobTitle);
          break;
        case 'cancelled':
          await logJobCancelled(job.client_id, jobId, jobTitle);
          break;
      }
    } catch (activityError) {
      // Don't fail the status update if activity logging fails
      console.warn('Failed to log job activity:', activityError);
    }
  }

  if (newStatus === 'completed') {
    try {
      await scheduleJobCompletionAutomations(jobId);
    } catch (automationError) {
      console.error(
        'Failed to schedule job completion automations:',
        automationError
      );
    }
  }
}

/**
 * Get job by ID - helper function used by other functions
 */
export async function getJobById(jobId: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching job:', error);
    throw new Error('Failed to fetch job');
  }

  return data;
}

/**
 * Checklist item interface
 */
export interface ChecklistItem {
  id: string;
  job_id: string;
  item_text: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItemInsert {
  job_id: string;
  item_text: string;
  sort_order?: number;
}

/**
 * Get checklist items for a job
 */
export async function getJobChecklistItems(
  jobId: string
): Promise<ChecklistItem[]> {
  const { data, error } = await supabase
    .from('job_checklist_items')
    .select('*')
    .eq('job_id', jobId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching checklist items:', error);
    throw new Error('Failed to fetch checklist items');
  }

  return data || [];
}

/**
 * Add checklist item to job
 */
export async function addChecklistItem(
  item: ChecklistItemInsert
): Promise<ChecklistItem> {
  const { data, error } = await supabase
    .from('job_checklist_items')
    .insert({
      ...item,
      sort_order: item.sort_order || 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding checklist item:', error);
    throw new Error('Failed to add checklist item');
  }

  return data;
}

/**
 * Update checklist item
 */
export async function updateChecklistItem(
  itemId: string,
  updates: { item_text?: string; is_completed?: boolean; sort_order?: number }
): Promise<void> {
  const { error } = await supabase
    .from('job_checklist_items')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId);

  if (error) {
    console.error('Error updating checklist item:', error);
    throw new Error('Failed to update checklist item');
  }
}

/**
 * Delete checklist item
 */
export async function deleteChecklistItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('job_checklist_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    console.error('Error deleting checklist item:', error);
    throw new Error('Failed to delete checklist item');
  }
}

/**
 * Toggle checklist item completion
 */
export async function toggleChecklistItem(itemId: string): Promise<void> {
  // First get current state
  const { data: item, error: fetchError } = await supabase
    .from('job_checklist_items')
    .select('is_completed')
    .eq('id', itemId)
    .single();

  if (fetchError || !item) {
    throw new Error('Checklist item not found');
  }

  // Toggle the state
  const { error } = await supabase
    .from('job_checklist_items')
    .update({
      is_completed: !item.is_completed,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId);

  if (error) {
    console.error('Error toggling checklist item:', error);
    throw new Error('Failed to toggle checklist item');
  }
}
