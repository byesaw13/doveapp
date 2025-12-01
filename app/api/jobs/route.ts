import { NextRequest, NextResponse } from 'next/server';
import { getJobs, getJobsByClient } from '@/lib/db/jobs';

// GET /api/jobs - Get all jobs or jobs by client
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');

    if (clientId) {
      const jobs = await getJobsByClient(clientId);
      return NextResponse.json({ jobs });
    }

    const jobs = await getJobs();
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
