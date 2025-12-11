import { NextRequest, NextResponse } from 'next/server';
import {
  getJobs,
  getJobsByClient,
  listJobsWithFilters,
  listJobsWithAdvancedFilters,
  createJob,
} from '@/lib/db/jobs';
import type { JobStatus } from '@/types/job';

// GET /api/jobs - Get all jobs with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');
    const statusParam = searchParams.get('status');
    const status = statusParam as JobStatus | null;
    const search = searchParams.get('search');

    // Advanced filter parameters
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const statuses = searchParams.get('statuses');
    const clientIds = searchParams.get('clients');

    // Legacy support for client_id filter
    if (clientId) {
      const jobs = await getJobsByClient(clientId);
      return NextResponse.json(jobs);
    }

    // Advanced filtering support
    const hasAdvancedFilters =
      dateFrom || dateTo || minAmount || maxAmount || statuses || clientIds;

    if (hasAdvancedFilters) {
      const filters = {
        status:
          statusParam && statusParam !== 'all'
            ? (statusParam as JobStatus)
            : undefined,
        search: search || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
        statuses: statuses ? statuses.split(',') : undefined,
        clientIds: clientIds ? clientIds.split(',') : undefined,
      };
      const jobs = await listJobsWithAdvancedFilters(filters);
      return NextResponse.json(jobs);
    }

    // Basic filtering support
    if (status || search) {
      const filters = {
        status:
          statusParam && statusParam !== 'all'
            ? (statusParam as JobStatus)
            : undefined,
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

// POST /api/jobs - Create a new job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Create job with empty line items array
    const job = await createJob(
      {
        client_id: body.client_id,
        property_id: body.property_id || null,
        title: body.title,
        description: body.description || null,
        status: body.status || 'scheduled',
        service_date: body.service_date,
        scheduled_time: body.scheduled_time || null,
        notes: body.notes || null,
        subtotal: body.subtotal || 0,
        tax: body.tax || 0,
        total: body.total || 0,
      },
      body.line_items || []
    );

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}
