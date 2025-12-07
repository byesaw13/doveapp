import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { LeadSource } from '@/types/lead';

export const dynamic = 'force-dynamic';

interface SourceStats {
  source: LeadSource;
  total: number;
  converted: number;
  conversion_rate: number;
  avg_value: number;
  avg_time_to_conversion: number;
}

export async function GET(): Promise<NextResponse> {
  try {
    // Get all leads
    const { data: leads, error } = await supabase
      .from('leads')
      .select('source, status, estimated_value, created_at, updated_at');

    if (error) {
      console.error('Error fetching leads for analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    // Group by source
    const sourceGroups: Record<string, any[]> = {};
    leads?.forEach((lead) => {
      if (!sourceGroups[lead.source]) {
        sourceGroups[lead.source] = [];
      }
      sourceGroups[lead.source].push(lead);
    });

    // Calculate stats for each source
    const stats: SourceStats[] = Object.entries(sourceGroups).map(
      ([source, sourceLeads]) => {
        const total = sourceLeads.length;
        const converted = sourceLeads.filter(
          (l) => l.status === 'converted'
        ).length;
        const conversion_rate = total > 0 ? (converted / total) * 100 : 0;

        // Calculate average value
        const leadsWithValue = sourceLeads.filter(
          (l) => l.estimated_value && l.estimated_value > 0
        );
        const avg_value =
          leadsWithValue.length > 0
            ? leadsWithValue.reduce(
                (sum, l) => sum + (l.estimated_value || 0),
                0
              ) / leadsWithValue.length
            : 0;

        // Calculate average time to conversion
        const convertedLeads = sourceLeads.filter(
          (l) => l.status === 'converted'
        );
        const avg_time_to_conversion =
          convertedLeads.length > 0
            ? convertedLeads.reduce((sum, l) => {
                const created = new Date(l.created_at).getTime();
                const updated = new Date(l.updated_at).getTime();
                const days = (updated - created) / (1000 * 60 * 60 * 24);
                return sum + days;
              }, 0) / convertedLeads.length
            : 0;

        return {
          source: source as LeadSource,
          total,
          converted,
          conversion_rate,
          avg_value,
          avg_time_to_conversion,
        };
      }
    );

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
