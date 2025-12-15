import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateBusinessSettings,
  updateBusinessSettings,
} from '@/lib/db/business-settings';
import { requireAccountContext, canManageAdmin } from '@/lib/auth-guards';
import { createAuthenticatedClient } from '@/lib/api-helpers';

// GET /api/settings - Get business settings
export async function GET(request: NextRequest) {
  try {
    const context = await requireAccountContext(request);
    if (!canManageAdmin(context.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createAuthenticatedClient(request);
    const settings = await getOrCreateBusinessSettings(supabase);
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
    const context = await requireAccountContext(request);
    if (!canManageAdmin(context.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createAuthenticatedClient(request);
    const updates = await request.json();
    const settings = await updateBusinessSettings(updates, supabase);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating business settings:', error);
    return NextResponse.json(
      { error: 'Failed to update business settings' },
      { status: 500 }
    );
  }
}
