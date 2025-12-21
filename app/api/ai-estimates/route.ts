import { NextRequest, NextResponse } from 'next/server';
import {
  generateAIEstimate,
  getDefaultAIEstimateSettings,
} from '@/lib/ai/estimate-generation';
import { getAIEstimateSettings } from '@/lib/db/ai-estimate-settings';
import type { AIEstimateRequest } from '@/types/estimate';
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
      `ai-estimate:${ip}`,
      RATE_LIMITS.AI_OPERATIONS
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'AI estimate rate limit exceeded',
          message: 'Too many AI estimate requests. Please try again later.',
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetAt),
        }
      );
    }

    // Check for OpenAI API key first
    if (!process.env.OPENAI_API_KEY) {
      console.error(
        'OPENAI_API_KEY is not configured in environment variables'
      );
      return NextResponse.json(
        {
          error:
            'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.',
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      description,
      service_type,
      images,
      property_details,
      urgency,
      client_budget,
      location,
      special_requirements,
    }: AIEstimateRequest = body;

    // Validate required fields
    if (!description || !service_type) {
      return NextResponse.json(
        { error: 'Description and service_type are required' },
        { status: 400 }
      );
    }

    // Get user settings or fall back to defaults
    let settings;
    try {
      settings = await getAIEstimateSettings();
    } catch (error) {
      console.warn('Failed to load user settings, using defaults:', error);
      settings = {
        ...getDefaultAIEstimateSettings(),
        id: 'default',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // Generate the AI estimate
    const result = await generateAIEstimate({
      settings,
      request: {
        description,
        service_type,
        images,
        property_details,
        urgency,
        client_budget,
        location,
        special_requirements,
      },
      useVision: images && images.length > 0,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI estimate generation failed:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to generate AI estimate',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve user settings
export async function GET() {
  try {
    const settings = await getAIEstimateSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to load AI estimate settings:', error);
    // Return defaults if settings don't exist yet
    return NextResponse.json({
      ...getDefaultAIEstimateSettings(),
      id: 'default',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}
