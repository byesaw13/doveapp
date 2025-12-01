import {
  EmailRaw,
  EmailInsight,
  EmailCategory,
  EmailInsightDetails,
} from '@/types/database';
import { supabase } from '@/lib/supabase';

export interface OpenAIEmailAnalysisResult {
  category: EmailCategory;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_action_required: boolean;
  summary: string;
  details: EmailInsightDetails;
  confidence_score: number;
  reasoning?: string;
  processing_time_ms?: number;
}

/**
 * Analyze email with OpenAI for structured intelligence extraction
 */
export async function analyzeEmailWithOpenAI(
  emailRaw: EmailRaw
): Promise<OpenAIEmailAnalysisResult> {
  const { OpenAI } = await import('openai');

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Extract basic email data from raw Gmail data
  const emailData = extractEmailDataFromRaw(emailRaw.raw_data);

  const prompt = `You are an AI assistant analyzing emails for a field service company (painting, plumbing, electrical, HVAC, etc.). Extract structured business intelligence from this email.

Email Subject: ${emailData.subject || 'No subject'}
Email From: ${emailData.from || 'Unknown'}
Email Body: ${emailData.body || 'No content'}
Received: ${emailData.received_at || 'Unknown'}

TASK: Analyze this email and provide structured business intelligence with EXACTLY this JSON format:

{
  "category": "ONE_CATEGORY_ONLY",
  "priority": "low|medium|high|urgent",
  "is_action_required": true|false,
  "summary": "1-2 sentence plain-language summary",
  "details": {
    // Include ONLY relevant fields based on category
  },
  "confidence_score": 0.0-1.0,
  "reasoning": "brief explanation of analysis"
}

CATEGORIES (choose EXACTLY ONE):
- LEAD_NEW: New potential customer/job inquiry
- LEAD_FOLLOWUP: Follow-up/reply in existing lead thread
- BILLING_INCOMING_INVOICE: Vendor/supplier invoice to pay
- BILLING_OUTGOING_INVOICE: Invoice sent to customer or their reply
- BILLING_PAYMENT_RECEIVED: Payment confirmation/receipt
- BILLING_PAYMENT_ISSUE: Dispute, failed payment, overdue notice
- SCHEDULING_REQUEST: New request for dates/times
- SCHEDULING_CHANGE: Reschedule/cancel/confirm existing appointment
- CUSTOMER_SUPPORT: Questions, concerns, complaints, general support
- VENDOR_RECEIPT: Order confirmations, receipts, purchase summaries
- SYSTEM_SECURITY: Login alerts, password reset, suspicious activity
- NEWSLETTER_PROMO: Marketing, promos, newsletters, ads
- SPAM_OTHER: Irrelevant/junk emails

DETAILS FIELDS by CATEGORY:

For LEAD_NEW/LEAD_FOLLOWUP:
{
  "contact_name": "string",
  "contact_email": "string",
  "contact_phone": "string",
  "company_name": "string",
  "job_type": "painting|plumbing|electrical|hvac|general",
  "job_description": "string",
  "urgency": "low|normal|high|emergency",
  "preferred_time_window": "string",
  "budget_range": "string"
}

For BILLING_*:
{
  "direction": "incoming|outgoing",
  "amount": number,
  "currency": "USD",
  "invoice_number": "string",
  "due_date": "YYYY-MM-DD",
  "status": "open|paid|overdue|cancelled"
}

For SCHEDULING_*:
{
  "requested_dates": ["YYYY-MM-DD"],
  "confirmed_date": "YYYY-MM-DD",
  "location": "string",
  "job_reference": "string"
}

For VENDOR_RECEIPT:
{
  "vendor_name": "string",
  "items": [{"name": "string", "quantity": number, "price": number, "category": "materials|tools|equipment|services"}],
  "total_amount": number,
  "tools_breakdown": number,
  "materials_breakdown": number
}

For all categories, optionally include:
{
  "key_topics": ["topic1", "topic2"],
  "sentiment": "positive|neutral|negative",
  "response_deadline": "YYYY-MM-DD HH:mm",
  "follow_up_date": "YYYY-MM-DD"
}`;

  const startTime = Date.now();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  });

  const processingTime = Date.now() - startTime;

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No content received from OpenAI');
  }

  const result = JSON.parse(content) as OpenAIEmailAnalysisResult;

  // Validate the result
  if (!isValidAnalysisResult(result)) {
    throw new Error('Invalid analysis result structure from OpenAI');
  }

  return {
    ...result,
    processing_time_ms: processingTime,
  };
}

/**
 * Extract basic email data from raw Gmail API response
 */
function extractEmailDataFromRaw(rawData: any): {
  subject?: string;
  from?: string;
  body?: string;
  received_at?: string;
} {
  const headers = rawData.payload?.headers || [];
  const getHeader = (name: string) => {
    const header = headers.find(
      (h: any) => h.name.toLowerCase() === name.toLowerCase()
    );
    return header?.value;
  };

  const subject = getHeader('Subject');
  const from = getHeader('From');
  const receivedAt = getHeader('Date');

  // Extract body text
  let body = '';
  const extractBody = (part: any) => {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      body = Buffer.from(part.body.data, 'base64').toString();
    } else if (part.parts) {
      part.parts.forEach(extractBody);
    }
  };

  if (rawData.payload?.parts) {
    rawData.payload.parts.forEach(extractBody);
  } else if (rawData.payload?.body?.data) {
    body = Buffer.from(rawData.payload.body.data, 'base64').toString();
  }

  return {
    subject,
    from,
    body: body.substring(0, 5000), // Limit body size
    received_at: receivedAt,
  };
}

/**
 * Validate OpenAI analysis result structure
 */
function isValidAnalysisResult(
  result: any
): result is OpenAIEmailAnalysisResult {
  const validCategories: EmailCategory[] = [
    'LEAD_NEW',
    'LEAD_FOLLOWUP',
    'BILLING_INCOMING_INVOICE',
    'BILLING_OUTGOING_INVOICE',
    'BILLING_PAYMENT_RECEIVED',
    'BILLING_PAYMENT_ISSUE',
    'SCHEDULING_REQUEST',
    'SCHEDULING_CHANGE',
    'CUSTOMER_SUPPORT',
    'VENDOR_RECEIPT',
    'SYSTEM_SECURITY',
    'NEWSLETTER_PROMO',
    'SPAM_OTHER',
  ];

  const validPriorities = ['low', 'medium', 'high', 'urgent'];

  return (
    result &&
    typeof result.category === 'string' &&
    validCategories.includes(result.category) &&
    typeof result.priority === 'string' &&
    validPriorities.includes(result.priority) &&
    typeof result.is_action_required === 'boolean' &&
    typeof result.summary === 'string' &&
    typeof result.details === 'object' &&
    typeof result.confidence_score === 'number' &&
    result.confidence_score >= 0 &&
    result.confidence_score <= 1
  );
}

/**
 * Store email insight in database
 */
export async function storeEmailInsight(
  emailRawId: string,
  analysis: OpenAIEmailAnalysisResult,
  processingTimeMs: number
): Promise<EmailInsight> {
  const { data, error } = await supabase
    .from('email_insights')
    .insert([
      {
        email_raw_id: emailRawId,
        category: analysis.category,
        priority: analysis.priority,
        is_action_required: analysis.is_action_required,
        summary: analysis.summary,
        details: analysis.details,
        confidence_score: analysis.confidence_score,
        ai_model_version: 'gpt-4o-mini',
        processing_time_ms: processingTimeMs,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error storing email insight:', error);
    throw new Error('Failed to store email insight');
  }

  return data;
}

/**
 * Update email raw processing status
 */
export async function updateEmailRawStatus(
  emailRawId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  error?: string
): Promise<void> {
  const { error: updateError } = await supabase
    .from('emails_raw')
    .update({
      processing_status: status,
      processing_error: error,
      processed_at:
        status === 'completed' ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', emailRawId);

  if (updateError) {
    console.error('Error updating email raw status:', updateError);
    throw new Error('Failed to update email raw status');
  }
}
