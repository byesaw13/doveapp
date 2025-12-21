import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { AIEstimateSettings } from '@/types/estimate';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    // Get global settings
    const { data: settings, error } = await supabase
      .from('ai_estimate_settings')
      .select('*')
      .is('user_id', null)
      .single();

    if (error) throw error;

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching AI estimate settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI estimate settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received settings update:', JSON.stringify(body, null, 2));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    // Check current user auth
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log('Current user:', user?.id, user?.email);

    // Check user's role
    const { data: membership } = await supabase
      .from('account_memberships')
      .select('role')
      .eq('user_id', user?.id)
      .maybeSingle();
    console.log('User role:', membership?.role);

    // Check if settings exist
    const { data: existing } = await supabase
      .from('ai_estimate_settings')
      .select('id')
      .is('user_id', null)
      .maybeSingle();

    let settings: AIEstimateSettings;

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('ai_estimate_settings')
        .update(body)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      settings = data as AIEstimateSettings;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('ai_estimate_settings')
        .insert(body)
        .select()
        .single();

      if (error) throw error;
      settings = data as AIEstimateSettings;
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error updating AI estimate settings:', error);
    return NextResponse.json(
      {
        error: 'Failed to update AI estimate settings',
        details: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}
