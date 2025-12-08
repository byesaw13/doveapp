import { NextRequest, NextResponse } from 'next/server';
import {
  generateAIEstimate,
  getDefaultAIEstimateSettings,
} from '@/lib/ai/estimate-generation';
import { getAIEstimateSettings } from '@/lib/db/ai-estimate-settings';
import type { AIEstimateRequest } from '@/types/estimate';

export async function POST(request: NextRequest) {
  try {
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
    return NextResponse.json(
      { error: 'Failed to generate AI estimate' },
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
