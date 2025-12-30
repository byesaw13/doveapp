import { NextRequest, NextResponse } from 'next/server';
import { requireTechContext } from '@/lib/auth-guards-api';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Try to get tech context, but allow demo access if no account
    let context;
    let supabase;
    try {
      context = await requireTechContext(request);
      supabase = createClient();
    } catch (error) {
      // For demo purposes, allow access without tech context
      const { createClient: createSupabaseClient } =
        await import('@supabase/supabase-js');
      supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      // Create a mock context for demo
      context = {
        accountId: 'demo',
        userId: 'demo-tech',
        role: 'TECH' as const,
        permissions: [],
        user: { id: 'demo-tech', email: 'demo-tech@example.com' },
        account: { id: 'demo', name: 'Demo Account' },
      };
    }

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
