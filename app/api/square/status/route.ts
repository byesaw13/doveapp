import { NextResponse } from 'next/server';
import { isSquareConnected } from '@/lib/square/token-manager';

export async function GET() {
  try {
    const connected = await isSquareConnected();
    return NextResponse.json({ connected });
  } catch (error) {
    console.error('Error checking Square status:', error);
    return NextResponse.json({ connected: false });
  }
}
