import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';
import { z } from 'zod';

const assignmentSchema = z.object({
  job_id: z.string().uuid(),
  user_id: z.string().uuid(),
  scheduled_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  scheduled_start_time: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  scheduled_end_time: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  estimated_duration_hours: z.number().positive().optional(),
  notes: z.string().optional(),
});

// GET /api/admin/team/assignments - Get team assignments with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const { searchParams } = new URL(request.url);

    const jobId = searchParams.get('job_id');
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('team_assignments')
      .select(
        `
        *,
        job:jobs(id, job_number, title, status),
        user:auth.users(id, raw_user_meta_data),
        assigned_by_user:auth.users!assigned_by(full_name, email)
      `
      )
      .order('created_at', { ascending: false });

    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching team assignments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch team assignments' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in team assignments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/team/assignments - Create a new assignment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const body = await request.json();

    const validatedData = assignmentSchema.parse(body);

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignmentData = {
      ...validatedData,
      assigned_by: user.id,
      ...(validatedData.scheduled_date && {
        scheduled_date: new Date(validatedData.scheduled_date)
          .toISOString()
          .split('T')[0],
      }),
    };

    const { data, error } = await supabase
      .from('team_assignments')
      .insert(assignmentData)
      .select()
      .single();

    if (error) {
      console.error('Error creating team assignment:', error);
      return NextResponse.json(
        { error: 'Failed to create assignment' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error in team assignments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
