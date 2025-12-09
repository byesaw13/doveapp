import { scheduleAutomation } from '@/lib/db/automations';
import { getEstimate } from '@/lib/db/estimates';
import { getInvoiceByIdWithRelations } from '@/lib/db/invoices';
import { getJob } from '@/lib/db/jobs';
import { getLead } from '@/lib/db/leads';
import type { AutomationRecord } from '@/types/automation';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export async function scheduleEstimateFollowUp(
  estimateId: string
): Promise<AutomationRecord | null> {
  const estimate = await getEstimate(estimateId);
  if (!estimate) return null;

  const baseDate = estimate.sent_date
    ? new Date(estimate.sent_date)
    : new Date();
  const runAt = new Date(baseDate.getTime() + 48 * HOUR);

  return scheduleAutomation({
    type: 'estimate_followup',
    relatedId: estimateId,
    runAt,
    payload: {
      estimate_number: estimate.estimate_number,
      client_id: estimate.client_id,
      status: estimate.status,
    },
  });
}

export async function scheduleInvoiceFollowUps(
  invoiceId: string
): Promise<AutomationRecord[]> {
  const automations: AutomationRecord[] = [];
  const invoice = await getInvoiceByIdWithRelations(invoiceId);
  if (!invoice) return automations;
  if (invoice.status === 'paid' || invoice.status === 'void')
    return automations;

  const baseDate = invoice.issue_date
    ? new Date(`${invoice.issue_date}T00:00:00Z`)
    : new Date();

  const followUpDays = [3, 7, 14, 30];
  for (const days of followUpDays) {
    const runAt = new Date(baseDate.getTime() + days * DAY);
    const scheduled = await scheduleAutomation({
      type: 'invoice_followup',
      relatedId: invoiceId,
      runAt,
      payload: {
        invoice_number: invoice.invoice_number,
        customer_id: invoice.customer_id,
        due_date: invoice.due_date,
        sequence_days: days,
      },
    });

    if (scheduled) {
      automations.push(scheduled);
    }
  }

  return automations;
}

export async function scheduleJobCompletionAutomations(
  jobId: string
): Promise<AutomationRecord[]> {
  const automations: AutomationRecord[] = [];
  const job = await getJob(jobId);
  if (!job || job.status !== 'completed') return automations;

  const baseDate = job.updated_at ? new Date(job.updated_at) : new Date();

  const closeoutRunAt = new Date(baseDate.getTime() + 1 * HOUR);
  const closeout = await scheduleAutomation({
    type: 'job_closeout',
    relatedId: jobId,
    runAt: closeoutRunAt,
    payload: {
      job_number: job.job_number,
      client_id: job.client_id,
    },
  });

  if (closeout) automations.push(closeout);

  const reviewRunAt = new Date(baseDate.getTime() + 24 * HOUR);
  const review = await scheduleAutomation({
    type: 'review_request',
    relatedId: jobId,
    runAt: reviewRunAt,
    payload: {
      job_number: job.job_number,
      client_id: job.client_id,
    },
  });

  if (review) automations.push(review);

  return automations;
}

export async function scheduleLeadResponse(
  leadId: string
): Promise<AutomationRecord | null> {
  const lead = await getLead(leadId);
  if (!lead) return null;

  const runAt = lead.created_at ? new Date(lead.created_at) : new Date();

  return scheduleAutomation({
    type: 'lead_response',
    relatedId: leadId,
    runAt,
    payload: {
      lead_id: leadId,
      priority: lead.priority,
      service_type: lead.service_type,
    },
  });
}
