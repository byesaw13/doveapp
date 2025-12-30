import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { errorResponse, unauthorizedResponse } from '@/lib/api-helpers';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

// GET /api/jobs/[id]/notes - Get all notes for a job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const context = await requireAccountContext(request);
    const supabase = await createRouteHandlerClient();

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

    // Fetch notes for this job with user info
    const { data: notes, error } = await supabase
      .from('job_notes')
      .select(
        `
        id,
        job_id,
        technician_id,
        note,
        created_at,
        updated_at,
        technician:users(id, full_name, email, avatar_url)
      `
      )
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return errorResponse(error, 'Failed to fetch notes');
    }

    return NextResponse.json(notes || []);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return unauthorizedResponse();
  }
}

// POST /api/jobs/[id]/notes - Create a new note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const context = await requireAccountContext(request);
    const supabase = await createRouteHandlerClient();
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

    // Create note
    const { data: note, error } = await supabase
      .from('job_notes')
      .insert({
        job_id: jobId,
        technician_id: context.userId,
        note: body.note,
      })
      .select(
        `
        id,
        job_id,
        technician_id,
        note,
        created_at,
        updated_at,
        technician:users(id, full_name, email, avatar_url)
      `
      )
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return errorResponse(error, 'Failed to create note');
    }

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return unauthorizedResponse();
  }
}
