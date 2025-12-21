import { NextRequest, NextResponse } from 'next/server';

// Time tracking API with demo data
export async function GET(request: NextRequest) {
  return NextResponse.json({
    timeEntries: [],
    totalHours: 0,
    currentWeek: 0,
    message: 'Time tracking available in demo mode',
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Time tracking saved (demo mode)',
  });
}
