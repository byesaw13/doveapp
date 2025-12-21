import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateScheduleSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  scheduled_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  start_time: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  end_time: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  schedule_type: z
    .enum([
      'work',
      'meeting',
      'training',
      'vacation',
      'sick',
      'personal',
      'other',
    ])
    .optional(),
  is_all_day: z.boolean().optional(),
  location: z.string().optional(),
});

// GET /api/admin/team/schedules/[id] - Get a specific schedule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from('team_schedules')
      .select(
        `
        *,
        created_by_user:auth.users!created_by(full_name, email)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching team schedule:', error);
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in team schedule API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/team/schedules/[id] - Update a schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const body = await request.json();

    const validatedData = updateScheduleSchema.parse(body);

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updateData = {
      ...validatedData,
      ...(validatedData.scheduled_date && {
        scheduled_date: new Date(validatedData.scheduled_date)
          .toISOString()
          .split('T')[0],
      }),
    };

    const { data, error } = await supabase
      .from('team_schedules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating team schedule:', error);
      return NextResponse.json(
        { error: 'Failed to update schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error in team schedule API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/team/schedules/[id] - Delete a schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;

    const { error } = await supabase
      .from('team_schedules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting team schedule:', error);
      return NextResponse.json(
        { error: 'Failed to delete schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in team schedule API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
