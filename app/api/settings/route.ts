import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateBusinessSettings,
  updateBusinessSettings,
} from '@/lib/db/business-settings';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { canManageAdmin } from '@/lib/auth-guards';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';
import { isDemoMode } from '@/lib/auth/demo';

// GET /api/settings - Get business settings
export async function GET(request: NextRequest) {
  try {
    // Try to get account context, but allow demo access if no account
    let context;
    let supabase;
    try {
      context = await requireAccountContext(request);
      if (!canManageAdmin(context.role)) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
      supabase = await createRouteHandlerClient();
    } catch (error) {
      if (!isDemoMode()) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      // For demo purposes, return default settings
      return NextResponse.json({
        id: 'demo-settings',
        account_id: 'demo',
        business_name: 'Demo Services LLC',
        business_address: '123 Demo Street',
        business_phone: '(555) 123-4567',
        business_email: 'demo@example.com',
        ai_automation: {
          estimate_followups: true,
          invoice_followups: true,
          job_closeout: true,
          review_requests: true,
          lead_response: true,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

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
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const supabase = await createRouteHandlerClient();
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
