import {
  EmailRaw,
  EmailInsight,
  EmailCategory,
  EmailInsightDetails,
  ActionType,
} from '@/types/database';
import { supabase } from '@/lib/supabase';

export interface OpenAIEmailAnalysisResult {
  category: EmailCategory;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_action_required: boolean;
  action_type: ActionType;
  summary: string;
  notes: string;
  details: EmailInsightDetails;
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
  const emailData = extractEmailDataFromRaw(emailRaw);

  const prompt = `You are the Dovetails Email Intelligence Engine.

Your job is to read one email (subject + body + headers) and return a STRICT JSON object with:
- One primary category
- Actionability
- Priority
- A short summary
- Structured details for my handyman/painting business

The business is a solo home services company (Dovetails Services LLC) doing handyman, home maintenance, and interior painting work.

Valid categories are:
- LEAD_NEW
- LEAD_FOLLOWUP
- BILLING_INCOMING_INVOICE
- BILLING_OUTGOING_INVOICE
- BILLING_PAYMENT_RECEIVED
- BILLING_PAYMENT_ISSUE
- SCHEDULING_REQUEST
- SCHEDULING_CHANGE
- CUSTOMER_SUPPORT
- VENDOR_RECEIPT
- SYSTEM_SECURITY
- NEWSLETTER_PROMO
- SPAM_OTHER

Rules:
- ALWAYS pick exactly one category.
- ALWAYS return valid JSON. No comments, no extra text.
- If you are unsure, pick the closest reasonable category and explain uncertainty in the "notes" field.
- Be conservative with \`urgent\`. Save it for time-sensitive or high-risk items.

Output schema (TypeScript style, but you must return JSON):

{
  "category": "LEAD_NEW" | "LEAD_FOLLOWUP" | "BILLING_INCOMING_INVOICE" | "BILLING_OUTGOING_INVOICE" | "BILLING_PAYMENT_RECEIVED" | "BILLING_PAYMENT_ISSUE" | "SCHEDULING_REQUEST" | "SCHEDULING_CHANGE" | "CUSTOMER_SUPPORT" | "VENDOR_RECEIPT" | "SYSTEM_SECURITY" | "NEWSLETTER_PROMO" | "SPAM_OTHER",
  "priority": "low" | "medium" | "high" | "urgent",
  "is_action_required": boolean,
  "action_type": "respond_to_lead" | "send_invoice" | "review_invoice" | "record_payment" | "confirm_schedule" | "reschedule" | "resolve_issue" | "file_for_records" | "none",
  "summary": string,
  "notes": string,
  "details": {
    // For LEAD_*:
    "lead": {
      "customer_name": string | null,
      "customer_email": string | null,
      "customer_phone": string | null,
      "customer_address": string | null,
      "job_type": string | null,
      "job_description": string | null,
      "urgency": "low" | "medium" | "high" | null,
      "preferred_time_window": string | null,
      "lead_source": string | null
    },

    // For BILLING_*:
    "billing": {
      "direction": "incoming" | "outgoing" | null,
      "amount": number | null,
      "currency": string | null,
      "invoice_number": string | null,
      "vendor_or_client_name": string | null,
      "due_date": string | null,          // ISO 8601 if possible
      "paid_date": string | null,         // ISO 8601 if applicable
      "status": "draft" | "sent" | "paid" | "overdue" | "disputed" | null
    },

    // For SCHEDULING_*:
    "scheduling": {
      "job_reference": string | null,
      "requested_dates": string[] | null, // e.g. ["2025-12-03", "next Tuesday afternoon"]
      "confirmed_date": string | null,
      "location_address": string | null
    },

    // For VENDOR_RECEIPT:
    "vendor": {
      "vendor_name": string | null,
      "order_number": string | null,
      "total_amount": number | null,
      "currency": string | null,
      "items": [
        {
          "name": string,
          "quantity": number | null,
          "unit_price": number | null,
          "category": "tool" | "material" | "consumable" | "other" | null
        }
      ],
      "is_primarily_tools": boolean | null,
      "is_primarily_materials": boolean | null
    },

    // For SYSTEM_SECURITY:
    "security": {
      "provider": string | null,
      "event_type": string | null,
      "severity": "low" | "medium" | "high" | "critical" | null
    }
  }
}

EMAIL TO ANALYZE:
Subject: ${emailData.subject || 'No subject'}
From: ${emailData.from || 'Unknown'}
Body: ${emailData.body || 'No content'}`;

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

  return result;
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
  // Since we're now storing structured data directly, just return what's available
  return {
    subject: rawData.subject,
    from: rawData.from_address,
    body: rawData.body_text,
    received_at: rawData.received_at,
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

  const validActionTypes: ActionType[] = [
    'respond_to_lead',
    'send_invoice',
    'review_invoice',
    'record_payment',
    'confirm_schedule',
    'reschedule',
    'resolve_issue',
    'file_for_records',
    'none',
  ];

  return (
    result &&
    typeof result.category === 'string' &&
    validCategories.includes(result.category) &&
    typeof result.priority === 'string' &&
    validPriorities.includes(result.priority) &&
    typeof result.is_action_required === 'boolean' &&
    typeof result.action_type === 'string' &&
    validActionTypes.includes(result.action_type) &&
    typeof result.summary === 'string' &&
    typeof result.notes === 'string' &&
    typeof result.details === 'object'
  );
}

/**
 * Store email insight in database
 */
export async function storeEmailInsight(
  emailRawId: string,
  analysis: OpenAIEmailAnalysisResult
): Promise<EmailInsight> {
  const { data, error } = await supabase
    .from('email_insights')
    .insert([
      {
        email_id: emailRawId,
        category: analysis.category,
        priority: analysis.priority,
        is_action_required: analysis.is_action_required,
        action_type: analysis.action_type,
        summary: analysis.summary,
        notes: analysis.notes,
        details: analysis.details,
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
