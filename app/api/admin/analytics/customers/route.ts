import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { canViewReports } from '@/lib/auth-guards';
import { PerformanceLogger } from '@/lib/api/performance';
import {
  getCustomerSegmentSummary,
  getTopCustomersByLifetimeValue,
  calculateRetentionMetrics,
} from '@/lib/analytics/customer-analytics';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

/**
 * GET /api/admin/analytics/customers - Get customer analytics overview
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

    const supabase = await createRouteHandlerClient();
    const searchParams = url.searchParams;
    const type = searchParams.get('type') || 'overview';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    let result: any = {};

    perfLogger.incrementQueryCount(); // This will be called multiple times

    switch (type) {
      case 'segments':
        result = await getCustomerSegmentSummary(supabase);
        break;

      case 'top-customers':
        result = await getTopCustomersByLifetimeValue(supabase, limit);
        break;

      case 'retention':
        result = await calculateRetentionMetrics(supabase);
        break;

      case 'overview':
      default:
        // Get all analytics
        const [segments, topCustomers, retention] = await Promise.all([
          getCustomerSegmentSummary(supabase),
          getTopCustomersByLifetimeValue(supabase, 5),
          calculateRetentionMetrics(supabase),
        ]);

        result = {
          segments,
          topCustomers,
          retention,
          summary: {
            totalSegments: segments.length,
            totalHighValueCustomers: topCustomers.filter(
              (c) => c.customerSegment === 'vip'
            ).length,
            overallRetentionRate:
              (retention.retainedCustomers / retention.totalCustomers) * 100,
          },
        };
        break;
    }

    const metrics = perfLogger.complete(200);
    return NextResponse.json(
      {
        type,
        data: result,
        performance: {
          duration: metrics.duration,
          queryCount: metrics.queryCount,
        },
      },
      {
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in customer analytics:', error);
    perfLogger.complete(500);
    return NextResponse.json(
      { error: 'Internal server error during analytics calculation' },
      { status: 500 }
    );
  }
}
