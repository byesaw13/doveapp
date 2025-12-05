/**
 * Job Lifecycle Automation
 * Handles automatic actions when job status or data changes
 */

import { supabase } from '@/lib/supabase';
import type { JobStatus } from '@/types/job';
import { createPostJobWorkflow } from './db/activities';

export interface JobAutomationResult {
  success: boolean;
  actions: string[];
  errors?: string[];
}

/**
 * Auto-calculate job totals from line items
 */
export async function autoCalculateJobTotals(
  jobId: string,
  taxRate: number = 0.0
): Promise<JobAutomationResult> {
  const actions: string[] = [];
  const errors: string[] = [];

  try {
    // Get all line items for the job
    const { data: items, error: itemsError } = await supabase
      .from('job_line_items')
      .select('total')
      .eq('job_id', jobId);

    if (itemsError) {
      errors.push(`Failed to fetch line items: ${itemsError.message}`);
      return { success: false, actions, errors };
    }

    // Calculate subtotal
    const subtotal = (items || []).reduce(
      (sum, item) => sum + parseFloat(item.total.toString()),
      0
    );

    // Calculate tax
    const tax = subtotal * taxRate;

    // Calculate total
    const total = subtotal + tax;

    // Update job with calculated values
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        subtotal,
        tax,
        total,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (updateError) {
      errors.push(`Failed to update job totals: ${updateError.message}`);
      return { success: false, actions, errors };
    }

    actions.push(
      `Calculated totals: subtotal=$${subtotal.toFixed(2)}, tax=$${tax.toFixed(2)}, total=$${total.toFixed(2)}`
    );

    return { success: true, actions, errors };
  } catch (error) {
    errors.push(`Unexpected error: ${error}`);
    return { success: false, actions, errors };
  }
}

/**
 * Auto-update payment status based on amount_paid vs total
 */
export async function autoUpdatePaymentStatus(
  jobId: string
): Promise<JobAutomationResult> {
  const actions: string[] = [];
  const errors: string[] = [];

  try {
    // Get current job data
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('total, amount_paid, payment_status')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      errors.push(
        `Failed to fetch job: ${jobError?.message || 'Job not found'}`
      );
      return { success: false, actions, errors };
    }

    const total = parseFloat(job.total.toString());
    const amountPaid = parseFloat(job.amount_paid.toString());

    // Determine new payment status
    let newPaymentStatus: 'unpaid' | 'partial' | 'paid';

    if (amountPaid === 0) {
      newPaymentStatus = 'unpaid';
    } else if (amountPaid >= total) {
      newPaymentStatus = 'paid';
    } else {
      newPaymentStatus = 'partial';
    }

    // Only update if status changed
    if (newPaymentStatus !== job.payment_status) {
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          payment_status: newPaymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (updateError) {
        errors.push(`Failed to update payment status: ${updateError.message}`);
        return { success: false, actions, errors };
      }

      actions.push(
        `Updated payment status: ${job.payment_status} → ${newPaymentStatus} (paid $${amountPaid.toFixed(2)} of $${total.toFixed(2)})`
      );
    } else {
      actions.push(`Payment status unchanged: ${newPaymentStatus}`);
    }

    return { success: true, actions, errors };
  } catch (error) {
    errors.push(`Unexpected error: ${error}`);
    return { success: false, actions, errors };
  }
}

/**
 * Auto-convert quote to scheduled job
 */
export async function autoConvertQuoteToScheduled(
  jobId: string,
  serviceDate?: string,
  scheduledTime?: string
): Promise<JobAutomationResult> {
  const actions: string[] = [];
  const errors: string[] = [];

  try {
    // Verify job is a quote
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('status, job_number')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      errors.push(
        `Failed to fetch job: ${jobError?.message || 'Job not found'}`
      );
      return { success: false, actions, errors };
    }

    if (job.status !== 'quote') {
      errors.push(
        `Job ${job.job_number} is not a quote (current status: ${job.status})`
      );
      return { success: false, actions, errors };
    }

    // Update to scheduled
    const updateData: any = {
      status: 'scheduled',
      updated_at: new Date().toISOString(),
    };

    if (serviceDate) {
      updateData.service_date = serviceDate;
    }

    if (scheduledTime) {
      updateData.scheduled_time = scheduledTime;
    }

    const { error: updateError } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', jobId);

    if (updateError) {
      errors.push(`Failed to convert quote: ${updateError.message}`);
      return { success: false, actions, errors };
    }

    actions.push(`Converted quote ${job.job_number} to scheduled job`);
    if (serviceDate) {
      actions.push(`Set service date: ${serviceDate}`);
    }
    if (scheduledTime) {
      actions.push(`Set scheduled time: ${scheduledTime}`);
    }

    return { success: true, actions, errors };
  } catch (error) {
    errors.push(`Unexpected error: ${error}`);
    return { success: false, actions, errors };
  }
}

/**
 * Auto-generate invoice when job completed
 */
export async function autoGenerateInvoice(
  jobId: string
): Promise<JobAutomationResult> {
  const actions: string[] = [];
  const errors: string[] = [];

  try {
    // Get job data
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('status, job_number, total, payment_status')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      errors.push(
        `Failed to fetch job: ${jobError?.message || 'Job not found'}`
      );
      return { success: false, actions, errors };
    }

    // Only auto-invoice if job is completed and not already invoiced
    if (job.status !== 'completed') {
      errors.push(
        `Job ${job.job_number} is not completed (current status: ${job.status})`
      );
      return { success: false, actions, errors };
    }

    // Update status to invoiced
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        status: 'invoiced',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (updateError) {
      errors.push(`Failed to generate invoice: ${updateError.message}`);
      return { success: false, actions, errors };
    }

    actions.push(`Generated invoice for job ${job.job_number}`);
    actions.push(
      `Invoice total: $${parseFloat(job.total.toString()).toFixed(2)}`
    );
    actions.push(`Payment status: ${job.payment_status}`);

    return { success: true, actions, errors };
  } catch (error) {
    errors.push(`Unexpected error: ${error}`);
    return { success: false, actions, errors };
  }
}

/**
 * Handle job status change automation
 * This is the main orchestrator that triggers appropriate actions
 */
export async function handleJobStatusChange(
  jobId: string,
  oldStatus: JobStatus,
  newStatus: JobStatus
): Promise<JobAutomationResult> {
  const actions: string[] = [];
  const errors: string[] = [];

  actions.push(`Job status changed: ${oldStatus} → ${newStatus}`);

  try {
    // When job is completed, auto-generate invoice and create workflow tasks
    if (newStatus === 'completed' && oldStatus !== 'completed') {
      const invoiceResult = await autoGenerateInvoice(jobId);
      actions.push(...invoiceResult.actions);
      if (invoiceResult.errors) {
        errors.push(...invoiceResult.errors);
      }

      // Create post-job workflow tasks (follow-ups, surveys, maintenance)
      try {
        await createPostJobWorkflow(jobId);
        actions.push(
          'Created post-job workflow tasks (follow-up calls, surveys, maintenance scheduling)'
        );
      } catch (workflowError) {
        errors.push(`Failed to create workflow tasks: ${workflowError}`);
      }
    }

    return { success: errors.length === 0, actions, errors };
  } catch (error) {
    errors.push(`Unexpected error in status change handler: ${error}`);
    return { success: false, actions, errors };
  }
}

/**
 * Handle line item changes
 * Auto-recalculate totals and update payment status
 */
export async function handleLineItemChange(
  jobId: string,
  taxRate: number = 0.0
): Promise<JobAutomationResult> {
  const actions: string[] = [];
  const errors: string[] = [];

  try {
    // Auto-calculate totals
    const totalsResult = await autoCalculateJobTotals(jobId, taxRate);
    actions.push(...totalsResult.actions);
    if (totalsResult.errors) {
      errors.push(...totalsResult.errors);
    }

    // Auto-update payment status
    const paymentResult = await autoUpdatePaymentStatus(jobId);
    actions.push(...paymentResult.actions);
    if (paymentResult.errors) {
      errors.push(...paymentResult.errors);
    }

    return { success: errors.length === 0, actions, errors };
  } catch (error) {
    errors.push(`Unexpected error in line item handler: ${error}`);
    return { success: false, actions, errors };
  }
}

/**
 * Handle payment amount change
 * Auto-update payment status
 */
export async function handlePaymentChange(
  jobId: string
): Promise<JobAutomationResult> {
  return autoUpdatePaymentStatus(jobId);
}

/**
 * Get job automation suggestions
 * Returns suggestions for manual actions user can take
 */
export async function getJobAutomationSuggestions(
  jobId: string
): Promise<string[]> {
  const suggestions: string[] = [];

  try {
    const { data: job, error } = await supabase
      .from('jobs')
      .select('status, service_date, payment_status, total, amount_paid')
      .eq('id', jobId)
      .single();

    if (error || !job) {
      return suggestions;
    }

    // Suggest converting quote to scheduled
    if (job.status === 'quote') {
      suggestions.push('Convert this quote to a scheduled job');
    }

    // Suggest scheduling if no service date
    if (job.status === 'scheduled' && !job.service_date) {
      suggestions.push('Set a service date for this scheduled job');
    }

    // Suggest completing job
    if (job.status === 'in_progress') {
      suggestions.push('Mark this job as completed when work is finished');
    }

    // Suggest invoicing
    if (job.status === 'completed') {
      suggestions.push('Generate invoice for this completed job');
    }

    // Suggest recording payment
    if (job.status === 'invoiced' && job.payment_status === 'unpaid') {
      suggestions.push('Record payment when client pays');
    }

    // Suggest following up on partial payment
    if (job.payment_status === 'partial') {
      const total = parseFloat(job.total.toString());
      const paid = parseFloat(job.amount_paid.toString());
      const remaining = total - paid;
      suggestions.push(
        `Follow up on remaining balance: $${remaining.toFixed(2)}`
      );
    }

    return suggestions;
  } catch (error) {
    console.error('Error getting automation suggestions:', error);
    return suggestions;
  }
}
