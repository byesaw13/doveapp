import { NextRequest, NextResponse } from 'next/server';
import { generateAIEstimate } from '@/lib/ai/estimate-generation';
import { getAIEstimateSettings } from '@/lib/db/ai-estimate-settings';
import {
  checkRateLimit,
  RATE_LIMITS,
  getRateLimitHeaders,
} from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting to AI operations (expensive)
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const rateLimit = checkRateLimit(
      `ai-test:${ip}`,
      RATE_LIMITS.AI_OPERATIONS
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'AI test rate limit exceeded',
          message: 'Too many AI test requests. Please try again later.',
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetAt),
        }
      );
    }

    const body = await request.json();
    const { scenario } = body;

    if (!scenario) {
      return NextResponse.json(
        { error: 'Scenario is required' },
        { status: 400 }
      );
    }

    // Get current AI settings
    const settings = await getAIEstimateSettings();

    // Test scenarios
    const scenarios = {
      'small-painting': {
        description:
          'Need to paint a small bedroom (12x12) with accent wall. Ceiling is white, walls will be light gray.',
        service_type: 'painting' as const,
        property_details: {
          square_footage: 144,
          condition: 'good' as const,
        },
        urgency: 'normal' as const,
        client_budget: 800,
        location: 'Local area',
      },
      'plumbing-emergency': {
        description:
          'Kitchen sink is clogged and water is backing up. Need immediate assistance to clear drain and check for any pipe damage.',
        service_type: 'plumbing' as const,
        urgency: 'emergency' as const,
        location: 'Downtown area',
        special_requirements: ['After hours service needed'],
      },
      'electrical-outlet': {
        description:
          'Install 4 new electrical outlets in living room and replace 2 old outlets in kitchen. Need GFCI outlets for kitchen.',
        service_type: 'electrical' as const,
        property_details: {
          square_footage: 1200,
          age: 25,
        },
        urgency: 'normal' as const,
      },
      'hvac-maintenance': {
        description:
          'Annual HVAC maintenance check for central air system. System is 5 years old, cooling seems weak this summer.',
        service_type: 'hvac' as const,
        property_details: {
          square_footage: 1800,
        },
        urgency: 'low' as const,
      },
    };

    const testRequest = scenarios[scenario as keyof typeof scenarios];
    if (!testRequest) {
      return NextResponse.json({ error: 'Invalid scenario' }, { status: 400 });
    }

    // Generate estimate using current settings
    const result = await generateAIEstimate({
      settings,
      request: testRequest,
      useVision: false, // Don't use vision for test scenarios
    });

    return NextResponse.json({
      success: true,
      scenario,
      request: testRequest,
      result,
      settings_used: {
        profit_margin: settings.default_profit_margin,
        labor_rate: settings.billable_hourly_rate,
        material_markup: settings.material_markup_percentage,
        overhead: settings.overhead_percentage,
        tax_rate: settings.default_tax_rate,
      },
    });
  } catch (error) {
    console.error('Error testing AI estimator:', error);
    return NextResponse.json(
      { error: 'Failed to generate test estimate' },
      { status: 500 }
    );
  }
}
