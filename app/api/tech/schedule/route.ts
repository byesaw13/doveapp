import { NextRequest, NextResponse } from 'next/server';
import { requireTechContext } from '@/lib/auth-guards';
import { createAuthenticatedClient } from '@/lib/api-helpers';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Try to get tech context, but allow demo access if no account
    let context;
    let supabase;
    try {
      context = await requireTechContext(request);
      supabase = createAuthenticatedClient(request);
    } catch (error) {
      // For demo purposes, allow access without tech context
      const { createClient } = await import('@supabase/supabase-js');
      supabase = createClient(
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

    // For now, return basic schedule data - could be enhanced later
    const { data: visits, error } = await supabase
      .from('visits')
      .select(
        `
        id,
        start_at,
        end_at,
        status,
        job:jobs (
          title,
          client:clients!jobs_client_id_fkey (
            first_name,
            last_name
          )
        )
      `
      )
      .eq('technician_id', context.userId)
      .eq('account_id', context.accountId)
      .gte('start_at', new Date().toISOString())
      .order('start_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: visits || [] });
  } catch (error: any) {
    const isAuthError =
      error.message?.includes('required') || error.message?.includes('access');
    if (!isAuthError) {
      console.error('Error in GET /api/tech/schedule:', error);
    }
    return NextResponse.json(
      { error: error.message || 'Authentication required' },
      { status: isAuthError ? 401 : 500 }
    );
  }
}
