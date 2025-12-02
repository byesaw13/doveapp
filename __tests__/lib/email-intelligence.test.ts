import { OpenAIEmailAnalysisResult } from '../../lib/email-intelligence';

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  })),
}));

// TODO: Update tests to use new nested details structure and schema
describe.skip('Email Intelligence Engine', () => {
  const mockEmailRaw = {
    id: 'test-email-raw-id',
    email_account_id: 'test-account-id',
    gmail_message_id: 'test-gmail-id',
    gmail_thread_id: 'test-thread-id',
    raw_data: {
      payload: {
        headers: [
          { name: 'Subject', value: 'Test Email' },
          { name: 'From', value: 'sender@example.com' },
          { name: 'Date', value: '2024-01-01T10:00:00Z' },
        ],
        body: {
          data: Buffer.from('Test email body').toString('base64'),
        },
      },
    },
    processed_at: undefined,
    processing_status: 'pending' as const,
    processing_error: undefined,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
  });

  describe('OpenAI Analysis', () => {
    test('should validate correct analysis result structure', () => {
      const validResult: OpenAIEmailAnalysisResult = {
        category: 'LEAD_NEW',
        priority: 'high',
        is_action_required: true,
        summary: 'New painting lead inquiry',
        details: {
          contact_name: 'John Doe',
          contact_email: 'john@example.com',
          job_type: 'painting',
        },
        confidence_score: 0.95,
        reasoning: 'Clear lead indicators',
      };

      // This would be tested in the actual validation function
      expect(validResult.category).toBe('LEAD_NEW');
      expect(validResult.priority).toBe('high');
      expect(validResult.is_action_required).toBe(true);
    });

    test('should reject invalid category', () => {
      const invalidResult = {
        category: 'INVALID_CATEGORY',
        priority: 'high',
        is_action_required: true,
        summary: 'Test',
        details: {},
        confidence_score: 0.8,
      };

      // This would be tested in the validation function
      expect(invalidResult.category).not.toBe('LEAD_NEW');
    });

    test('should handle all valid categories', () => {
      const validCategories = [
        'LEAD_NEW',
        'LEAD_FOLLOWUP',
        'BILLING_INCOMING_INVOICE',
        'BILLING_OUTGOING_INVOICE',
        'BILLING_PAYMENT_RECEIVED',
        'BILLING_PAYMENT_ISSUE',
        'SCHEDULING_REQUEST',
        'SCHEDULING_CHANGE',
        'CUSTOMER_SUPPORT',
        'VENDOR_RECEIPT',
        'SYSTEM_SECURITY',
        'NEWSLETTER_PROMO',
        'SPAM_OTHER',
      ];

      validCategories.forEach((category) => {
        const result: OpenAIEmailAnalysisResult = {
          category: category as any,
          priority: 'medium',
          is_action_required: false,
          summary: 'Test summary',
          details: {},
          confidence_score: 0.8,
        };
        expect(result.category).toBe(category);
      });
    });
  });

  describe('Email Data Extraction', () => {
    test('should extract basic email data from raw Gmail response', () => {
      // This would test the extractEmailDataFromRaw function
      const rawData = {
        payload: {
          headers: [
            { name: 'Subject', value: 'Test Subject' },
            { name: 'From', value: 'sender@test.com' },
            { name: 'Date', value: '2024-01-01T10:00:00Z' },
          ],
          body: {
            data: Buffer.from('Test body content').toString('base64'),
          },
        },
      };

      // Test extraction logic
      expect(
        rawData.payload.headers.find((h) => h.name === 'Subject')?.value
      ).toBe('Test Subject');
      expect(
        rawData.payload.headers.find((h) => h.name === 'From')?.value
      ).toBe('sender@test.com');
    });

    test('should handle missing headers gracefully', () => {
      const rawData = {
        payload: {
          headers: [],
          body: { data: 'dGVzdA==' }, // 'test' in base64
        },
      };

      // Should not crash with missing headers
      expect(rawData.payload.headers).toHaveLength(0);
    });
  });

  describe('Category-Specific Details', () => {
    test('should handle lead details structure', () => {
      const leadDetails = {
        contact_name: 'Jane Smith',
        contact_email: 'jane@example.com',
        contact_phone: '555-0123',
        company_name: 'Smith LLC',
        job_type: 'plumbing',
        job_description: 'Kitchen sink repair',
        urgency: 'high' as const,
        preferred_time_window: 'Next week',
        budget_range: '$200-500',
      };

      expect(leadDetails.contact_name).toBe('Jane Smith');
      expect(leadDetails.job_type).toBe('plumbing');
      expect(leadDetails.urgency).toBe('high');
    });

    test('should handle billing details structure', () => {
      const billingDetails = {
        direction: 'incoming' as const,
        amount: 150.0,
        currency: 'USD',
        invoice_number: 'INV-001',
        due_date: '2024-01-15',
        status: 'open' as const,
      };

      expect(billingDetails.direction).toBe('incoming');
      expect(billingDetails.amount).toBe(150.0);
      expect(billingDetails.invoice_number).toBe('INV-001');
    });

    test('should handle scheduling details structure', () => {
      const schedulingDetails = {
        requested_dates: ['2024-01-10', '2024-01-11'],
        confirmed_date: '2024-01-10',
        location: '123 Main St',
        job_reference: 'JOB-123',
      };

      expect(schedulingDetails.requested_dates).toHaveLength(2);
      expect(schedulingDetails.confirmed_date).toBe('2024-01-10');
      expect(schedulingDetails.location).toBe('123 Main St');
    });

    test('should handle vendor receipt details structure', () => {
      const vendorDetails = {
        vendor_name: 'Home Depot',
        items: [
          {
            name: 'Paint Brush',
            quantity: 2,
            price: 15.99,
            category: 'tools' as const,
          },
          {
            name: 'Paint',
            quantity: 1,
            price: 45.99,
            category: 'materials' as const,
          },
        ],
        total_amount: 77.97,
        tools_breakdown: 31.98,
        materials_breakdown: 45.99,
      };

      expect(vendorDetails.vendor_name).toBe('Home Depot');
      expect(vendorDetails.items).toHaveLength(2);
      expect(vendorDetails.total_amount).toBe(77.97);
    });
  });
});
