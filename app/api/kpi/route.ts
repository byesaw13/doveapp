import { NextRequest, NextResponse } from 'next/server';
import { getAllKPIs } from '@/lib/kpi';
import type { KPIPeriod } from '@/types/kpi';

// GET /api/kpi?period=month - Get all KPIs for a period
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') || 'month') as KPIPeriod;

    // Validate period
    const validPeriods: KPIPeriod[] = [
      'day',
      'week',
      'month',
      'quarter',
      'year',
      'all',
    ];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        {
          error:
            'Invalid period. Must be one of: day, week, month, quarter, year, all',
        },
        { status: 400 }
      );
    }

    const kpiDashboard = await getAllKPIs(period);

    return NextResponse.json(kpiDashboard);
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KPIs' },
      { status: 500 }
    );
  }
}
