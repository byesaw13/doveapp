import type { Estimate } from '@/types/estimate';
import type { InvoiceWithRelations } from '@/types/invoice';
import type { JobWithDetails } from '@/types/job';
import type { Lead } from '@/types/lead';

async function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const { OpenAI } = await import('openai');

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

async function generateMessage(prompt: string): Promise<string> {
  const openai = await getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 220,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No content received from OpenAI');
  }

  return content.trim();
}

export async function generateEstimateFollowUp(
  estimate: Estimate
): Promise<string> {
  const prompt = `You are following up on a home services estimate.

Context:
- Estimate #: ${estimate.estimate_number}
- Title: ${estimate.title}
- Status: ${estimate.status}
- Summary: ${estimate.description || 'Not provided'}

Write a friendly, concise follow-up (3-5 sentences) that:
- Invites questions and offers to adjust scope if needed
- Encourages moving forward without mentioning pricing or discounts
- Avoids promises about scheduling or availability beyond offering to help
- Stays professional and supportive

Return only the message.`;

  return generateMessage(prompt);
}

export async function generateInvoiceFollowUp(
  invoice: InvoiceWithRelations,
  daysOverdue: number
): Promise<string> {
  const clientName = invoice.customer
    ? `${invoice.customer.first_name || ''} ${invoice.customer.last_name || ''}`.trim()
    : 'the client';

  const prompt = `You are writing a polite invoice follow-up for a field service company.

Context:
- Invoice #: ${invoice.invoice_number}
- Client: ${clientName || 'the client'}
- Due date: ${invoice.due_date || 'not set'}
- Days overdue: ${Math.max(daysOverdue, 0)}
- Current status: ${invoice.status}

Guidelines:
- Do NOT include pricing, amounts, or payment links.
- Keep tone based on days overdue:
  - 0-3 days overdue: friendly check-in
  - 7+ days: direct but respectful reminder
  - 14+ days: firmer tone with clear next steps (e.g., offering help to complete payment)
- Offer assistance and invite questions, avoid promises about availability.
- Keep to 3-5 sentences, professional and calm.

Return only the message.`;

  return generateMessage(prompt);
}

export async function generateJobCloseout(
  job: JobWithDetails
): Promise<string> {
  const prompt = `Create a concise job closeout summary for a completed service visit.

Job Info:
- Job #: ${job.job_number}
- Title: ${job.title}
- Description: ${job.description || 'Not provided'}
- Service date: ${job.service_date || 'not recorded'}

Include:
- What was completed (plain language, no pricing)
- Preventative tips for the homeowner
- Any safety notes or observations
- Recommended next service interval (without commitments)

Keep it short (under 150 words), factual, and avoid guarantees or pricing.`;

  return generateMessage(prompt);
}

export async function generateReviewRequest(
  job: JobWithDetails
): Promise<string> {
  const customerName = job.client
    ? `${job.client.first_name || ''} ${job.client.last_name || ''}`.trim()
    : 'there';

  const prompt = `Write a short, personalized review request to a customer after a completed job.

Details:
- Customer name: ${customerName || 'there'}
- Job title: ${job.title}
- Job #: ${job.job_number}

Guidelines:
- Thank them for choosing the team
- Ask for a brief review on their preferred platform (e.g., Google) without providing a link
- Keep tone warm, professional, and concise (2-4 sentences)
- No promises about discounts, future work, or timing.`;

  return generateMessage(prompt);
}

export async function generateLeadResponse(lead: Lead): Promise<string> {
  const prompt = `You are responding to a new lead for home services.

Lead Info:
- Name: ${lead.first_name} ${lead.last_name}
- Service type: ${lead.service_type || 'General service'}
- Description: ${lead.service_description || 'No description provided'}
- City/State: ${
    lead.city && lead.state
      ? `${lead.city}, ${lead.state}`
      : lead.city || lead.state || 'Not provided'
  }

Write a helpful reply that:
- Acknowledges their request and thanks them for reaching out
- Asks 2-3 clarifying questions about scope and timing
- Provides general guidance on next steps without quoting pricing or committing to specific dates
- Invites them to book an estimate or call to discuss
- Stays concise (3-5 sentences), professional, and safety-conscious.

Return only the message.`;

  return generateMessage(prompt);
}
