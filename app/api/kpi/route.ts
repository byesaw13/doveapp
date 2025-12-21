import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext, canViewReports } from '@/lib/auth-guards';
import { getAllKPIs } from '@/lib/kpi';
import type { KPIPeriod } from '@/types/kpi';
import { unauthorizedResponse } from '@/lib/api-helpers';

// GET /api/kpi?period=month - Get all KPIs for a period
export async function GET(request: NextRequest) {
  try {
    // Try to get account context, but allow demo access if no account
    let context;
    try {
      context = await requireAccountContext(request);
      if (!canViewReports(context.permissions)) {
        return Response.json(
          { error: 'View reports permission required' },
          { status: 403 }
        );
      }
    } catch (error) {
      // For demo purposes, allow access without account context
      // In production, this should require proper authentication
    }
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

    // TODO: Filter KPIs by account_id when implementing multi-tenant KPI calculations
    return NextResponse.json(kpiDashboard);
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return unauthorizedResponse();
  }
}
