import { NextRequest, NextResponse } from 'next/server';
import { calculateClientKPIs } from '@/lib/kpi';
import type { KPIPeriod } from '@/types/kpi';

// GET /api/kpi/clients?period=month - Get client KPIs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') || 'month') as KPIPeriod;

    const clientKPIs = await calculateClientKPIs(period);

    return NextResponse.json(clientKPIs);
  } catch (error) {
    console.error('Error fetching client KPIs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client KPIs' },
      { status: 500 }
    );
  }
}
