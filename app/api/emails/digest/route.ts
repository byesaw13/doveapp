// Daily digest API
// GET /api/emails/digest - Get daily summary

import { NextRequest, NextResponse } from 'next/server';
import { getAlerts, getBillingEvents, getLeads } from '@/lib/db/email';

export async function GET(request: NextRequest) {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // New leads from today
    const allLeads = await getLeads();
    const todaysLeads = allLeads.filter((lead) => {
      const createdAt = new Date(lead.created_at);
      return createdAt >= today && createdAt < tomorrow;
    });

    // Open/unpaid invoices
    const billingEvents = await getBillingEvents();
    const openInvoices = billingEvents.filter(
      (e) =>
        e.billing_type === 'customer_invoice' &&
        (e.status === 'open' || e.status === 'overdue')
    );

    // Large vendor bills from today
    const todaysVendorBills = billingEvents.filter((e) => {
      const createdAt = new Date(e.created_at);
      return (
        createdAt >= today &&
        createdAt < tomorrow &&
        e.billing_type === 'vendor_bill' &&
        e.amount > 300
      );
    });

    // High priority alerts
    const highAlerts = await getAlerts(undefined, 'high', false, 10);

    const digest = {
      date: today.toISOString().split('T')[0],
      summary: {
        new_leads_count: todaysLeads.length,
        open_invoices_count: openInvoices.length,
        overdue_invoices_count: openInvoices.filter(
          (e) => e.status === 'overdue'
        ).length,
        large_vendor_bills_count: todaysVendorBills.length,
        high_priority_alerts_count: highAlerts.length,
      },
      details: {
        new_leads: todaysLeads.slice(0, 5).map((lead) => ({
          name: lead.contact_name,
          email: lead.contact_email,
          service: lead.service_type,
          priority: lead.priority,
        })),
        open_invoices: openInvoices.slice(0, 5).map((inv) => ({
          amount: inv.amount,
          invoice_number: inv.invoice_number,
          due_date: inv.due_date,
          status: inv.status,
        })),
        large_vendor_bills: todaysVendorBills.map((bill) => ({
          vendor: bill.vendor_name,
          amount: bill.amount,
          description: bill.reference,
        })),
        high_alerts: highAlerts.map((alert) => ({
          type: alert.type,
          title: alert.title,
          severity: alert.severity,
        })),
      },
    };

    return NextResponse.json(digest);
  } catch (error) {
    console.error('Error generating digest:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to generate digest';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
