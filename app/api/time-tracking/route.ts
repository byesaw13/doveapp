import { NextRequest, NextResponse } from 'next/server';

// Temporarily disabled due to build issues
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Time tracking temporarily disabled' },
    { status: 503 }
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Time tracking temporarily disabled' },
    { status: 503 }
  );
}
