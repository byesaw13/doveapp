import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase logout error:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
