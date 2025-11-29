import { NextResponse } from 'next/server';
import { disconnectSquare } from '@/lib/square/token-manager';

export async function POST() {
  try {
    await disconnectSquare();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Square:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
