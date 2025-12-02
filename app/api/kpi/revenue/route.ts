import { NextRequest, NextResponse } from 'next/server';
import { calculateRevenueKPIs } from '@/lib/kpi';
import type { KPIPeriod } from '@/types/kpi';

// GET /api/kpi/revenue?period=month - Get revenue KPIs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') || 'month') as KPIPeriod;

    const revenueKPIs = await calculateRevenueKPIs(period);

    return NextResponse.json(revenueKPIs);
  } catch (error) {
    console.error('Error fetching revenue KPIs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue KPIs' },
      { status: 500 }
    );
  }
}
