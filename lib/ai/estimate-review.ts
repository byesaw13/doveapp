import { OpenAI } from 'openai';
import type { EstimateLineItem } from '@/types/estimate';

export interface EstimateReviewResult {
  overall_assessment: 'excellent' | 'good' | 'fair' | 'needs_improvement';
  confidence_score: number;
  pricing_analysis: {
    is_competitive: boolean;
    market_comparison: 'below_market' | 'market_rate' | 'above_market';
    suggested_adjustments?: Array<{
      item: string;
      current_price: number;
      suggested_price: number;
      reason: string;
    }>;
  };
  completeness_check: {
    missing_items?: string[];
    overlooked_costs?: string[];
    recommendations: string[];
  };
  profitability_analysis: {
    estimated_profit_margin: number;
    break_even_analysis: string;
    risk_factors: string[];
  };
  suggestions: string[];
  warnings: string[];
  total_estimate: number;
  recommended_total?: number;
}

export interface EstimateReviewRequest {
  title: string;
  description: string;
  service_type: string;
  line_items: EstimateLineItem[];
  subtotal: number;
  tax_rate: number;
  total: number;
  location?: string;
  client_budget?: number;
}

/**
 * Review a manual estimate using AI
 */
export async function reviewEstimateWithAI(
  request: EstimateReviewRequest
): Promise<EstimateReviewResult> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = buildReviewPrompt(request);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_tokens: 1500,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No content received from OpenAI');
  }

  const result = JSON.parse(content);
  return result as EstimateReviewResult;
}

function buildReviewPrompt(request: EstimateReviewRequest): string {
  const lineItemsFormatted = request.line_items
    .map(
      (item) =>
        `- ${item.description}: ${item.quantity} × $${item.unit_price} = $${item.total}`
    )
    .join('\n');

  return `You are an expert construction and field service estimator. Review this estimate for accuracy, completeness, and profitability.

ESTIMATE DETAILS:
Title: ${request.title}
Description: ${request.description}
Service Type: ${request.service_type}
Location: ${request.location || 'Not specified'}
Client Budget: ${request.client_budget ? `$${request.client_budget}` : 'Not specified'}

LINE ITEMS:
${lineItemsFormatted}

PRICING:
Subtotal: $${request.subtotal.toFixed(2)}
Tax Rate: ${request.tax_rate}%
Total: $${request.total.toFixed(2)}

TASK: Analyze this estimate comprehensively. Consider:

1. **Pricing Analysis**:
   - Are the unit prices competitive and realistic?
   - Are any items overpriced or underpriced?
   - How does this compare to market rates for ${request.service_type} work?

2. **Completeness**:
   - Are there any missing line items for this type of work?
   - Common overlooked costs (permits, disposal, travel, setup)?
   - Are quantities realistic for the scope described?

3. **Profitability**:
   - Estimate the profit margin (typical is 15-30% for field services)
   - Identify risk factors that could eat into profit
   - Break-even analysis and recommendations

4. **Quality & Accuracy**:
   - Do descriptions match industry standards?
   - Are measurements/quantities reasonable?
   - Any red flags or concerns?

5. **Client Budget Alignment**:
   ${request.client_budget ? `- Client budget is $${request.client_budget}. Does this estimate align?` : '- No client budget provided'}

Return JSON with this exact structure:
{
  "overall_assessment": "excellent|good|fair|needs_improvement",
  "confidence_score": 0.85,
  "pricing_analysis": {
    "is_competitive": true,
    "market_comparison": "market_rate|above_market|below_market",
    "suggested_adjustments": [
      {
        "item": "Line item description",
        "current_price": 100.00,
        "suggested_price": 120.00,
        "reason": "Market rate for this service is typically higher"
      }
    ]
  },
  "completeness_check": {
    "missing_items": ["Permit fees", "Disposal costs"],
    "overlooked_costs": ["Travel time", "Equipment rental"],
    "recommendations": ["Add contingency line item", "Include cleanup costs"]
  },
  "profitability_analysis": {
    "estimated_profit_margin": 22.5,
    "break_even_analysis": "Profit margin appears healthy at ~23%. Break-even is around 65% of quoted price.",
    "risk_factors": ["No contingency buffer", "Material costs may fluctuate"]
  },
  "suggestions": [
    "Consider adding a 10% contingency line item",
    "Labor hours seem low for this scope",
    "Include waste disposal fee"
  ],
  "warnings": [
    "Missing permit fees could cause unexpected costs",
    "Total is above client budget by $500"
  ],
  "total_estimate": ${request.total},
  "recommended_total": 5500.00
}`;
}

/**
 * Quick validation of estimate without full AI review
 */
export function quickEstimateValidation(request: EstimateReviewRequest): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for empty line items
  if (request.line_items.length === 0) {
    errors.push('No line items in estimate');
  }

  // Check for zero-price items
  const zeroPriceItems = request.line_items.filter(
    (item) => item.unit_price === 0
  );
  if (zeroPriceItems.length > 0) {
    warnings.push(`${zeroPriceItems.length} item(s) have zero price`);
  }

  // Check for missing descriptions
  const emptyDescriptions = request.line_items.filter(
    (item) => !item.description.trim()
  );
  if (emptyDescriptions.length > 0) {
    errors.push(`${emptyDescriptions.length} item(s) missing description`);
  }

  // Check total calculation
  const calculatedTotal = request.line_items.reduce(
    (sum, item) => sum + item.total,
    0
  );
  if (Math.abs(calculatedTotal - request.subtotal) > 0.01) {
    errors.push('Subtotal does not match sum of line items');
  }

  // Check if total is reasonable
  if (request.total < 50) {
    warnings.push('Total seems very low for a professional estimate');
  }

  // Check against client budget
  if (request.client_budget && request.total > request.client_budget * 1.2) {
    warnings.push(
      `Estimate is 20% or more above client budget ($${request.client_budget})`
    );
  }

  return { errors, warnings };
}
