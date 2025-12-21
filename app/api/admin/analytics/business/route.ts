import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext, canViewReports } from '@/lib/auth-guards';
import { createAuthenticatedClient } from '@/lib/api-helpers';
import { PerformanceLogger } from '@/lib/api/performance';
import {
  calculateBusinessMetrics,
  type BusinessMetrics,
} from '@/lib/analytics/business-intelligence';

/**
 * GET /api/admin/analytics/business - Get comprehensive business intelligence metrics
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'GET');

  try {
    // Validate authentication and require reports permission
    const context = await requireAccountContext(request);
    if (!canViewReports(context.permissions)) {
      perfLogger.complete(403);
      return NextResponse.json(
        { error: 'Reports permission required' },
        { status: 403 }
      );
    }

    const supabase = createAuthenticatedClient(request);
    const searchParams = url.searchParams;
    const period = (searchParams.get('period') || 'month') as
      | 'month'
      | 'quarter'
      | 'year';

    perfLogger.incrementQueryCount();

    // Calculate comprehensive business metrics
    const metrics = await calculateBusinessMetrics(supabase, period);

    const metrics2 = perfLogger.complete(200);
    return NextResponse.json(
      {
        period,
        metrics,
        performance: {
          duration: metrics2.duration,
          queryCount: metrics2.queryCount,
        },
      },
      {
        headers: {
          'X-Response-Time': `${metrics2.duration}ms`,
          'X-Query-Count': metrics2.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in business analytics:', error);
    perfLogger.complete(500);
    return NextResponse.json(
      { error: 'Internal server error during analytics calculation' },
      { status: 500 }
    );
  }
}
