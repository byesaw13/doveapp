import useSWR, { type SWRConfiguration } from 'swr';
import type { InvoiceWithRelations } from '@/types/invoice';
import type { JobWithClient } from '@/types/job';
import type { Client } from '@/types/client';
import type { EstimateWithRelations } from '@/types/estimate';

/**
 * Fetcher function for SWR
 */
const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error: any = new Error('An error occurred while fetching the data.');
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }

  return res.json();
};

/**
 * Default SWR configuration
 */
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
};

/**
 * Hook to fetch invoices with caching
 */
export function useInvoices(status?: string) {
  const url =
    status && status !== 'all'
      ? `/api/invoices?status=${status}`
      : '/api/invoices';

  const { data, error, isLoading, mutate } = useSWR<InvoiceWithRelations[]>(
    url,
    fetcher,
    defaultConfig
  );

  return {
    invoices: data,
    isLoading,
    isError: error,
    mutate, // Use this to manually revalidate
  };
}

/**
 * Hook to fetch a single invoice
 */
export function useInvoice(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<InvoiceWithRelations>(
    id ? `/api/invoices/${id}` : null,
    fetcher,
    defaultConfig
  );

  return {
    invoice: data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to fetch jobs with caching
 */
export function useJobs(filters?: { status?: string; clientId?: string }) {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'all') {
    params.set('status', filters.status);
  }
  if (filters?.clientId) {
    params.set('clientId', filters.clientId);
  }

  const url = params.toString()
    ? `/api/jobs?${params.toString()}`
    : '/api/jobs';

  const { data, error, isLoading, mutate } = useSWR<JobWithClient[]>(
    url,
    fetcher,
    defaultConfig
  );

  return {
    jobs: data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to fetch a single job
 */
export function useJob(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<JobWithClient>(
    id ? `/api/jobs/${id}` : null,
    fetcher,
    defaultConfig
  );

  return {
    job: data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to fetch clients with caching
 */
export function useClients() {
  const { data, error, isLoading, mutate } = useSWR<Client[]>(
    '/api/clients',
    fetcher,
    defaultConfig
  );

  return {
    clients: data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to fetch a single client
 */
export function useClient(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Client>(
    id ? `/api/clients/${id}` : null,
    fetcher,
    defaultConfig
  );

  return {
    client: data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to fetch estimates with caching
 */
export function useEstimates(status?: string) {
  const url =
    status && status !== 'all'
      ? `/api/estimates?status=${status}`
      : '/api/estimates';

  const { data, error, isLoading, mutate } = useSWR<EstimateWithRelations[]>(
    url,
    fetcher,
    defaultConfig
  );

  return {
    estimates: data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to fetch a single estimate
 */
export function useEstimate(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<EstimateWithRelations>(
    id ? `/api/estimates/${id}` : null,
    fetcher,
    defaultConfig
  );

  return {
    estimate: data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Optimistic update helper
 * Use this to update the cache optimistically before the API call completes
 *
 * Example:
 * const { mutate } = useInvoices();
 *
 * const updateInvoice = async (id: string, data: Partial<Invoice>) => {
 *   // Optimistic update
 *   mutate(
 *     (invoices) => invoices?.map(inv =>
 *       inv.id === id ? { ...inv, ...data } : inv
 *     ),
 *     { revalidate: false }
 *   );
 *
 *   // Make API call
 *   await fetch(`/api/invoices/${id}`, {
 *     method: 'PATCH',
 *     body: JSON.stringify(data),
 *   });
 *
 *   // Revalidate to get server data
 *   mutate();
 * };
 */
