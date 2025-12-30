import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { PerformanceLogger } from '@/lib/api/performance';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

/**
 * POST /api/admin/job-templates/[id]/use - Track template usage
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'POST');

  try {
    // Validate authentication
    const context = await requireAccountContext(request);
    const supabase = await createRouteHandlerClient();
    const { id } = await params;

    // Increment usage count
    perfLogger.incrementQueryCount();
    const { data, error } = await supabase.rpc('increment_template_usage', {
      template_id: id,
    });

    if (error) {
      console.error('Error incrementing template usage:', error);
      perfLogger.complete(500);
      return NextResponse.json(
        { error: 'Failed to track template usage' },
        { status: 500 }
      );
    }

    const metrics = perfLogger.complete(200);
    return NextResponse.json(
      { message: 'Template usage tracked successfully' },
      {
        headers: {
          'X-Response-Time': `${metrics.duration}ms`,
          'X-Query-Count': metrics.queryCount?.toString() || '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in job template use tracking:', error);
    perfLogger.complete(500);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
