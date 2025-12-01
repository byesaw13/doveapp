import { EmailInsight, IntelligenceAlert } from '@/types/database';
import { supabase } from '@/lib/supabase';

export type AlertType =
  | 'lead'
  | 'billing'
  | 'scheduling'
  | 'support'
  | 'security';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Generate alerts based on email insights
 */
export async function generateAlertsFromInsight(
  insight: EmailInsight
): Promise<IntelligenceAlert[]> {
  const alerts: IntelligenceAlert[] = [];

  if (!insight.is_action_required) {
    return alerts; // No alerts needed
  }

  const alertData = getAlertDataForCategory(insight);

  if (alertData) {
    const alert: Omit<IntelligenceAlert, 'id' | 'created_at'> = {
      email_id: insight.email_id,
      type: alertData.type,
      priority: alertData.severity,
      title: alertData.title,
      message: alertData.message || '',
      status: 'open',
    };

    const createdAlert = await createAlert(alert);
    alerts.push(createdAlert);
  }

  return alerts;
}

/**
 * Determine alert data based on email category and details
 */
export function getAlertDataForCategory(insight: EmailInsight): {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  due_at?: string | null;
} | null {
  const { category, priority, details, summary } = insight;

  switch (category) {
    case 'LEAD_NEW':
      const leadData = details?.lead;
      return {
        type: 'lead',
        severity:
          priority === 'urgent'
            ? 'urgent'
            : priority === 'high'
              ? 'high'
              : 'medium',
        title: `New Lead: ${leadData?.customer_name || 'Unknown Contact'}`,
        message:
          `${summary || 'New lead inquiry'}. ${leadData?.job_type ? `Service: ${leadData.job_type}.` : ''} ${leadData?.urgency === 'high' ? 'URGENT: High priority request!' : ''}`.trim(),
        due_at: undefined,
      };

    case 'LEAD_FOLLOWUP':
      return {
        type: 'lead',
        severity: priority === 'urgent' ? 'urgent' : 'medium',
        title: `Lead Follow-up: ${details?.lead?.customer_name || 'Existing Lead'}`,
        message: String(summary || 'Lead requires follow-up'),
        due_at: undefined,
      };

    case 'BILLING_INCOMING_INVOICE':
      const billingData = details?.billing;
      if (billingData?.due_date) {
        const dueDate = new Date(billingData.due_date);
        const daysUntilDue = Math.ceil(
          (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        return {
          type: 'billing',
          severity:
            daysUntilDue <= 1
              ? 'urgent'
              : daysUntilDue <= 7
                ? 'high'
                : 'medium',
          title: `Invoice Due ${daysUntilDue <= 0 ? 'Overdue' : `in ${daysUntilDue} days`}`,
          message: `$${billingData.amount || 0} ${billingData.invoice_number ? `(${billingData.invoice_number})` : ''} from ${billingData.vendor_or_client_name || 'vendor'} is ${daysUntilDue <= 0 ? 'overdue' : 'due'}.`,
          due_at: billingData.due_date,
        };
      }
      return {
        type: 'billing',
        severity: 'medium',
        title: 'New Vendor Invoice',
        message: `$${billingData?.amount || 0} ${billingData?.invoice_number ? `(${billingData.invoice_number})` : ''} received from ${billingData?.vendor_or_client_name || 'vendor'}.`,
      };

    case 'BILLING_OUTGOING_INVOICE':
      return {
        type: 'billing',
        severity: 'low',
        title: 'Customer Invoice Reply',
        message: summary || 'Customer responded to invoice',
      };

    case 'BILLING_PAYMENT_RECEIVED':
      return {
        type: 'billing',
        severity: 'low',
        title: 'Payment Received',
        message: `$${details?.billing?.amount || 0} payment received. ${details?.billing?.invoice_number ? `Applied to ${details.billing.invoice_number}.` : ''}`,
      };

    case 'BILLING_PAYMENT_ISSUE':
      return {
        type: 'billing',
        severity: 'high',
        title: 'Payment Issue Detected',
        message: summary || 'Payment issue requires attention',
        due_at: details?.billing?.due_date,
      };

    case 'SCHEDULING_REQUEST':
      return {
        type: 'scheduling',
        severity: priority === 'urgent' ? 'urgent' : 'high',
        title: 'New Scheduling Request',
        message: `${summary || 'Scheduling request received'}. ${details?.scheduling?.requested_dates ? `Requested dates: ${details.scheduling.requested_dates.join(', ')}` : ''}`,
        due_at: undefined,
      };

    case 'SCHEDULING_CHANGE':
      const confirmedDate = details?.scheduling?.confirmed_date;
      const changeUrgency = confirmedDate
        ? Math.ceil(
            (new Date(confirmedDate).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          ) <= 2
        : false;

      return {
        type: 'scheduling',
        severity: changeUrgency ? 'urgent' : 'high',
        title: 'Schedule Change Request',
        message: summary || 'Schedule change requested',
        due_at: confirmedDate,
      };

    case 'CUSTOMER_SUPPORT':
      return {
        type: 'support',
        severity: priority === 'urgent' ? 'urgent' : 'medium',
        title: 'Customer Support Request',
        message: summary || 'Customer support needed',
        due_at: undefined,
      };

    case 'SYSTEM_SECURITY':
      return {
        type: 'security',
        severity: 'urgent',
        title: 'Security Alert',
        message: summary || 'Security event detected',
      };

    default:
      return null; // No alert for other categories
  }
}

/**
 * Create an alert in the database
 */
export async function createAlert(
  alert: Omit<IntelligenceAlert, 'id' | 'created_at'>
): Promise<IntelligenceAlert> {
  const { data, error } = await supabase
    .from('alerts')
    .insert([alert])
    .select()
    .single();

  if (error) {
    console.error('Error creating alert:', error);
    throw new Error('Failed to create alert');
  }

  return data;
}

/**
 * Get alerts with optional filtering
 */
export async function getAlerts(
  options: {
    type?: AlertType;
    severity?: AlertSeverity;
    resolved?: boolean;
    limit?: number;
  } = {}
): Promise<IntelligenceAlert[]> {
  let query = supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (options.type) {
    query = query.eq('type', options.type);
  }

  if (options.severity) {
    query = query.eq('severity', options.severity);
  }

  if (options.resolved !== undefined) {
    query = query.eq('resolved', options.resolved);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching alerts:', error);
    throw new Error('Failed to fetch alerts');
  }

  return data || [];
}

/**
 * Resolve an alert
 */
export async function resolveAlert(
  alertId: string,
  resolutionNotes?: string
): Promise<IntelligenceAlert> {
  const { data, error } = await supabase
    .from('alerts')
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolution_notes: resolutionNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select()
    .single();

  if (error) {
    console.error('Error resolving alert:', error);
    throw new Error('Failed to resolve alert');
  }

  return data;
}
