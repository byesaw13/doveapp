import { supabase } from '@/lib/supabase';
import type { Client } from '@/types/client';
import type { JobWithClient } from '@/types/job';
import type { PropertyWithClient } from '@/types/property';
import type { Payment } from '@/types/payment';

export interface DashboardStats {
  totalClients: number;
  totalProperties: number;
  totalJobs: number;
  totalRevenue: number;
  totalPaid: number;
  totalOutstanding: number;
  jobsByStatus: Record<string, number>;
  recentJobs: JobWithClient[];
  recentClients: Client[];
  recentProperties: PropertyWithClient[];
  recentPayments: Payment[];
}

/**
 * Get comprehensive dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  // Get all clients count
  const { count: totalClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true });

  // Get all properties count
  const { count: totalProperties } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true });

  // Get all jobs with client info
  const { data: jobs } = await supabase
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

  const totalJobs = jobs?.length || 0;

  // Calculate revenue stats
  const totalRevenue =
    jobs?.reduce((sum, job) => sum + parseFloat(job.total.toString()), 0) || 0;
  const totalPaid =
    jobs?.reduce(
      (sum, job) => sum + parseFloat(job.amount_paid.toString()),
      0
    ) || 0;
  const totalOutstanding = totalRevenue - totalPaid;

  // Jobs by status
  const jobsByStatus: Record<string, number> = {};
  jobs?.forEach((job) => {
    jobsByStatus[job.status] = (jobsByStatus[job.status] || 0) + 1;
  });

  // Recent jobs (last 5)
  const recentJobs = jobs?.slice(0, 5) || [];

  // Recent clients (last 5)
  const { data: recentClients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  // Recent properties (last 5)
  const { data: recentProperties } = await supabase
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
    .order('created_at', { ascending: false })
    .limit(5);

  // Recent payments (last 5)
  const { data: recentPayments } = await supabase
    .from('payments')
    .select('*')
    .order('payment_date', { ascending: false })
    .limit(5);

  return {
    totalClients: totalClients || 0,
    totalProperties: totalProperties || 0,
    totalJobs,
    totalRevenue,
    totalPaid,
    totalOutstanding,
    jobsByStatus,
    recentJobs: recentJobs as JobWithClient[],
    recentClients: recentClients || [],
    recentProperties: (recentProperties as PropertyWithClient[]) || [],
    recentPayments: recentPayments || [],
  };
}

/**
 * Get jobs summary by status
 */
export async function getJobsByStatus(): Promise<Record<string, number>> {
  const { data: jobs } = await supabase.from('jobs').select('status');

  const statusCounts: Record<string, number> = {};
  jobs?.forEach((job) => {
    statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
  });

  return statusCounts;
}

/**
 * Get payment summary
 */
export async function getPaymentSummary(): Promise<{
  totalRevenue: number;
  totalPaid: number;
  totalOutstanding: number;
}> {
  const { data: jobs } = await supabase
    .from('jobs')
    .select('total, amount_paid');

  const totalRevenue =
    jobs?.reduce((sum, job) => sum + parseFloat(job.total.toString()), 0) || 0;
  const totalPaid =
    jobs?.reduce(
      (sum, job) => sum + parseFloat(job.amount_paid.toString()),
      0
    ) || 0;
  const totalOutstanding = totalRevenue - totalPaid;

  return {
    totalRevenue,
    totalPaid,
    totalOutstanding,
  };
}
