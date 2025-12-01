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
    const alert: Omit<IntelligenceAlert, 'id' | 'created_at' | 'updated_at'> = {
      email_insight_id: insight.id,
      type: alertData.type,
      severity: alertData.severity,
      title: alertData.title,
      message: alertData.message,
      due_at: alertData.due_at,
      resolved: false,
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
  due_at?: string;
} | null {
  const { category, priority, details, summary } = insight;

  switch (category) {
    case 'LEAD_NEW':
      return {
        type: 'lead',
        severity:
          priority === 'urgent'
            ? 'urgent'
            : priority === 'high'
              ? 'high'
              : 'medium',
        title: `New Lead: ${details.contact_name || 'Unknown Contact'}`,
        message: `${summary}. ${details.job_type ? `Service: ${details.job_type}.` : ''} ${details.urgency === 'emergency' ? 'URGENT: Emergency request!' : ''}`,
        due_at: details.response_deadline,
      };

    case 'LEAD_FOLLOWUP':
      return {
        type: 'lead',
        severity: priority === 'urgent' ? 'urgent' : 'medium',
        title: `Lead Follow-up: ${details.contact_name || 'Existing Lead'}`,
        message: summary,
        due_at: details.follow_up_date,
      };

    case 'BILLING_INCOMING_INVOICE':
      if (details.due_date) {
        const dueDate = new Date(details.due_date);
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
          message: `$${details.amount} ${details.invoice_number ? `(${details.invoice_number})` : ''} from ${details.vendor_name || 'vendor'} is ${daysUntilDue <= 0 ? 'overdue' : 'due'}.`,
          due_at: details.due_date,
        };
      }
      return {
        type: 'billing',
        severity: 'medium',
        title: 'New Vendor Invoice',
        message: `$${details.amount} ${details.invoice_number ? `(${details.invoice_number})` : ''} received from ${details.vendor_name || 'vendor'}.`,
      };

    case 'BILLING_OUTGOING_INVOICE':
      return {
        type: 'billing',
        severity: 'low',
        title: 'Customer Invoice Reply',
        message: summary,
      };

    case 'BILLING_PAYMENT_RECEIVED':
      return {
        type: 'billing',
        severity: 'low',
        title: 'Payment Received',
        message: `$${details.amount} payment received. ${details.invoice_number ? `Applied to ${details.invoice_number}.` : ''}`,
      };

    case 'BILLING_PAYMENT_ISSUE':
      return {
        type: 'billing',
        severity: 'high',
        title: 'Payment Issue Detected',
        message: summary,
        due_at: details.due_date,
      };

    case 'SCHEDULING_REQUEST':
      return {
        type: 'scheduling',
        severity: priority === 'urgent' ? 'urgent' : 'high',
        title: 'New Scheduling Request',
        message: `${summary}. ${details.requested_dates ? `Requested dates: ${details.requested_dates.join(', ')}` : ''}`,
        due_at: details.response_deadline,
      };

    case 'SCHEDULING_CHANGE':
      const changeUrgency = details.confirmed_date
        ? Math.ceil(
            (new Date(details.confirmed_date).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          ) <= 2
        : false;

      return {
        type: 'scheduling',
        severity: changeUrgency ? 'urgent' : 'high',
        title: 'Schedule Change Request',
        message: summary,
        due_at: details.confirmed_date,
      };

    case 'CUSTOMER_SUPPORT':
      return {
        type: 'support',
        severity:
          priority === 'urgent'
            ? 'urgent'
            : details.sentiment === 'negative'
              ? 'high'
              : 'medium',
        title: 'Customer Support Request',
        message: summary,
        due_at: details.response_deadline,
      };

    case 'SYSTEM_SECURITY':
      return {
        type: 'security',
        severity: 'urgent',
        title: 'Security Alert',
        message: summary,
      };

    default:
      return null; // No alert for other categories
  }
}

/**
 * Create an alert in the database
 */
export async function createAlert(
  alert: Omit<IntelligenceAlert, 'id' | 'created_at' | 'updated_at'>
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
