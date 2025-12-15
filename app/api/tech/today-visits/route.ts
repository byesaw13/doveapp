import { NextRequest, NextResponse } from 'next/server';
import { requireTechContext } from '@/lib/auth-guards';
import { createAuthenticatedClient } from '@/lib/api-helpers';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const context = await requireTechContext(request);
    const supabase = createAuthenticatedClient(request);

    // Get today's visits for this tech
    const today = new Date().toISOString().split('T')[0];

    const { data: visits, error } = await supabase
      .from('visits')
      .select(
        `
        *,
        job:jobs (
          id,
          title,
          client:clients (
            first_name,
            last_name,
            address_line1,
            city,
            state,
            zip_code
          )
        )
      `
      )
      .eq('technician_id', context.userId)
      .gte('start_at', `${today}T00:00:00`)
      .lt('start_at', `${today}T23:59:59`)
      .order('start_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: visits || [] });
  } catch (error: any) {
    console.error('Error in GET /api/tech/today-visits:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication required' },
      { status: error.message?.includes('required') ? 401 : 500 }
    );
  }
}
