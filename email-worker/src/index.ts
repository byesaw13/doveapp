/**
 * DoveApp Email Monitor - Cloudflare Worker
 *
 * Monitors Gmail inbox, summarizes emails with OpenAI, and sends summaries to DoveApp
 */

import { GmailClient } from './gmail';
import { OpenAIClient } from './openai';
import { WebhookClient } from './webhook';

export interface Env {
  // Gmail OAuth credentials
  GMAIL_CLIENT_ID: string;
  GMAIL_CLIENT_SECRET: string;
  GMAIL_REFRESH_TOKEN: string;

  // OpenAI API key
  OPENAI_API_KEY: string;

  // Webhook configuration
  WEBHOOK_URL: string;
  WEBHOOK_SECRET: string;

  // KV namespace for tracking processed emails
  EMAIL_TRACKER: KVNamespace;
}

export default {
  /**
   * Scheduled trigger - runs every 10 minutes via cron
   */
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('🔄 Starting email monitoring job');

    try {
      // Initialize clients
      const gmail = new GmailClient(env);
      const openai = new OpenAIClient(env);
      const webhook = new WebhookClient(env);

      // Get new emails from Gmail
      console.log('📧 Fetching new emails from Gmail...');
      const emails = await gmail.getUnreadEmails(20);
      console.log(`Found ${emails.length} unread emails`);

      if (emails.length === 0) {
        console.log('✅ No new emails to process');
        return;
      }

      let processedCount = 0;
      let errorCount = 0;

      // Process each email
      for (const email of emails) {
        try {
          // Check if we've already processed this email
          const alreadyProcessed = await env.EMAIL_TRACKER.get(email.id);
          if (alreadyProcessed) {
            console.log(`⏭️  Email ${email.id} already processed, skipping`);
            continue;
          }

          console.log(
            `📝 Processing email: ${email.subject} from ${email.from}`
          );

          // Get AI summary
          const summary = await openai.summarizeEmail(email);

          // Send to webhook
          await webhook.sendSummary({
            gmailId: email.id,
            gmailThreadId: email.threadId,
            from: email.from,
            subject: email.subject,
            receivedAt: email.receivedAt,
            snippet: email.snippet,
            summary: summary.summary,
            category: summary.category,
            priority: summary.priority,
            actionRequired: summary.actionRequired,
            actionType: summary.actionType,
            actionItems: summary.actionItems,
            extractedData: summary.extractedData,
          });

          // Mark as processed
          await env.EMAIL_TRACKER.put(email.id, new Date().toISOString(), {
            expirationTtl: 60 * 60 * 24 * 30, // 30 days
          });

          processedCount++;
          console.log(`✅ Successfully processed email ${email.id}`);

          // Small delay to avoid rate limits
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          errorCount++;
          console.error(`❌ Error processing email ${email.id}:`, error);
          // Continue with next email
        }
      }

      console.log(
        `🎉 Job complete: ${processedCount} processed, ${errorCount} errors`
      );
    } catch (error) {
      console.error('❌ Fatal error in scheduled job:', error);
      throw error;
    }
  },

  /**
   * HTTP endpoint for manual triggers and testing
   */
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Manual trigger endpoint
    if (url.pathname === '/trigger' && request.method === 'POST') {
      // Run the scheduled job manually
      ctx.waitUntil(this.scheduled({} as ScheduledEvent, env, ctx));

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email monitoring job triggered',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response('DoveApp Email Monitor', { status: 200 });
  },
};
