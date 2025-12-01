import { NextRequest, NextResponse } from 'next/server';
import { getEmailInsights } from '@/lib/email-processing-pipeline';
import { getAlerts } from '@/lib/email-alerts';

export interface DailySummary {
  date: string;
  summary: {
    new_leads_count: number;
    billing_events_count: number;
    scheduling_requests_count: number;
    support_requests_count: number;
    security_alerts_count: number;
    high_priority_alerts_count: number;
    urgent_alerts_count: number;
  };
  details: {
    new_leads: Array<{
      id: string;
      category: string;
      summary: string;
      contact_name?: string | null;
      contact_email?: string | null;
      priority: string;
      created_at: string;
    }>;
    billing_events: Array<{
      id: string;
      category: string;
      summary: string;
      amount?: number | null;
      due_date?: string | null;
      priority: string;
      created_at: string;
    }>;
    scheduling_requests: Array<{
      id: string;
      category: string;
      summary: string;
      requested_dates?: string[] | null;
      priority: string;
      created_at: string;
    }>;
    support_requests: Array<{
      id: string;
      category: string;
      summary: string;
      sentiment?: string;
      priority: string;
      created_at: string;
    }>;
    security_alerts: Array<{
      id: string;
      category: string;
      summary: string;
      priority: string;
      created_at: string;
    }>;
    high_priority_alerts: Array<{
      id: string;
      type: string;
      severity: string;
      title: string;
      message: string;
      created_at: string;
    }>;
  };
}

/**
 * GET /api/email-intelligence/daily-summary
 * Returns daily summary of email intelligence for dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Get date range (today by default, or specified date)
    const url = new URL(request.url);
    const dateParam = url.searchParams.get('date');
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    // Set to start of day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(
      `📊 Generating daily summary for ${startOfDay.toISOString().split('T')[0]}`
    );

    // Get insights from today
    const insights = await getEmailInsights({
      limit: 100, // Get plenty to filter
    });

    // Filter to today's insights
    const todaysInsights = insights.filter((insight) => {
      const createdAt = new Date(insight.created_at);
      return createdAt >= startOfDay && createdAt <= endOfDay;
    });

    // Get unresolved alerts
    const alerts = await getAlerts({
      resolved: false,
      limit: 50,
    });

    // Categorize insights
    const newLeads = todaysInsights.filter(
      (i) => i.category === 'LEAD_NEW' && i.is_action_required
    );

    const billingEvents = todaysInsights.filter(
      (i) => i.category.startsWith('BILLING_') && i.is_action_required
    );

    const schedulingRequests = todaysInsights.filter(
      (i) => i.category.startsWith('SCHEDULING_') && i.is_action_required
    );

    const supportRequests = todaysInsights.filter(
      (i) => i.category === 'CUSTOMER_SUPPORT' && i.is_action_required
    );

    const securityAlerts = todaysInsights.filter(
      (i) => i.category === 'SYSTEM_SECURITY'
    );

    // Get high priority alerts
    const highPriorityAlerts = alerts.filter(
      (a) => a.priority === 'high' || a.priority === 'urgent'
    );

    const summary: DailySummary = {
      date: startOfDay.toISOString().split('T')[0],
      summary: {
        new_leads_count: newLeads.length,
        billing_events_count: billingEvents.length,
        scheduling_requests_count: schedulingRequests.length,
        support_requests_count: supportRequests.length,
        security_alerts_count: securityAlerts.length,
        high_priority_alerts_count: highPriorityAlerts.filter(
          (a) => a.priority === 'high'
        ).length,
        urgent_alerts_count: highPriorityAlerts.filter(
          (a) => a.priority === 'urgent'
        ).length,
      },
      details: {
        new_leads: newLeads.slice(0, 10).map((insight) => ({
          id: insight.id,
          category: insight.category,
          summary: insight.summary || 'New lead inquiry',
          contact_name: insight.details?.lead?.customer_name,
          contact_email: insight.details?.lead?.customer_email,
          priority: insight.priority,
          created_at: insight.created_at,
        })),
        billing_events: billingEvents.slice(0, 10).map((insight) => ({
          id: insight.id,
          category: insight.category,
          summary: insight.summary || 'Billing event',
          amount: insight.details?.billing?.amount,
          due_date: insight.details?.billing?.due_date,
          priority: insight.priority,
          created_at: insight.created_at,
        })),
        scheduling_requests: schedulingRequests.slice(0, 10).map((insight) => ({
          id: insight.id,
          category: insight.category,
          summary: insight.summary || 'Scheduling request received',
          requested_dates: insight.details?.scheduling?.requested_dates,
          priority: insight.priority,
          created_at: insight.created_at,
        })),
        support_requests: supportRequests.slice(0, 10).map((insight) => ({
          id: insight.id,
          category: insight.category,
          summary: insight.summary || 'Customer support needed',
          sentiment: undefined, // Not available in new schema
          priority: insight.priority,
          created_at: insight.created_at,
        })),
        security_alerts: securityAlerts.slice(0, 10).map((insight) => ({
          id: insight.id,
          category: insight.category,
          summary: insight.summary || 'Security event detected',
          priority: insight.priority,
          created_at: insight.created_at,
        })),
        high_priority_alerts: highPriorityAlerts.slice(0, 15).map((alert) => ({
          id: alert.id,
          type: alert.type,
          severity: alert.priority,
          title: alert.title,
          message: alert.message,
          created_at: alert.created_at,
        })),
      },
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error generating daily summary:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to generate daily summary';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
