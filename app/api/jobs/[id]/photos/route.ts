import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards';
import {
  createAuthenticatedClient,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/api-helpers';

// GET /api/jobs/[id]/photos - Get all photos for a job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const context = await requireAccountContext(request);
    const supabase = createAuthenticatedClient(request);

    // Verify job exists and belongs to account
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .eq('account_id', context.accountId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Fetch photos for this job
    const { data: photos, error } = await supabase
      .from('job_photos')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching photos:', error);
      return errorResponse(error, 'Failed to fetch photos');
    }

    return NextResponse.json(photos || []);
  } catch (error) {
    console.error('Error fetching photos:', error);
    return unauthorizedResponse();
  }
}

// POST /api/jobs/[id]/photos - Create a new photo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const context = await requireAccountContext(request);
    const supabase = createAuthenticatedClient(request);
    const body = await request.json();

    // Verify job exists and belongs to account
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .eq('account_id', context.accountId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Create photo
    const { data: photo, error } = await supabase
      .from('job_photos')
      .insert({
        job_id: jobId,
        image_url: body.image_url,
        caption: body.caption || null,
        taken_at: body.taken_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating photo:', error);
      return errorResponse(error, 'Failed to create photo');
    }

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error('Error creating photo:', error);
    return unauthorizedResponse();
  }
}
