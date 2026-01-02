import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { canAccessTech } from '@/lib/auth-guards';
import { errorResponse, unauthorizedResponse } from '@/lib/api-helpers';
import { PerformanceLogger } from '@/lib/api/performance';
import { validateRequest, createJobSchema } from '@/lib/api/validation';
import type { JobStatus } from '@/types/job';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

// GET /api/jobs - Get all jobs with optional filtering
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, 'GET');

  try {
    // Validate authentication and get account context
    const context = await requireAccountContext(request);
    const supabase = await createRouteHandlerClient();
    const { searchParams } = url;
    const clientId = searchParams.get('client_id');
    const statusParam = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query with account filtering
    let query = supabase
      .from('jobs')
      .select(
        '*, client:clients!jobs_client_id_fkey(id, first_name, last_name, company_name, email, phone)'
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

    const supabase = await createRouteHandlerClient();

    // Validate request body
    const { data, error: validationError } = await validateRequest(
      request,
      createJobSchema
    );
    if (validationError) return validationError;

    if (data?.client_id == null) {
      return NextResponse.json(
        { error: 'client_id is required' },
        { status: 400 }
      );
    }

    // Validate property_id if provided
    if (data!.property_id) {
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('id, client_id')
        .eq('id', data!.property_id)
        .eq('account_id', context.accountId)
        .single();

      if (propertyError || !property) {
        return NextResponse.json(
          { error: 'Invalid property_id: property not found or access denied' },
          { status: 400 }
        );
      }

      if (property.client_id !== data!.client_id) {
        return NextResponse.json(
          { error: 'Property does not belong to the specified client' },
          { status: 400 }
        );
      }
    }

    // Generate job_number
    const jobNumber = `JOB-${Date.now()}`;

    const jobData = {
      account_id: context.accountId,
      // ✅ REQUIRED by DB
      client_id: data!.client_id,
      // Optional: only keep if you actually use portal customers here
      customer_id: null,
      property_id: data!.property_id || null,
      job_number: jobNumber,
      title: data!.title,
      description: data!.description || null,
      status: data!.status || 'scheduled',
      service_date: data!.scheduled_date,
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

    const { error: noteError } = await supabase.from('job_notes').insert({
      job_id: job.id,
      technician_id: context.userId,
      note: 'Job created',
      account_id: context.accountId,
    });

    if (noteError) {
      console.warn('Failed to log job creation note:', noteError);
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
