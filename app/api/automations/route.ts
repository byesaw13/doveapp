import { NextRequest, NextResponse } from 'next/server';
import { listAutomationsWithHistory } from '@/lib/db/automations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const status = statusParam && statusParam !== 'all' ? statusParam : 'all';

    const automations = await listAutomationsWithHistory({
      status: status as any,
      limit: 100,
    });

    return NextResponse.json({ automations });
  } catch (error) {
    console.error('Failed to list automations', error);
    return NextResponse.json(
      { error: 'Failed to list automations' },
      { status: 500 }
    );
  }
}
