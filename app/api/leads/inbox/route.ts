import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    // Get all leads from the last 30 days, ordered by creation date
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .in('status', [
        'new',
        'contacted',
        'qualified',
        'proposal_sent',
        'negotiating',
      ])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads inbox:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in leads inbox API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
