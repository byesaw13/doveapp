/**
 * OpenAI Client for Email Summarization
 */

import { Env } from './index';
import { GmailEmail } from './gmail';

export interface EmailSummary {
  summary: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionRequired: boolean;
  actionType: string;
  actionItems: string[];
  extractedData: any;
}

export class OpenAIClient {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  /**
   * Summarize email using OpenAI
   */
  async summarizeEmail(email: GmailEmail): Promise<EmailSummary> {
    const prompt = `You are the Dovetails Email Intelligence Engine.

Your job is to read one email and return a STRICT JSON object with summarization and categorization.

The business is Dovetails Services LLC - a solo home services company doing handyman, home maintenance, and interior painting work.

Valid categories are:
- LEAD_NEW (new customer inquiry)
- LEAD_FOLLOWUP (follow-up from existing lead)
- BILLING_INCOMING_INVOICE (vendor invoice)
- BILLING_OUTGOING_INVOICE (invoice sent to customer)
- BILLING_PAYMENT_RECEIVED (payment confirmation)
- BILLING_PAYMENT_ISSUE (payment problem)
- SCHEDULING_REQUEST (customer wants to schedule)
- SCHEDULING_CHANGE (reschedule/cancellation)
- CUSTOMER_SUPPORT (customer needs help)
- VENDOR_RECEIPT (receipt from vendor)
- SYSTEM_SECURITY (account security alerts)
- NEWSLETTER_PROMO (marketing/newsletters)
- SPAM_OTHER (spam or irrelevant)

Rules:
- ALWAYS pick exactly one category
- ALWAYS return valid JSON
- Be conservative with 'urgent' - save it for time-sensitive items
- Extract actionable items clearly
- For leads, extract contact info and job details

Output schema:
{
  "summary": string (1-2 sentences),
  "category": string (one of the categories above),
  "priority": "low" | "medium" | "high" | "urgent",
  "actionRequired": boolean,
  "actionType": "respond_to_lead" | "send_invoice" | "review_invoice" | "record_payment" | "confirm_schedule" | "reschedule" | "resolve_issue" | "file_for_records" | "none",
  "actionItems": string[] (list of specific actions to take),
  "extractedData": {
    // For LEAD_*:
    "lead": {
      "customer_name": string | null,
      "customer_email": string | null,
      "customer_phone": string | null,
      "job_type": string | null,
      "job_description": string | null,
      "urgency": "low" | "medium" | "high" | null,
      "budget_range": string | null
    },
    // For BILLING_*:
    "billing": {
      "amount": number | null,
      "invoice_number": string | null,
      "vendor_name": string | null,
      "due_date": string | null
    },
    // For SCHEDULING_*:
    "scheduling": {
      "requested_dates": string[] | null,
      "location_address": string | null
    }
  }
}

EMAIL TO ANALYZE:
Subject: ${email.subject || 'No subject'}
From: ${email.from || 'Unknown'}
Date: ${email.receivedAt}
Body: ${email.bodyText || email.snippet || 'No content'}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    if (!content) {
      throw new Error('No content from OpenAI');
    }

    const summary: EmailSummary = JSON.parse(content);
    return summary;
  }
}
