import { NextResponse } from 'next/server';
import {
  generateEstimateFollowUp,
  generateInvoiceFollowUp,
  generateJobCloseout,
  generateLeadResponse,
  generateReviewRequest,
} from '@/lib/ai/automations';
import {
  claimAutomation,
  getAutomationSettings,
  getDueAutomations,
  isAutomationEnabledForSettings,
  recordAutomationHistory,
  updateAutomationStatus,
} from '@/lib/db/automations';
import { getEstimate } from '@/lib/db/estimates';
import { getInvoiceByIdWithRelations } from '@/lib/db/invoices';
import { getJob } from '@/lib/db/jobs';
import { getLead } from '@/lib/db/leads';
import type { AutomationRecord, AutomationSettings } from '@/types/automation';

const DAY_MS = 24 * 60 * 60 * 1000;

async function processEstimateFollowup(
  automation: AutomationRecord
): Promise<void> {
  const estimateId = automation.related_id;
  if (!estimateId) {
    await updateAutomationStatus(
      automation.id,
      'failed',
      { error: 'Missing related estimate' },
      'Failed: Missing related estimate ID'
    );
    return;
  }

  const estimate = await getEstimate(estimateId);
  if (!estimate) {
    await updateAutomationStatus(
      automation.id,
      'failed',
      { error: 'Estimate not found' },
      'Failed: Estimate not found'
    );
    return;
  }

  if (['approved', 'accepted', 'declined'].includes(estimate.status)) {
    await updateAutomationStatus(
      automation.id,
      'completed',
      {
        skipped: true,
        reason: `Estimate status ${estimate.status}`,
      },
      'Skipped: Estimate already resolved'
    );
    return;
  }

  const message = await generateEstimateFollowUp(estimate);

  await updateAutomationStatus(
    automation.id,
    'completed',
    {
      message,
      estimate_id: estimate.id,
      type: 'estimate_followup',
    },
    'Completed estimate follow-up'
  );
  await recordAutomationHistory(
    automation.id,
    'completed',
    `AI response: ${message}`
  );
}

async function processInvoiceFollowup(
  automation: AutomationRecord
): Promise<void> {
  const invoiceId = automation.related_id;
  if (!invoiceId) {
    await updateAutomationStatus(
      automation.id,
      'failed',
      { error: 'Missing related invoice' },
      'Failed: Missing related invoice ID'
    );
    return;
  }

  const invoice = await getInvoiceByIdWithRelations(invoiceId);
  if (!invoice) {
    await updateAutomationStatus(
      automation.id,
      'failed',
      { error: 'Invoice not found' },
      'Failed: Invoice not found'
    );
    return;
  }

  if (invoice.status === 'paid' || invoice.status === 'void') {
    await updateAutomationStatus(
      automation.id,
      'completed',
      { skipped: true, reason: 'Invoice already closed' },
      'Skipped: Invoice already closed'
    );
    return;
  }

  let daysOverdue = 0;
  if (invoice.due_date) {
    const due = new Date(`${invoice.due_date}T00:00:00Z`).getTime();
    daysOverdue = Math.floor((Date.now() - due) / DAY_MS);
    if (Number.isNaN(daysOverdue) || daysOverdue < 0) daysOverdue = 0;
  }

  const message = await generateInvoiceFollowUp(invoice, daysOverdue);

  await updateAutomationStatus(
    automation.id,
    'completed',
    {
      message,
      invoice_id: invoice.id,
      days_overdue: daysOverdue,
      type: 'invoice_followup',
    },
    'Completed invoice follow-up'
  );
  await recordAutomationHistory(
    automation.id,
    'completed',
    `AI response: ${message}`
  );
}

async function processJobCloseout(automation: AutomationRecord): Promise<void> {
  const jobId = automation.related_id;
  if (!jobId) {
    await updateAutomationStatus(
      automation.id,
      'failed',
      { error: 'Missing related job' },
      'Failed: Missing related job ID'
    );
    return;
  }

  const job = await getJob(jobId);
  if (!job) {
    await updateAutomationStatus(
      automation.id,
      'failed',
      { error: 'Job not found' },
      'Failed: Job not found'
    );
    return;
  }

  if (job.status !== 'completed') {
    await updateAutomationStatus(
      automation.id,
      'completed',
      { skipped: true, reason: 'Job not completed' },
      'Skipped: Job not completed yet'
    );
    return;
  }

  const message = await generateJobCloseout(job);

  await updateAutomationStatus(
    automation.id,
    'completed',
    {
      message,
      job_id: job.id,
      type: 'job_closeout',
    },
    'Completed job closeout summary'
  );
  await recordAutomationHistory(
    automation.id,
    'completed',
    `AI response: ${message}`
  );
}

async function processReviewRequest(
  automation: AutomationRecord
): Promise<void> {
  const jobId = automation.related_id;
  if (!jobId) {
    await updateAutomationStatus(
      automation.id,
      'failed',
      { error: 'Missing related job' },
      'Failed: Missing related job ID'
    );
    return;
  }

  const job = await getJob(jobId);
  if (!job) {
    await updateAutomationStatus(
      automation.id,
      'failed',
      { error: 'Job not found' },
      'Failed: Job not found'
    );
    return;
  }

  if (!job.client || (!job.client.email && !job.client.phone)) {
    await updateAutomationStatus(
      automation.id,
      'failed',
      { error: 'Missing client contact' },
      'Failed: Missing client contact details'
    );
    return;
  }

  const message = await generateReviewRequest(job);

  await updateAutomationStatus(
    automation.id,
    'completed',
    {
      message,
      job_id: job.id,
      type: 'review_request',
    },
    'Completed review request message'
  );
  await recordAutomationHistory(
    automation.id,
    'completed',
    `AI response: ${message}`
  );
}

async function processLeadResponse(
  automation: AutomationRecord
): Promise<void> {
  const leadId = automation.related_id;
  if (!leadId) {
    await updateAutomationStatus(
      automation.id,
      'failed',
      { error: 'Missing related lead' },
      'Failed: Missing related lead ID'
    );
    return;
  }

  const lead = await getLead(leadId);
  if (!lead) {
    await updateAutomationStatus(
      automation.id,
      'failed',
      { error: 'Lead not found' },
      'Failed: Lead not found'
    );
    return;
  }

  if (['converted', 'lost', 'unqualified'].includes(lead.status)) {
    await updateAutomationStatus(
      automation.id,
      'completed',
      { skipped: true, reason: `Lead status ${lead.status}` },
      'Skipped: Lead no longer active'
    );
    return;
  }

  const message = await generateLeadResponse(lead);

  await updateAutomationStatus(
    automation.id,
    'completed',
    {
      message,
      lead_id: lead.id,
      type: 'lead_response',
    },
    'Completed lead response message'
  );
  await recordAutomationHistory(
    automation.id,
    'completed',
    `AI response: ${message}`
  );
}

async function processAutomation(
  automation: AutomationRecord,
  settings: AutomationSettings
): Promise<void> {
  if (!isAutomationEnabledForSettings(automation.type, settings)) {
    await updateAutomationStatus(
      automation.id,
      'completed',
      { skipped: true, reason: 'Automation disabled in settings' },
      'Skipped: Automation disabled in settings'
    );
    return;
  }

  switch (automation.type) {
    case 'estimate_followup':
      return processEstimateFollowup(automation);
    case 'invoice_followup':
      return processInvoiceFollowup(automation);
    case 'job_closeout':
      return processJobCloseout(automation);
    case 'review_request':
      return processReviewRequest(automation);
    case 'lead_response':
      return processLeadResponse(automation);
    default:
      await updateAutomationStatus(
        automation.id,
        'failed',
        { error: `Unknown automation type ${automation.type}` },
        'Failed: Unknown automation type'
      );
  }
}

async function runAutomations() {
  try {
    const settings = await getAutomationSettings();
    const dueAutomations = await getDueAutomations(25);
    const results: Array<{ id: string; type: string; status: string }> = [];

    for (const automation of dueAutomations) {
      const claimed = await claimAutomation(automation);
      if (!claimed) continue;

      try {
        await processAutomation(claimed, settings);
        results.push({
          id: claimed.id,
          type: claimed.type,
          status: 'processed',
        });
      } catch (error: any) {
        console.error('Automation processing failed', error);
        await updateAutomationStatus(
          claimed.id,
          'failed',
          { error: error?.message || 'Unknown error' },
          `Failed: ${error?.message || 'Unknown error'}`
        );
      }
    }

    return NextResponse.json({
      attempted: dueAutomations.length,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Automation runner failed', error);
    return NextResponse.json(
      { error: 'Failed to run automations' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return runAutomations();
}

export async function POST() {
  return runAutomations();
}
