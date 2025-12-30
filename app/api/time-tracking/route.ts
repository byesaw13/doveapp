import { NextRequest, NextResponse } from 'next/server';
import { isDemoMode } from '@/lib/auth/demo';

// Time tracking API with demo data
export async function GET(request: NextRequest) {
  if (!isDemoMode()) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  return NextResponse.json({
    timeEntries: [],
    totalHours: 0,
    currentWeek: 0,
    message: 'Time tracking available in demo mode',
  });
}

export async function POST(request: NextRequest) {
  if (!isDemoMode()) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  return NextResponse.json({
    success: true,
    message: 'Time tracking saved (demo mode)',
  });
}
