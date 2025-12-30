import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { canViewReports } from '@/lib/auth-guards';
import { getAllKPIs } from '@/lib/kpi';
import type { KPIPeriod } from '@/types/kpi';
import { unauthorizedResponse } from '@/lib/api-helpers';
import { PerformanceLogger } from '@/lib/api/performance';
import { isDemoMode } from '@/lib/auth/demo';

// GET /api/kpi?period=month - Get all KPIs for a period
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'GET');

  try {
    // Try to get account context, but allow demo access if no account
    let context;
    try {
      context = await requireAccountContext(request);
      if (!canViewReports(context.permissions)) {
        perfLogger.complete(403);
        return Response.json(
          { error: 'View reports permission required' },
          { status: 403 }
        );
      }
    } catch (error) {
      if (!isDemoMode()) {
        perfLogger.complete(401);
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      // For demo purposes, allow access without account context
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
      perfLogger.complete(400);
      return NextResponse.json(
        {
          error:
            'Invalid period. Must be one of: day, week, month, quarter, year, all',
        },
        { status: 400 }
      );
    }

    // KPI calculations typically involve multiple queries
    perfLogger.incrementQueryCount(); // Revenue queries
    perfLogger.incrementQueryCount(); // Job queries
    perfLogger.incrementQueryCount(); // Client queries
    const kpiDashboard = await getAllKPIs(period);

    const metrics = perfLogger.complete(200);
    const response = NextResponse.json(kpiDashboard);
    response.headers.set('X-Response-Time', `${metrics.duration}ms`);
    if (metrics.queryCount) {
      response.headers.set('X-Query-Count', metrics.queryCount.toString());
    }

    // TODO: Filter KPIs by account_id when implementing multi-tenant KPI calculations
    return response;
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    perfLogger.complete(401);
    return unauthorizedResponse();
  }
}
