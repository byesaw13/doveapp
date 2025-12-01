import { EmailMessage } from '@/lib/db/email';

export interface AICategorizationResult {
  category: 'spending' | 'billing' | 'leads' | 'other' | 'junk';
  confidence: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  summary?: string;
  action_items?: string[];
  suggested_response?: string;
  key_topics?: string[];
  extractedData?: {
    spending?: {
      amount: number;
      vendor?: string;
      category?: string;
      description?: string;
      transaction_date?: string;
    };
    billing?: {
      invoice_number?: string;
      amount: number;
      due_date?: string;
      client_name?: string;
      status?: string;
    };
    leads?: {
      contact_name?: string;
      company_name?: string;
      contact_email?: string;
      contact_phone?: string;
      service_type?: string;
      urgency?: string;
      budget_range?: string;
      preferred_contact_method?: string;
    };
  };
  reasoning?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  requires_response?: boolean;
  response_deadline?: string;
  follow_up_date?: string;
}

// Main AI categorization function
export async function categorizeEmailWithAI(
  email: EmailMessage
): Promise<AICategorizationResult> {
  // Try OpenAI first, fallback to keyword matching
  try {
    return await categorizeWithOpenAI(email);
  } catch (error) {
    console.log('OpenAI categorization failed, using keyword matching:', error);
    return categorizeEmailWithKeywords(email);
  }
}

// OpenAI-powered categorization
async function categorizeWithOpenAI(
  email: EmailMessage
): Promise<AICategorizationResult> {
  const { OpenAI } = await import('openai');

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `You are an AI assistant analyzing emails for a field service company (painting, plumbing, electrical, HVAC, etc.). Provide comprehensive analysis of this email.

Email Subject: ${email.subject || 'No subject'}
Email Body: ${email.body_text || email.body_html || 'No content'}
From: ${email.sender || 'Unknown'}
Received: ${email.received_at || 'Unknown'}

TASK: Analyze this email and provide detailed business intelligence.

1. **Categorization**: Classify as "spending", "billing", "leads", "other", or "junk"
    - spending: receipts, invoices, payments, purchases, expenses, vendor bills
    - billing: customer invoices, statements, amounts due, payment requests
    - leads: quotes, estimates, service requests, contact info, inquiries
    - other: security alerts, notifications, confirmations, system messages
    - junk: spam, advertisements, promotional emails, newsletters, marketing

2. **Priority Assessment**: low, medium, high, urgent based on urgency, deadlines, amounts

3. **Extract Business Data**: Find all relevant information for the category

4. **Summary**: 1-2 sentence summary of the email's main point

5. **Action Items**: What actions should be taken (if any)

6. **Sentiment**: positive, neutral, negative

7. **Response Needed**: true/false - does this require a response?

Return JSON with this structure:
${JSON.stringify(
  {
    category: 'spending|billing|leads|other|junk',
    confidence: 0.0,
    priority: 'low|medium|high|urgent',
    summary: 'brief summary',
    action_items: ['action1', 'action2'],
    sentiment: 'positive|neutral|negative',
    requires_response: true,
    extractedData: {
      spending: {
        amount: 0,
        vendor: 'string',
        category: 'materials|equipment|services',
        description: 'string',
        transaction_date: 'YYYY-MM-DD',
      },
      billing: {
        invoice_number: 'string',
        amount: 0,
        due_date: 'YYYY-MM-DD',
        client_name: 'string',
        status: 'paid|unpaid|overdue',
      },
      leads: {
        contact_name: 'string',
        company_name: 'string',
        contact_email: 'string',
        contact_phone: 'string',
        service_type: 'painting|plumbing|electrical|hvac|general',
        urgency: 'low|normal|high|emergency',
        budget_range: 'string',
        preferred_contact_method: 'email|phone|text',
      },
    },
    reasoning: 'detailed explanation of analysis',
  },
  null,
  2
)}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No content received from OpenAI');
  }
  const result = JSON.parse(content);
  return result as AICategorizationResult;
}

// Keyword-based categorization (fallback implementation)
export function categorizeEmailWithKeywords(
  email: EmailMessage
): AICategorizationResult {
  const content =
    `${email.subject || ''} ${email.body_text ?? ''} ${email.body_html ?? ''}`.toLowerCase();

  // Simple keyword-based AI simulation (replace with real AI in production)
  const spendingKeywords = [
    'receipt',
    'invoice',
    'payment',
    'paid',
    'charge',
    'cost',
    'expense',
    'purchase',
    'bought',
    'order',
  ];
  const billingKeywords = [
    'bill',
    'statement',
    'due',
    'owing',
    'balance',
    'outstanding',
    'reminder',
  ];
  const leadKeywords = [
    'quote',
    'estimate',
    'interested',
    'need service',
    'looking for',
    'contact me',
    'call me',
    'schedule',
  ];
  const junkKeywords = [
    'unsubscribe',
    'newsletter',
    'promotional',
    'advertisement',
    'marketing',
    'special offer',
    'limited time',
    'free trial',
    'subscribe',
    'click here',
    'buy now',
    'sale',
    'discount',
    'deal',
    'spam',
    'no-reply',
    'noreply',
  ];

  const spendingScore = spendingKeywords.reduce(
    (score, keyword) => score + (content.includes(keyword) ? 1 : 0),
    0
  );
  const billingScore = billingKeywords.reduce(
    (score, keyword) => score + (content.includes(keyword) ? 1 : 0),
    0
  );
  const leadScore = leadKeywords.reduce(
    (score, keyword) => score + (content.includes(keyword) ? 1 : 0),
    0
  );
  const junkScore = junkKeywords.reduce(
    (score, keyword) => score + (content.includes(keyword) ? 1 : 0),
    0
  );

  // Check for junk/spam emails first
  if (junkScore >= 2) {
    return {
      category: 'junk',
      confidence: Math.min(0.9, 0.6 + junkScore * 0.1),
      reasoning: `Detected ${junkScore} junk/spam keywords. This appears to be promotional or marketing content.`,
    };
  }

  // Filter out clearly non-business emails (be less restrictive)
  const nonBusinessKeywords = [
    'security alert',
    'sign-in',
    'verification code',
    'password reset',
    'account recovery',
    'login attempt',
    'confirm your email',
  ];

  const isClearlyNonBusiness = nonBusinessKeywords.some((keyword) =>
    content.includes(keyword)
  );

  if (isClearlyNonBusiness) {
    return {
      category: 'other',
      confidence: 0.8,
      reasoning:
        'Email appears to be a security/notification email, not business-related',
    };
  }

  // Determine category based on scores (be more lenient)
  let category: 'spending' | 'billing' | 'leads' | 'other' | 'junk' = 'other';
  let confidence = 0.4;
  let extractedData;

  // Lower minimum scores for better detection
  const minSpendingScore = 1;
  const minBillingScore = 1;
  const minLeadScore = 1;

  // Check for clear category matches with extracted data validation
  if (spendingScore >= minSpendingScore) {
    const spendingData = extractSpendingData(content);
    if (spendingData && spendingData.amount && spendingData.amount > 0) {
      category = 'spending';
      confidence = Math.min(0.85, 0.5 + spendingScore * 0.15);
      extractedData = { spending: spendingData };
    }
  }

  if (billingScore >= minBillingScore && (!extractedData || confidence < 0.6)) {
    const billingData = extractBillingData(content);
    if (billingData && billingData.amount && billingData.amount > 0) {
      category = 'billing';
      confidence = Math.min(0.85, 0.5 + billingScore * 0.15);
      extractedData = { billing: billingData };
    }
  }

  if (leadScore >= minLeadScore && (!extractedData || confidence < 0.6)) {
    const leadData = extractLeadData(content);
    if (
      leadData &&
      (leadData.contact_name || leadData.contact_email || leadData.company_name)
    ) {
      category = 'leads';
      confidence = Math.min(0.85, 0.5 + leadScore * 0.15);
      extractedData = { leads: leadData };
    }
  }

  // Fallback logic if no strong matches found above
  if (!extractedData) {
    if (
      billingScore >= minBillingScore &&
      billingScore > spendingScore &&
      billingScore > leadScore
    ) {
      category = 'billing';
      confidence = Math.min(0.8, 0.4 + (billingScore - 1) * 0.1);
      extractedData = { billing: extractBillingData(content) };

      // Validate that we actually found billing data
      if (
        !extractedData.billing ||
        !extractedData.billing.amount ||
        extractedData.billing.amount < 0.01
      ) {
        category = 'other';
        confidence = 0.5;
        extractedData = undefined;
      }
    } else if (
      leadScore >= minLeadScore &&
      leadScore > spendingScore &&
      leadScore > billingScore
    ) {
      category = 'leads';
      confidence = Math.min(0.8, 0.4 + (leadScore - 1) * 0.1);
      extractedData = { leads: extractLeadData(content) };

      // Validate that we actually found lead data
      if (
        !extractedData.leads ||
        (!extractedData.leads.contact_name &&
          !extractedData.leads.contact_email)
      ) {
        category = 'other';
        confidence = 0.5;
        extractedData = undefined;
      }
    }
  }

  return {
    category,
    confidence,
    extractedData,
    reasoning: `Smart categorization: Found ${spendingScore} spending keywords, ${billingScore} billing keywords, ${leadScore} lead keywords, ${junkScore} junk keywords. ${category === 'other' ? 'No clear business category identified.' : `Categorized as ${category} with ${Math.round(confidence * 100)}% confidence.`}`,
  };
}

// ===== UPGRADE TO REAL AI =====
// To use real AI, install dependencies and replace the categorizeEmailWithAI function:
//
// 1. Install OpenAI SDK: npm install openai
// 2. Add to .env.local: OPENAI_API_KEY=your-openai-api-key
//
// 3. Replace the categorizeEmailWithAI function with:
/*
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function categorizeEmailWithAI(
  email: EmailMessage
): Promise<AICategorizationResult> {
  try {
    const prompt = `Analyze this business email for a field service company.

Subject: ${email.subject || 'No subject'}
Body: ${email.body_text || email.body_html || 'No content'}

Categorize as: "spending", "billing", "leads", or "other"

Extract business data and return JSON:
{
  "category": "spending|billing|leads|other",
  "confidence": 0.0-1.0,
  "extractedData": {
    "spending": {"amount": number, "vendor": string, "category": string, "description": string} |
    "billing": {"invoice_number": string, "amount": number, "due_date": string} |
    "leads": {"contact_name": string, "company_name": string, "contact_email": string, "service_type": string}
  },
  "reasoning": "brief explanation"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result as AICategorizationResult;

  } catch (error) {
    console.error('AI categorization failed, falling back to keywords:', error);
    // Fallback to keyword matching
    return categorizeEmailWithKeywords(email);
  }
}
*/

// ===== UPGRADE TO REAL AI =====
// To use real AI, install dependencies and replace the function above:
//
// 1. Install AI SDK: npm install openai @ai-sdk/openai
// 2. Add to .env.local:
//    OPENAI_API_KEY=your-openai-api-key
//
// 3. Replace categorizeEmailWithAI with:
/*
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function categorizeEmailWithAI(
  email: EmailMessage
): Promise<AICategorizationResult> {
  try {
    const prompt = `Analyze this business email and categorize it for a field service company.

Email Subject: ${email.subject || 'No subject'}
Email Body: ${email.body_text || email.body_html || 'No content'}

Categorize as: "spending", "billing", "leads", or "other"

Extract relevant business data and return JSON:
{
  "category": "spending|billing|leads|other",
  "confidence": 0.0-1.0,
  "extractedData": {
    "spending": {"amount": number, "vendor": string, "category": string, "description": string} |
    "billing": {"invoice_number": string, "amount": number, "due_date": string} |
    "leads": {"contact_name": string, "company_name": string, "contact_email": string, "service_type": string}
  },
  "reasoning": "brief explanation"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or "gpt-4" for better accuracy
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result as AICategorizationResult;

  } catch (error) {
    console.error('AI categorization failed:', error);
    // Fallback to keyword matching
    return categorizeEmailWithKeywords(email);
  }
}
*/

function extractSpendingData(content: string) {
  // Extract amount - be more specific to avoid timestamps
  // Look for amounts with currency symbols or in monetary contexts
  const amountPatterns = [
    /\$\s*(\d+(?:\.\d{2})?)/g, // $123.45
    /(\d+(?:\.\d{2})?)\s*dollars?/gi, // 123.45 dollars
    /total:?\s*\$?(\d+(?:\.\d{2})?)/gi, // total: $123.45
    /amount:?\s*\$?(\d+(?:\.\d{2})?)/gi, // amount: $123.45
    /price:?\s*\$?(\d+(?:\.\d{2})?)/gi, // price: $123.45
  ];

  let amount: number | undefined;
  for (const pattern of amountPatterns) {
    const match = content.match(pattern);
    if (match) {
      const extractedAmount = parseFloat(match[1]);
      // Validate amount is reasonable (not a timestamp, not too large)
      if (
        extractedAmount > 0 &&
        extractedAmount < 1000000 &&
        extractedAmount === Math.floor(extractedAmount * 100) / 100
      ) {
        amount = extractedAmount;
        break;
      }
    }
  }

  // Extract vendor - avoid URLs and non-vendor text
  const vendorPatterns = [
    /(?:from|at|with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:receipt|invoice|charge)/i,
  ];

  let vendor: string | undefined;
  for (const pattern of vendorPatterns) {
    const match = content.match(pattern);
    if (match) {
      const potentialVendor = match[1];
      // Filter out common non-vendor words and URLs
      if (
        !potentialVendor.includes('http') &&
        !potentialVendor.includes('www') &&
        !['security', 'alert', 'google', 'verification', 'account'].includes(
          potentialVendor.toLowerCase()
        ) &&
        potentialVendor.length > 2
      ) {
        vendor = potentialVendor;
        break;
      }
    }
  }

  // Determine category
  let category: string | undefined;
  if (content.includes('material') || content.includes('supply')) {
    category = 'materials';
  } else if (content.includes('equipment') || content.includes('tool')) {
    category = 'equipment';
  } else if (content.includes('service') || content.includes('labor')) {
    category = 'services';
  }

  return {
    amount: amount || 0,
    vendor,
    category,
    description:
      content.substring(0, 200) + (content.length > 200 ? '...' : ''),
  };
}

function extractBillingData(content: string) {
  // Extract invoice number
  const invoiceRegex = /(?:invoice|bill|statement)\s*#?\s*([A-Z0-9-]+)/i;
  const invoiceMatch = content.match(invoiceRegex);
  const invoice_number = invoiceMatch ? invoiceMatch[1] : undefined;

  // Extract amount due
  const amountRegex = /(?:total|amount|balance|due)\s*\$?(\d+(?:\.\d{2})?)/i;
  const amountMatch = content.match(amountRegex);
  const amount = amountMatch
    ? parseFloat(amountMatch[1].replace('$', ''))
    : undefined;

  // Extract due date
  const dateRegex =
    /(?:due|by)\s+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\w+\s+\d{1,2},?\s+\d{2,4})/i;
  const dateMatch = content.match(dateRegex);
  const due_date = dateMatch ? dateMatch[1] : undefined;

  return {
    invoice_number,
    amount: amount || 0,
    due_date,
  };
}

function extractLeadData(content: string) {
  // Extract contact name
  const nameRegex =
    /(?:my name is|this is|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i;
  const nameMatch = content.match(nameRegex);
  const contact_name = nameMatch ? nameMatch[1] : undefined;

  // Extract email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const emailMatch = content.match(emailRegex);
  const contact_email = emailMatch ? emailMatch[0] : undefined;

  // Extract phone
  const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/;
  const phoneMatch = content.match(phoneRegex);
  const contact_phone = phoneMatch ? phoneMatch[0] : undefined;

  // Extract company
  const companyRegex =
    /(?:from|at|with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:LLC|Inc|Corp|Company|LLP|Ltd)?)/i;
  const companyMatch = content.match(companyRegex);
  const company_name = companyMatch ? companyMatch[1] : undefined;

  // Extract service type
  let service_type: string | undefined;
  if (content.includes('painting') || content.includes('paint')) {
    service_type = 'painting';
  } else if (content.includes('plumbing')) {
    service_type = 'plumbing';
  } else if (content.includes('electrical')) {
    service_type = 'electrical';
  } else if (content.includes('hvac') || content.includes('heating')) {
    service_type = 'hvac';
  }

  return {
    contact_name,
    company_name,
    contact_email,
    contact_phone,
    service_type,
  };
}
