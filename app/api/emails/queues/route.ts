// Smart inbox queues API
// GET /api/emails/queues - Get smart inbox queues

import { NextRequest, NextResponse } from 'next/server';
import { getEmailMessages, getAlerts, getBillingEvents } from '@/lib/db/email';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queue = searchParams.get('queue') || 'priority';

    switch (queue) {
      case 'priority':
        // Today's Priority: emails with requires_reply = true or high-severity alerts
        const priorityEmails = await getEmailMessages(undefined, undefined, 50);
        const priorityFiltered = priorityEmails.filter(
          (email) => email.requires_reply
        );

        const alerts = await getAlerts('new_lead', 'high', false, 20);
        const invoiceAlerts = await getAlerts('invoice_due', 'high', false, 20);
        const overdueAlerts = await getAlerts(
          'invoice_overdue',
          'high',
          false,
          20
        );

        return NextResponse.json({
          emails: priorityFiltered,
          alerts: [...alerts, ...invoiceAlerts, ...overdueAlerts],
        });

      case 'leads':
        // Leads: emails with category = leads, sorted by received_at
        const leadEmails = await getEmailMessages(undefined, 'leads', 50);
        return NextResponse.json({
          emails: leadEmails,
        });

      case 'money':
        // Money: emails with billing events, summarized by status
        const billingEvents = await getBillingEvents(undefined, undefined, 100);
        const openInvoices = billingEvents.filter(
          (e) => e.billing_type === 'customer_invoice' && e.status === 'open'
        );
        const overdueInvoices = billingEvents.filter(
          (e) => e.status === 'overdue'
        );
        const paidInvoices = billingEvents.filter((e) => e.status === 'paid');

        return NextResponse.json({
          summary: {
            open_invoices: openInvoices.length,
            overdue_invoices: overdueInvoices.length,
            paid_recently: paidInvoices.length,
          },
          events: billingEvents.slice(0, 20), // Most recent 20
        });

      default:
        return NextResponse.json(
          { error: 'Invalid queue type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching smart queue:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch smart queue';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
