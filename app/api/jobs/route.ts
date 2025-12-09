import { NextRequest, NextResponse } from 'next/server';
import { getJobs, getJobsByClient, listJobsWithFilters } from '@/lib/db/jobs';
import type { JobStatus } from '@/types/job';

// GET /api/jobs - Get all jobs with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');
    const status = searchParams.get('status') as JobStatus | null;
    const search = searchParams.get('search');

    // Legacy support for client_id filter
    if (clientId) {
      const jobs = await getJobsByClient(clientId);
      return NextResponse.json(jobs);
    }

    // New filtering support
    if (status || search) {
      const filters = {
        status: status && status !== 'all' ? status : undefined,
        search: search || undefined,
      };
      const jobs = await listJobsWithFilters(filters);
      return NextResponse.json(jobs);
    }

    // Default: get all jobs
    const jobs = await getJobs();
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    // Return empty array to prevent app crash, error logged above
    return NextResponse.json([]);
  }
}
