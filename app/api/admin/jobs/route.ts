import { NextRequest, NextResponse } from 'next/server';
import { requireAdminContext } from '@/lib/auth-guards';
import { createAuthenticatedClient } from '@/lib/api-helpers';
import { listJobs, createJob, type JobFilters } from '@/lib/api/jobs';

/**
 * GET /api/admin/jobs - List all jobs (admin full access)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const context = await requireAdminContext(request);
    const supabase = createAuthenticatedClient(request);
    const { searchParams } = new URL(request.url);

    const filters: JobFilters = {
      clientId: searchParams.get('client_id') || undefined,
      status: (searchParams.get('status') as any) || undefined,
      search: searchParams.get('search') || undefined,
      assignedTechId: searchParams.get('assigned_tech_id') || undefined,
    };

    const { data, error } = await listJobs(
      {
        accountId: context.accountId,
        userId: context.userId,
        role: context.role,
        supabase,
      },
      filters
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error in GET /api/admin/jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication required' },
      { status: error.message?.includes('required') ? 401 : 500 }
    );
  }
}

/**
 * POST /api/admin/jobs - Create a new job (admin full access)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const context = await requireAdminContext(request);
    const supabase = createAuthenticatedClient(request);
    const body = await request.json();

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
      assigned_tech_id: body.assigned_tech_id || null,
      line_items: body.line_items || [],
    };

    const { data, error } = await createJob(
      {
        accountId: context.accountId,
        userId: context.userId,
        role: context.role,
        supabase,
      },
      jobData
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/admin/jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication required' },
      { status: error.message?.includes('required') ? 401 : 500 }
    );
  }
}
