import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export interface SidebarNotificationCounts {
  pendingEstimates: number;
  overdueJobs: number;
  newLeads: number;
  lowInventoryItems: number;
}

export async function GET(): Promise<NextResponse> {
  try {
    // Parallel queries for all notification counts
    const [estimatesResult, jobsResult, leadsResult, inventoryResult] =
      await Promise.all([
        // Pending estimates (sent more than 7 days ago, not accepted/declined)
        supabase
          .from('estimates')
          .select('id', { count: 'exact', head: true })
          .in('status', ['sent', 'viewed'])
          .lt(
            'sent_date',
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          ),

        // Overdue jobs (scheduled before today, not completed/cancelled)
        supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .in('status', ['scheduled', 'in_progress'])
          .lt('service_date', new Date().toISOString().split('T')[0]),

        // New leads (created in last 7 days, status is 'new')
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'new')
          .gte(
            'created_at',
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          ),

        // Low inventory items (quantity < reorder_level)
        supabase.rpc('get_low_inventory_count'),
      ]);

    const counts: SidebarNotificationCounts = {
      pendingEstimates: estimatesResult.count || 0,
      overdueJobs: jobsResult.count || 0,
      newLeads: leadsResult.count || 0,
      lowInventoryItems: inventoryResult.error
        ? 0
        : typeof inventoryResult.data === 'number'
          ? inventoryResult.data
          : 0,
    };

    return NextResponse.json(counts);
  } catch (error) {
    console.error('Error fetching sidebar notification counts:', error);
    return NextResponse.json(
      {
        pendingEstimates: 0,
        overdueJobs: 0,
        newLeads: 0,
        lowInventoryItems: 0,
      },
      { status: 200 }
    );
  }
}
