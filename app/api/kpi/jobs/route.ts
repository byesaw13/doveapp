import { NextRequest, NextResponse } from 'next/server';
import { calculateJobKPIs } from '@/lib/kpi';
import type { KPIPeriod } from '@/types/kpi';

// GET /api/kpi/jobs?period=month - Get job KPIs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') || 'month') as KPIPeriod;

    const jobKPIs = await calculateJobKPIs(period);

    return NextResponse.json(jobKPIs);
  } catch (error) {
    console.error('Error fetching job KPIs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job KPIs' },
      { status: 500 }
    );
  }
}
