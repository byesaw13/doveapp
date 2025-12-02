import { EmailRaw, EmailInsight } from '@/types/database';
import { supabase } from '@/lib/supabase';
import {
  analyzeEmailWithOpenAI,
  storeEmailInsight,
} from '@/lib/email-intelligence';
import { generateAlertsFromInsight } from '@/lib/email-alerts';

/**
 * Email Intelligence Processing Pipeline
 * Processes emails through: Raw -> AI Analysis -> Insights -> Alerts
 */

export interface ProcessingResult {
  emailRawId: string;
  success: boolean;
  insight?: EmailInsight;
  alertsGenerated: number;
  error?: string;
  processingTimeMs: number;
}

/**
 * Process a single email through the intelligence pipeline
 */
export async function processEmailIntelligence(
  emailRaw: EmailRaw
): Promise<ProcessingResult> {
  const startTime = Date.now();
  const emailRawId = emailRaw.id;

  try {
    console.log(`🤖 Starting intelligence processing for email ${emailRawId}`);

    // Step 1: Analyze with OpenAI
    console.log(`📊 Analyzing email ${emailRawId} with OpenAI`);
    const analysis = await analyzeEmailWithOpenAI(emailRaw);

    // Step 2: Store insight
    console.log(`💾 Storing insight for email ${emailRawId}`);
    const insight = await storeEmailInsight(emailRawId, analysis);

    // Step 3: Generate alerts if needed
    console.log(`🚨 Generating alerts for email ${emailRawId}`);
    const alerts = await generateAlertsFromInsight(insight);

    const processingTime = Date.now() - startTime;

    console.log(
      `✅ Successfully processed email ${emailRawId} in ${processingTime}ms`
    );
    console.log(
      `   Category: ${analysis.category}, Priority: ${analysis.priority}, Alerts: ${alerts.length}`
    );

    return {
      emailRawId,
      success: true,
      insight,
      alertsGenerated: alerts.length,
      processingTimeMs: processingTime,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    console.error(`❌ Failed to process email ${emailRawId}:`, error);

    return {
      emailRawId,
      success: false,
      alertsGenerated: 0,
      error: errorMessage,
      processingTimeMs: processingTime,
    };
  }
}

/**
 * Process multiple emails in batch
 */
export async function processEmailsBatch(
  emailRawIds: string[]
): Promise<ProcessingResult[]> {
  const results: ProcessingResult[] = [];

  console.log(`🔄 Starting batch processing of ${emailRawIds.length} emails`);

  for (const emailRawId of emailRawIds) {
    try {
      const emailRaw = await getEmailRawById(emailRawId);
      if (!emailRaw) {
        results.push({
          emailRawId,
          success: false,
          alertsGenerated: 0,
          error: 'Email raw not found',
          processingTimeMs: 0,
        });
        continue;
      }

      const result = await processEmailIntelligence(emailRaw);
      results.push(result);

      // Small delay to avoid overwhelming OpenAI API
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      results.push({
        emailRawId,
        success: false,
        alertsGenerated: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: 0,
      });
    }
  }

  const successful = results.filter((r) => r.success).length;
  console.log(
    `📊 Batch processing complete: ${successful}/${results.length} successful`
  );

  return results;
}

/**
 * Process pending emails (called by cron job or manual trigger)
 */
export async function processPendingEmails(
  limit: number = 10
): Promise<ProcessingResult[]> {
  // Get pending emails
  const pendingEmails = await getPendingEmails(limit);

  if (pendingEmails.length === 0) {
    console.log('📭 No pending emails to process');
    return [];
  }

  console.log(`📬 Processing ${pendingEmails.length} pending emails`);
  return await processEmailsBatch(pendingEmails.map((e) => e.id));
}

/**
 * Store raw email data from Gmail API
 */
export async function storeEmailRaw(
  gmailMessageId: string,
  gmailThreadId: string,
  rawData: any
): Promise<EmailRaw> {
  // Check if already exists
  const existing = await getEmailRawByGmailId(gmailMessageId);
  if (existing) {
    console.log(`Email ${gmailMessageId} already exists, skipping`);
    return existing;
  }

  // Extract email data from Gmail API response
  const headers = rawData.payload.headers;
  const getHeader = (name: string) => {
    const header = headers.find(
      (h: { name: string; value: string }) =>
        h.name.toLowerCase() === name.toLowerCase()
    );
    return header ? header.value : null;
  };

  const subject = getHeader('Subject');
  const fromAddress = getHeader('From');
  const toAddresses = getHeader('To');
  const ccAddresses = getHeader('Cc');
  const receivedAt = getHeader('Date');

  // Extract body text
  let bodyText = '';
  let bodyHtml = '';

  const extractBody = (part: any) => {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      bodyText = Buffer.from(part.body.data, 'base64').toString();
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      bodyHtml = Buffer.from(part.body.data, 'base64').toString();
    } else if (part.parts) {
      part.parts.forEach(extractBody);
    }
  };

  if (rawData.payload.parts) {
    rawData.payload.parts.forEach(extractBody);
  } else if (rawData.payload.body?.data) {
    bodyText = Buffer.from(rawData.payload.body.data, 'base64').toString();
  }

  const { data, error } = await supabase
    .from('emails_raw')
    .insert([
      {
        gmail_message_id: gmailMessageId,
        thread_id: gmailThreadId,
        subject,
        from_address: fromAddress,
        to_addresses: toAddresses,
        cc_addresses: ccAddresses,
        received_at: receivedAt ? new Date(receivedAt).toISOString() : null,
        snippet: rawData.snippet,
        body_text: bodyText,
        body_html: bodyHtml,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error storing email raw:', error);
    throw new Error('Failed to store email raw data');
  }

  console.log(`📥 Stored raw email ${gmailMessageId}`);
  return data;
}

/**
 * Get email raw by ID
 */
export async function getEmailRawById(id: string): Promise<EmailRaw | null> {
  const { data, error } = await supabase
    .from('emails_raw')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching email raw:', error);
    throw new Error('Failed to fetch email raw');
  }

  return data;
}

/**
 * Get email raw by Gmail message ID
 */
export async function getEmailRawByGmailId(
  gmailMessageId: string
): Promise<EmailRaw | null> {
  const { data, error } = await supabase
    .from('emails_raw')
    .select('*')
    .eq('gmail_message_id', gmailMessageId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching email raw by Gmail ID:', error);
    throw new Error('Failed to fetch email raw by Gmail ID');
  }

  return data;
}

/**
 * Get pending emails for processing
 */
export async function getPendingEmails(
  limit: number = 50
): Promise<EmailRaw[]> {
  const { data, error } = await supabase
    .from('emails_raw')
    .select('*')
    .eq('processing_status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching pending emails:', error);
    throw new Error('Failed to fetch pending emails');
  }

  return data || [];
}

/**
 * Get email insights with optional filtering
 */
export async function getEmailInsights(
  options: {
    category?: string;
    priority?: string;
    isActionRequired?: boolean;
    limit?: number;
  } = {}
): Promise<EmailInsight[]> {
  let query = supabase
    .from('email_insights')
    .select(
      `
      *,
      emails_raw!inner(gmail_message_id, gmail_thread_id)
    `
    )
    .order('created_at', { ascending: false });

  if (options.category) {
    query = query.eq('category', options.category);
  }

  if (options.priority) {
    query = query.eq('priority', options.priority);
  }

  if (options.isActionRequired !== undefined) {
    query = query.eq('is_action_required', options.isActionRequired);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching email insights:', error);
    throw new Error('Failed to fetch email insights');
  }

  return data || [];
}
