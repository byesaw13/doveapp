import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext, canAccessTech } from '@/lib/auth-guards';
import {
  createAuthenticatedClient,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/api-helpers';
import { PerformanceLogger } from '@/lib/api/performance';
import { validateRequest, createJobSchema } from '@/lib/api/validation';
import type { JobStatus } from '@/types/job';

// GET /api/jobs - Get all jobs with optional filtering
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'GET');

  try {
    // Validate authentication and get account context
    const context = await requireAccountContext(request);
    const supabase = createAuthenticatedClient(request);
    const { searchParams } = url;
    const clientId = searchParams.get('client_id');
    const statusParam = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query with account filtering
    let query = supabase
      .from('jobs')
      .select(
        `
        *,
        client:customers (
          id,
          name,
          email,
          phone
        )
      `
      )
      .order('created_at', { ascending: false });

    // CRITICAL: Filter by account_id for multi-tenancy
    query = query.eq('account_id', context.accountId);

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (statusParam && statusParam !== 'all') {
      query = query.eq('status', statusParam);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    perfLogger.incrementQueryCount();
    const { data: jobs, error } = await query;

    if (error) {
      console.error('Error fetching jobs:', error);
      perfLogger.complete(500);
      return errorResponse(error, 'Failed to fetch jobs');
    }

    // Add deprecation headers
    const response = NextResponse.json(jobs || []);
    response.headers.set('Deprecation', 'version="1"');
    response.headers.set('Link', '</api/admin/jobs>; rel="successor-version"');
    response.headers.set('Sunset', 'Mon, 31 Mar 2025 23:59:59 GMT');

    // Add performance headers
    const metrics = perfLogger.complete(200);
    response.headers.set('X-Response-Time', `${metrics.duration}ms`);
    if (metrics.queryCount) {
      response.headers.set('X-Query-Count', metrics.queryCount.toString());
    }

    return response;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    perfLogger.complete(401);
    return unauthorizedResponse();
  }
}

// POST /api/jobs - Create a new job
export async function POST(request: NextRequest) {
  try {
    const context = await requireAccountContext(request);

    // Require tech/admin access to create jobs
    if (!canAccessTech(context.role)) {
      return Response.json({ error: 'Tech access required' }, { status: 403 });
    }

    const supabase = createAuthenticatedClient(request);

    // Validate request body
    const { data, error: validationError } = await validateRequest(
      request,
      createJobSchema
    );
    if (validationError) return validationError;

    // Add account_id to job data
    const jobData = {
      account_id: context.accountId,
      customer_id: data!.client_id, // Map client_id to customer_id
      property_id: data!.property_id || null,
      title: data!.title,
      description: data!.description || null,
      status: data!.status || 'scheduled',
      service_date: data!.scheduled_date, // Map scheduled_date to service_date
      assigned_tech_id: null,
      subtotal: 0,
      tax: 0,
      total: 0,
    };

    const { data: job, error } = await supabase
      .from('jobs')
      .insert(jobData)
      .select()
      .single();

    if (error) {
      console.error('Error creating job:', error);
      return errorResponse(error, 'Failed to create job');
    }

    // Add deprecation headers
    const response = NextResponse.json(job, { status: 201 });
    response.headers.set('Deprecation', 'version="1"');
    response.headers.set('Link', '</api/admin/jobs>; rel="successor-version"');
    response.headers.set('Sunset', 'Mon, 31 Mar 2025 23:59:59 GMT');
    return response;
  } catch (error) {
    console.error('Error creating job:', error);
    return unauthorizedResponse();
  }
}
