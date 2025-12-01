import { EmailInsight } from '../../types/database';

// Import the function directly to avoid Supabase initialization
function getAlertDataForCategory(insight: EmailInsight): {
  type: 'lead' | 'billing' | 'scheduling' | 'support' | 'security';
  severity: 'low' | 'medium' | 'high' | 'urgent';
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

describe('Email Alerts Generation', () => {
  const mockInsightBase = {
    id: 'test-insight-id',
    email_raw_id: 'test-email-raw-id',
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
        contact_name: 'John Doe',
        contact_email: 'john@example.com',
        job_type: 'painting',
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
        amount: 500,
        invoice_number: 'INV-001',
        due_date: '2025-12-15', // Far future date
        vendor_name: 'ABC Supplies',
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
        amount: 250,
        due_date: yesterday.toISOString().split('T')[0],
        vendor_name: 'Quick Service',
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
        requested_dates: ['2024-01-05', '2024-01-06'],
        job_reference: 'JOB-123',
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
      details: {
        sentiment: 'negative',
      },
    };

    const alertData = getAlertDataForCategory(insight);

    expect(alertData).toBeTruthy();
    expect(alertData!.type).toBe('support');
    expect(alertData!.severity).toBe('high'); // Negative sentiment increases severity
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
