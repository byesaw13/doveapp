import { categorizeEmailWithKeywords } from '../../lib/ai/email-categorization';

describe('Junk Mail Detection', () => {
  const mockEmailBase = {
    id: 'test-email',
    email_account_id: 'test-account',
    gmail_message_id: 'test-gmail-id',
    gmail_thread_id: 'test-thread-id',
    received_at: new Date().toISOString(),
    body_html: '',
    has_attachments: false,
    labels: [],
    category: 'unreviewed' as const,
    priority: 'normal' as const,
    is_read: false,
    is_starred: false,
    extracted_data: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  test('should detect promotional email as junk', () => {
    const result = categorizeEmailWithKeywords({
      ...mockEmailBase,
      subject: 'Special Offer: 50% Off All Services!',
      body_text:
        'Click here to get your special discount. Limited time offer. Unsubscribe at bottom.',
      sender: 'deals@marketing.com',
    });

    expect(result.category).toBe('junk');
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  test('should detect newsletter as junk', () => {
    const result = categorizeEmailWithKeywords({
      ...mockEmailBase,
      subject: 'Newsletter: Weekly Industry Updates',
      body_text:
        'Subscribe to our newsletter for the latest news and deals in home services.',
      sender: 'newsletter@industrynews.com',
    });

    expect(result.category).toBe('junk');
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  test('should not categorize legitimate business email as junk', () => {
    const result = categorizeEmailWithKeywords({
      ...mockEmailBase,
      subject: 'Invoice from ABC Plumbing',
      body_text:
        'Your invoice for $150.00 is due on March 15th. Please pay promptly.',
      sender: 'billing@abcplumbing.com',
    });

    expect(result.category).not.toBe('junk');
  });

  test('should not categorize lead email as junk', () => {
    const result = categorizeEmailWithKeywords({
      ...mockEmailBase,
      subject: 'Kitchen Painting Quote Request',
      body_text:
        'Hi, I need a quote for painting my kitchen. Can you come take a look?',
      sender: 'john@customer.com',
    });

    expect(result.category).not.toBe('junk');
  });
});
