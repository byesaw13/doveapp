import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateBusinessSettings,
  updateBusinessSettings,
} from '@/lib/db/business-settings';

// GET /api/settings - Get business settings
export async function GET() {
  try {
    const settings = await getOrCreateBusinessSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching business settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business settings' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update business settings
export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json();
    const settings = await updateBusinessSettings(updates);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating business settings:', error);
    return NextResponse.json(
      { error: 'Failed to update business settings' },
      { status: 500 }
    );
  }
}
