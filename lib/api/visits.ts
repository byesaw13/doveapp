import { SupabaseClient } from '@supabase/supabase-js';

export interface VisitFilters {
  page?: number;
  pageSize?: number;
  date?: string; // YYYY-MM-DD
}

export interface VisitContext {
  accountId: string;
  userId: string;
  supabase: SupabaseClient;
}

/**
 * List today's visits for a technician
 */
export async function listTodayVisits(
  context: VisitContext,
  filters: VisitFilters = {}
): Promise<{
  data: any[] | null;
  page: number;
  pageSize: number;
  total: number;
  error: Error | null;
}> {
  try {
    const page = filters.page || 1;
    const pageSize = Math.min(filters.pageSize || 20, 100);
    const offset = (page - 1) * pageSize;

    // Default to today if no date provided
    const targetDate = filters.date || new Date().toISOString().split('T')[0];

    const query = context.supabase
      .from('visits')
      .select(
        `
        *,
        job:jobs (
          title,
          clients!jobs_client_id_fkey (
            first_name,
            last_name,
            address_line1,
            city,
            state,
            zip_code,
            phone
          )
        )
      `,
        { count: 'exact' }
      )
      .eq('technician_id', context.userId)
      .eq('account_id', context.accountId)
      .gte('start_at', `${targetDate}T00:00:00`)
      .lt('start_at', `${targetDate}T23:59:59`)
      .order('start_at', { ascending: true });

    const { data, error, count } = await query.range(
      offset,
      offset + pageSize - 1
    );

    if (error) {
      console.error('Error fetching visits:', error);
      return {
        data: null,
        page,
        pageSize,
        total: 0,
        error: new Error('Failed to fetch visits'),
      };
    }

    return { data: data || [], page, pageSize, total: count || 0, error: null };
  } catch (error) {
    console.error('Unexpected error in listTodayVisits:', error);
    return {
      data: null,
      page: 1,
      pageSize: 20,
      total: 0,
      error: error as Error,
    };
  }
}
