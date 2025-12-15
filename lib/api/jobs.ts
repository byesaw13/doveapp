import { SupabaseClient } from '@supabase/supabase-js';
import type { JobStatus, JobWithClient, JobWithDetails } from '@/types/job';

export interface JobServiceContext {
  accountId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'TECH' | 'CUSTOMER';
  supabase: SupabaseClient;
}

export interface JobFilters {
  clientId?: string;
  status?: JobStatus | 'all';
  search?: string;
  assignedTechId?: string;
  customerId?: string;
}

/**
 * List jobs with portal-aware filtering and access control
 */
export async function listJobs(
  context: JobServiceContext,
  filters: JobFilters = {}
): Promise<{ data: JobWithClient[] | null; error: Error | null }> {
  try {
    let query = context.supabase
      .from('jobs')
      .select(`
        *,
        clients (
          id,
          first_name,
          last_name,
          company_name,
          email,
          phone
        )
      `)
      )
      .order('created_at', { ascending: false });

    // CRITICAL: Always filter by account_id for multi-tenancy
    // TODO: Enable after backfill - query = query.eq('account_id', context.accountId);

    // Role-specific filtering
    if (context.role === 'TECH') {
      // Techs only see jobs assigned to them
      query = query.eq('assigned_tech_id', context.userId);
    }

    if (context.role === 'CUSTOMER') {
      // For now, customers see all jobs in their account
      // TODO: Filter by customer_id when jobs.customer_id is populated
    }

    // Additional filters
    if (filters.clientId) {
      query = query.eq('client_id', filters.clientId);
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    if (filters.assignedTechId) {
      query = query.eq('assigned_tech_id', filters.assignedTechId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching jobs:', error);
      return { data: null, error: new Error('Failed to fetch jobs') };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Unexpected error in listJobs:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get a single job by ID with access control
 */
export async function getJobById(
  context: JobServiceContext,
  jobId: string
): Promise<{ data: JobWithDetails | null; error: Error | null }> {
  try {
    let query = context.supabase
      .from('jobs')
      .select(
        `
        *,
        line_items:job_line_items (*),
        clients (
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
      )
      .eq('id', jobId);

    // CRITICAL: Always filter by account_id for multi-tenancy
    query = query.eq('account_id', context.accountId);

    const { data, error } = await query.single();

    if (error) {
      console.error('Error fetching job:', error);
      return { data: null, error: new Error('Failed to fetch job') };
    }

    // Role-based access control
    if (context.role === 'TECH' && data.assigned_tech_id !== context.userId) {
      return {
        data: null,
        error: new Error('Access denied: Job not assigned to you'),
      };
    }

    if (context.role === 'CUSTOMER') {
      // For now, allow access to all jobs in account
      // TODO: Check customer_id when populated
    }

    return { data: data as unknown as JobWithDetails, error: null };
  } catch (error) {
    console.error('Unexpected error in getJobById:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Create a new job (admin/tech only)
 */
export async function createJob(
  context: JobServiceContext,
  jobData: any
): Promise<{ data: any | null; error: Error | null }> {
  try {
    // Only admins and techs can create jobs
    if (context.role === 'CUSTOMER') {
      return { data: null, error: new Error('Customers cannot create jobs') };
    }

    // Add account_id to job data
    const dataWithContext = {
      ...jobData,
      account_id: context.accountId,
    };

    const { data: job, error } = await context.supabase
      .from('jobs')
      .insert(dataWithContext)
      .select()
      .single();

    if (error) {
      console.error('Error creating job:', error);
      return { data: null, error: new Error('Failed to create job') };
    }

    // Handle line items if provided
    if (jobData.line_items && jobData.line_items.length > 0) {
      const lineItems = jobData.line_items.map((item: any) => ({
        ...item,
        job_id: job.id,
      }));

      const { error: lineItemsError } = await context.supabase
        .from('job_line_items')
        .insert(lineItems);

      if (lineItemsError) {
        console.error('Error creating line items:', lineItemsError);
      }
    }

    return { data: job, error: null };
  } catch (error) {
    console.error('Unexpected error in createJob:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update a job (admin/tech only, with ownership checks for tech)
 */
export async function updateJob(
  context: JobServiceContext,
  jobId: string,
  updates: any
): Promise<{ data: any | null; error: Error | null }> {
  try {
    // Only admins and techs can update jobs
    if (context.role === 'CUSTOMER') {
      return { data: null, error: new Error('Customers cannot update jobs') };
    }

    // For techs, verify they're assigned to this job
    if (context.role === 'TECH') {
      const { data: existingJob } = await context.supabase
        .from('jobs')
        .select('assigned_tech_id')
        .eq('id', jobId)
        .single();

      if (!existingJob || existingJob.assigned_tech_id !== context.userId) {
        return {
          data: null,
          error: new Error('Access denied: Job not assigned to you'),
        };
      }
    }

    const { data, error } = await context.supabase
      .from('jobs')
      .update(updates)
      .eq('id', jobId)
      .eq('account_id', context.accountId)
      .select()
      .single();

    if (error) {
      console.error('Error updating job:', error);
      return { data: null, error: new Error('Failed to update job') };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error in updateJob:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete a job (admin only)
 */
export async function deleteJob(
  context: JobServiceContext,
  jobId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // Only admins can delete jobs
    if (context.role !== 'OWNER' && context.role !== 'ADMIN') {
      return {
        success: false,
        error: new Error('Only admins can delete jobs'),
      };
    }

    const { error } = await context.supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)
      .eq('account_id', context.accountId);

    if (error) {
      console.error('Error deleting job:', error);
      return { success: false, error: new Error('Failed to delete job') };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error in deleteJob:', error);
    return { success: false, error: error as Error };
  }
}
