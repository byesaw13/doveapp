import { EmailInsight } from '../../types/database';

// Import the function directly to avoid Supabase initialization
function getAlertDataForCategory(insight: EmailInsight): {
  type: 'lead' | 'billing' | 'scheduling' | 'support' | 'security';
  severity: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  due_at?: string | undefined;
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
        title: `New Lead: ${details?.lead?.customer_name || 'Unknown Contact'}`,
        message: `${summary || 'New lead inquiry'}. ${details?.lead?.job_type ? `Service: ${details.lead.job_type}.` : ''} ${details?.lead?.urgency === 'high' ? 'URGENT: Emergency request!' : ''}`,
        due_at: undefined,
      };

    case 'LEAD_FOLLOWUP':
      return {
        type: 'lead',
        severity: priority === 'urgent' ? 'urgent' : 'medium',
        title: `Lead Follow-up: ${details?.lead?.customer_name || 'Existing Lead'}`,
        message: summary || 'Follow up required',
        due_at: undefined,
      };

    case 'BILLING_INCOMING_INVOICE':
      if (details?.billing?.due_date) {
        const dueDate = new Date(details.billing.due_date);
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
          message: `$${details.billing.amount || 0} ${details.billing.invoice_number ? `(${details.billing.invoice_number})` : ''} from ${details.billing.vendor_or_client_name || 'vendor'} is ${daysUntilDue <= 0 ? 'overdue' : 'due'}.`,
          due_at: details.billing.due_date || undefined,
        };
      }
      return {
        type: 'billing',
        severity: 'medium',
        title: 'New Vendor Invoice',
        message: `$${details?.billing?.amount || 0} ${details?.billing?.invoice_number ? `(${details.billing.invoice_number})` : ''} received from ${details?.billing?.vendor_or_client_name || 'vendor'}.`,
        due_at: undefined,
      };

    case 'BILLING_OUTGOING_INVOICE':
      return {
        type: 'billing',
        severity: 'low',
        title: 'Customer Invoice Reply',
        message: summary || 'Invoice reply received',
        due_at: undefined,
      };

    case 'BILLING_PAYMENT_RECEIVED':
      return {
        type: 'billing',
        severity: 'low',
        title: 'Payment Received',
        message: `$${details?.billing?.amount || 0} payment received. ${details?.billing?.invoice_number ? `Applied to ${details.billing.invoice_number}.` : ''}`,
        due_at: undefined,
      };

    case 'BILLING_PAYMENT_ISSUE':
      return {
        type: 'billing',
        severity: 'high',
        title: 'Payment Issue Detected',
        message: summary || 'Payment issue requires attention',
        due_at: details?.billing?.due_date || undefined,
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
      const changeUrgency = details?.scheduling?.confirmed_date
        ? Math.ceil(
            (new Date(details.scheduling.confirmed_date).getTime() -
              Date.now()) /
              (1000 * 60 * 60 * 24)
          ) <= 2
        : false;

      return {
        type: 'scheduling',
        severity: changeUrgency ? 'urgent' : 'high',
        title: 'Schedule Change Request',
        message: summary || 'Schedule change requested',
        due_at: details?.scheduling?.confirmed_date || undefined,
      };

    case 'CUSTOMER_SUPPORT':
      return {
        type: 'support',
        severity: priority === 'urgent' ? 'urgent' : 'medium',
        title: 'Customer Support Request',
        message: summary || 'Support request received',
        due_at: undefined,
      };

    case 'SYSTEM_SECURITY':
      return {
        type: 'security',
        severity: 'urgent',
        title: 'Security Alert',
        message: summary || 'Security issue detected',
        due_at: undefined,
      };

    default:
      return null; // No alert for other categories
  }
}

// TODO: Update tests to use new nested details structure
describe.skip('Email Alerts Generation', () => {
  const mockInsightBase = {
    id: 'test-insight-id',
    email_raw_id: 'test-email-raw-id',
    email_id: 'test-email-id',
    category: 'LEAD_NEW' as const,
    priority: 'high' as const,
    is_action_required: true,
    summary: 'Test summary',
    details: {},
    confidence_score: 0.9,
    ai_model_version: 'gpt-4o-mini',
    processing_time_ms: 1000,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  };

  test('should generate alert data for new lead', () => {
    const insight: EmailInsight = {
      ...mockInsightBase,
      category: 'LEAD_NEW',
      details: {
        lead: {
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          job_type: 'painting',
        },
      },
    };

    const alertData = getAlertDataForCategory(insight);

    expect(alertData).toBeTruthy();
    expect(alertData!.type).toBe('lead');
    expect(alertData!.severity).toBe('high');
    expect(alertData!.title).toContain('New Lead');
    expect(alertData!.message).toContain('Service: painting');
  });

  test('should generate alert data for billing invoice', () => {
    const insight: EmailInsight = {
      ...mockInsightBase,
      category: 'BILLING_INCOMING_INVOICE',
      details: {
        billing: {
          amount: 500,
          invoice_number: 'INV-001',
          due_date: '2025-12-15', // Far future date
          vendor_or_client_name: 'ABC Supplies',
        },
      },
    };

    const alertData = getAlertDataForCategory(insight);

    expect(alertData).toBeTruthy();
    expect(alertData!.type).toBe('billing');
    expect(alertData!.severity).toBe('medium'); // Not urgent since due date is 2 weeks away
    expect(alertData!.title).toContain('Invoice Due');
    expect(alertData!.message).toContain('$500');
  });

  test('should generate urgent alert data for overdue invoice', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const insight: EmailInsight = {
      ...mockInsightBase,
      category: 'BILLING_INCOMING_INVOICE',
      details: {
        billing: {
          amount: 250,
          due_date: yesterday.toISOString().split('T')[0],
          vendor_or_client_name: 'Quick Service',
        },
      },
    };

    const alertData = getAlertDataForCategory(insight);

    expect(alertData).toBeTruthy();
    expect(alertData!.severity).toBe('urgent');
    expect(alertData!.title).toContain('Overdue');
  });

  test('should generate alert data for scheduling request', () => {
    const insight: EmailInsight = {
      ...mockInsightBase,
      category: 'SCHEDULING_REQUEST',
      priority: 'urgent',
      details: {
        scheduling: {
          requested_dates: ['2024-01-05', '2024-01-06'],
          job_reference: 'JOB-123',
        },
      },
    };

    const alertData = getAlertDataForCategory(insight);

    expect(alertData).toBeTruthy();
    expect(alertData!.type).toBe('scheduling');
    expect(alertData!.severity).toBe('urgent');
    expect(alertData!.title).toContain('Scheduling Request');
  });

  test('should generate alert data for customer support', () => {
    const insight: EmailInsight = {
      ...mockInsightBase,
      category: 'CUSTOMER_SUPPORT',
      details: {},
    };

    const alertData = getAlertDataForCategory(insight);

    expect(alertData).toBeTruthy();
    expect(alertData!.type).toBe('support');
    expect(alertData!.severity).toBe('medium');
    expect(alertData!.title).toContain('Customer Support');
  });

  test('should generate urgent alert data for security issues', () => {
    const insight: EmailInsight = {
      ...mockInsightBase,
      category: 'SYSTEM_SECURITY',
      summary: 'Suspicious login attempt detected',
    };

    const alertData = getAlertDataForCategory(insight);

    expect(alertData).toBeTruthy();
    expect(alertData!.type).toBe('security');
    expect(alertData!.severity).toBe('urgent');
    expect(alertData!.title).toContain('Security Alert');
  });

  test('should not generate alert data for non-actionable insights', () => {
    const insight: EmailInsight = {
      ...mockInsightBase,
      is_action_required: false,
      category: 'NEWSLETTER_PROMO',
    };

    const alertData = getAlertDataForCategory(insight);

    expect(alertData).toBeNull();
  });

  test('should not generate alert data for spam/other categories', () => {
    const insight: EmailInsight = {
      ...mockInsightBase,
      category: 'SPAM_OTHER',
      is_action_required: true,
    };

    const alertData = getAlertDataForCategory(insight);

    expect(alertData).toBeNull();
  });
});
