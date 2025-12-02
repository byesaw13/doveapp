/**
 * Webhook Client for sending summaries to DoveApp
 */

import { Env } from './index';

export interface WebhookPayload {
  gmailId: string;
  gmailThreadId: string;
  from: string;
  subject: string;
  receivedAt: string;
  snippet: string;
  summary: string;
  category: string;
  priority: string;
  actionRequired: boolean;
  actionType: string;
  actionItems: string[];
  extractedData: any;
}

export class WebhookClient {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  /**
   * Send email summary to webhook endpoint
   */
  async sendSummary(payload: WebhookPayload): Promise<void> {
    const response = await fetch(this.env.WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.env.WEBHOOK_SECRET}`,
        'X-Worker-Source': 'doveapp-email-monitor',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Webhook error: ${response.status} ${error}`);
    }

    console.log(`✅ Webhook sent successfully for email ${payload.gmailId}`);
  }
}
