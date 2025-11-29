import { supabase } from '@/lib/supabase';
import type {
  Job,
  JobWithClient,
  JobWithDetails,
  JobInsert,
  JobUpdate,
  LineItemInsert,
} from '@/types/job';
import {
  handleLineItemChange,
  handlePaymentChange,
  handleJobStatusChange,
} from '@/lib/job-automation';

/**
 * Get all jobs with client information
 */
export async function getJobs(): Promise<JobWithClient[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select(
      `
      *,
      client:clients (
        id,
        first_name,
        last_name,
        email,
        phone
      )
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching jobs:', error);
    throw new Error('Failed to fetch jobs');
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
      client:clients (
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
    const itemsWithJobId = lineItems.map((item) => ({
      ...item,
      job_id: jobData.id,
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

  return jobData;
}

/**
 * Update an existing job
 */
export async function updateJob(
  id: string,
  updates: JobUpdate
): Promise<Job | null> {
  // Get current job status before update (for automation)
  const { data: currentJob } = await supabase
    .from('jobs')
    .select('status')
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
      client:clients (
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
