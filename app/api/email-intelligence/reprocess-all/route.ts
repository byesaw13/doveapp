import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { processEmailsBatch } from '@/lib/email-processing-pipeline';

/**
 * POST /api/email-intelligence/reprocess-all
 * Re-run all emails through the AI intelligence system
 * Useful for: failed emails, updated AI logic, testing, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const { force = false } = await request.json();

    console.log(`🔄 Starting reprocessing of emails (force: ${force})`);

    // Get emails that need processing
    // If force=false, only get emails without insights (new/unreviewed)
    // If force=true, get all emails
    let query = supabase
      .from('emails_raw')
      .select('id, gmail_message_id, subject, email_insights(id)');

    if (!force) {
      // Only process emails that don't have insights yet
      const { data: emailsWithInsights, error: insightsError } = await supabase
        .from('email_insights')
        .select('email_id');

      if (insightsError) {
        console.error('Error fetching insights:', insightsError);
        return NextResponse.json(
          { error: 'Failed to fetch existing insights' },
          { status: 500 }
        );
      }

      const processedIds = emailsWithInsights?.map((i) => i.email_id) || [];

      query = query.not(
        'id',
        'in',
        `(${processedIds.length > 0 ? processedIds.join(',') : 'null'})`
      );
      console.log(
        `📭 Filtering out ${processedIds.length} already-processed emails`
      );
    }

    const { data: allEmails, error: fetchError } = await query.order(
      'created_at',
      { ascending: true }
    );

    if (fetchError) {
      console.error('Error fetching emails:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch emails' },
        { status: 500 }
      );
    }

    if (!allEmails || allEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No emails found to process',
        processed: 0,
        skipped: 0,
        failed: 0,
      });
    }

    console.log(`📧 Found ${allEmails.length} emails to reprocess`);

    let processed = 0;
    const skipped = 0;
    let failed = 0;
    const results = [];
    const batchSize = 5; // Process in small batches to avoid overwhelming OpenAI

    // Process emails in batches
    for (let i = 0; i < allEmails.length; i += batchSize) {
      const batch = allEmails.slice(i, i + batchSize);
      const batchIds = batch.map((email) => email.id);

      console.log(
        `🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allEmails.length / batchSize)} (${batch.length} emails)`
      );

      try {
        // If force=true, delete existing insights and alerts first
        if (force) {
          await supabase.from('alerts').delete().in('email_id', batchIds);

          await supabase
            .from('email_insights')
            .delete()
            .in('email_id', batchIds);

          console.log(`🗑️ Cleared existing insights and alerts for batch`);
        }

        // Process the batch
        const batchResults = await processEmailsBatch(batchIds);

        // Update counters
        for (const result of batchResults) {
          if (result.success) {
            processed++;
          } else {
            failed++;
          }
          results.push(result);
        }

        console.log(
          `✅ Batch complete: ${batchResults.filter((r) => r.success).length} successful, ${batchResults.filter((r) => !r.success).length} failed`
        );

        // Small delay between batches to be respectful to OpenAI API
        if (i + batchSize < allEmails.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (batchError) {
        console.error(`❌ Batch processing error:`, batchError);
        failed += batch.length;
        results.push(
          ...batch.map((email) => ({
            emailRawId: email.id,
            success: false,
            alertsGenerated: 0,
            error: 'Batch processing failed',
            processingTimeMs: 0,
          }))
        );
      }
    }

    const totalAlerts = results.reduce((sum, r) => sum + r.alertsGenerated, 0);

    console.log(
      `🎉 Reprocessing complete: ${processed} successful, ${skipped} skipped, ${failed} failed, ${totalAlerts} alerts generated`
    );

    return NextResponse.json({
      success: true,
      message: `Reprocessed ${allEmails.length} emails`,
      summary: {
        total: allEmails.length,
        processed,
        skipped,
        failed,
        alerts_generated: totalAlerts,
        force_mode: force,
      },
      results: results.map((r) => ({
        email_id: r.emailRawId,
        success: r.success,
        alerts_generated: r.alertsGenerated,
        processing_time_ms: r.processingTimeMs,
        error: r.error,
      })),
    });
  } catch (error) {
    console.error('Error reprocessing emails:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to reprocess emails';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
