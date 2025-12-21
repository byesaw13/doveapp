import { NextRequest, NextResponse } from 'next/server';
import { requireTechContext } from '@/lib/auth-guards';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Validate tech access
    const context = await requireTechContext(request);

    const supabase = createClient();

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Get jobs assigned to this tech for today
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select(
        `
        id,
        job_number,
        title,
        description,
        status,
        scheduled_for,
        service_address,
        lat,
        lng,
        customers (
          name,
          email,
          phone
        )
      `
      )
      .eq('account_id', context.accountId)
      .eq('assigned_tech_id', context.userId)
      .gte('scheduled_for', startOfDay.toISOString())
      .lte('scheduled_for', endOfDay.toISOString())
      .order('scheduled_for', { ascending: true });

    if (error) {
      console.error("Error fetching today's jobs:", error);
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      jobs: jobs || [],
      date: today.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Tech today-jobs API error:', error);
    return NextResponse.json(
      { error: 'Unauthorized or server error' },
      { status: 401 }
    );
  }
}
