// Gmail Sync API Endpoint
//
// PURPOSE:
// This endpoint triggers the Gmail sync worker to fetch unread emails from
// all active Gmail connections and feed them into the unified inbox.
//
// USAGE:
//   - Manual trigger: POST/GET to /api/email/sync
//   - Cron job: Configure Vercel Cron to call this endpoint every 5-10 minutes
//   - Development: Call manually to test Gmail sync
//
// SECURITY:
// TODO: Add authentication to prevent unauthorized access.
// Options for production:
//   - Check for a secret header/token (e.g., CRON_SECRET)
//   - Use Vercel Cron's built-in authentication headers
//   - Require admin user session
//
// RESPONSE FORMAT:
// {
//   success: boolean,
//   synced: number,        // Total emails synced
//   errors: string[]       // Any errors encountered
// }

import { NextRequest, NextResponse } from 'next/server';
import { syncGmailToInbox } from '@/lib/messaging/gmailWorker';

// Support both POST and GET for flexibility
// POST is preferred for cron jobs, GET is easier for manual testing
export async function POST(_req: NextRequest): Promise<NextResponse> {
  return await handleSync();
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  return await handleSync();
}

async function handleSync(): Promise<NextResponse> {
  try {
    console.log('📧 Email sync endpoint called');

    // TODO: Add authentication check here
    // Example: Verify cron secret or user session
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Execute the sync
    const result = await syncGmailToInbox();

    // Return summary
    return NextResponse.json({
      success: true,
      synced: result.totalSynced,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Email sync endpoint error:', error);

    return NextResponse.json(
      {
        success: false,
        synced: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
