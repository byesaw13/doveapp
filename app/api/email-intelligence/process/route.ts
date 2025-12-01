import { NextRequest, NextResponse } from 'next/server';
import { processPendingEmails } from '@/lib/email-processing-pipeline';

/**
 * POST /api/email-intelligence/process
 * Manually trigger processing of pending emails
 */
export async function POST(request: NextRequest) {
  try {
    const { limit = 10 } = await request.json();

    console.log(
      `🚀 Starting manual email intelligence processing (limit: ${limit})`
    );

    const results = await processPendingEmails(limit);

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const totalAlerts = results.reduce((sum, r) => sum + r.alertsGenerated, 0);

    console.log(
      `✅ Processing complete: ${successful} successful, ${failed} failed, ${totalAlerts} alerts generated`
    );

    return NextResponse.json({
      success: true,
      processed: results.length,
      successful,
      failed,
      alerts_generated: totalAlerts,
      results: results.map((r) => ({
        email_raw_id: r.emailRawId,
        success: r.success,
        alerts_generated: r.alertsGenerated,
        processing_time_ms: r.processingTimeMs,
        error: r.error,
      })),
    });
  } catch (error) {
    console.error('Error processing emails:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to process emails';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
