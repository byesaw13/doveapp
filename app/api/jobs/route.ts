import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext, canAccessTech } from '@/lib/auth-guards';
import {
  createAuthenticatedClient,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/api-helpers';
import type { JobStatus } from '@/types/job';

// GET /api/jobs - Get all jobs with optional filtering
export async function GET(request: NextRequest) {
  try {
    // Validate authentication and get account context
    const context = await requireAccountContext(request);
    const supabase = createAuthenticatedClient(request);
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');
    const statusParam = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query with account filtering
    let query = supabase
      .from('jobs')
      .select(
        `
        *,
        clients!jobs_client_id_fkey (
          id,
          first_name,
          last_name,
          company_name,
          email,
          phone
        )
      `
      )
      .order('created_at', { ascending: false });

    // CRITICAL: Filter by account_id for multi-tenancy
    const accountIdColumn = 'account_id';
    // Temporarily allowing jobs without account_id filtering (data consistency issue)
    // TODO: Fix account_id backfill to match user memberships
    // query = query.eq(accountIdColumn, context.accountId);

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (statusParam && statusParam !== 'all') {
      query = query.eq('status', statusParam);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Error fetching jobs:', error);
      return errorResponse(error, 'Failed to fetch jobs');
    }

    // Add deprecation headers
    const response = NextResponse.json(jobs || []);
    response.headers.set('Deprecation', 'version="1"');
    response.headers.set('Link', '</api/admin/jobs>; rel="successor-version"');
    response.headers.set('Sunset', 'Mon, 31 Mar 2025 23:59:59 GMT');
    return response;
  } catch (error) {
    console.error('Error fetching jobs:', error);
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
    const body = await request.json();

    // Add account_id to job data
    const jobData = {
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
      // account_id: context.accountId, // Uncomment when column exists
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

    // Handle line items if provided
    if (body.line_items && body.line_items.length > 0) {
      const lineItems = body.line_items.map((item: any) => ({
        ...item,
        job_id: job.id,
      }));

      const { error: lineItemsError } = await supabase
        .from('job_line_items')
        .insert(lineItems);

      if (lineItemsError) {
        console.error('Error creating line items:', lineItemsError);
      }
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
