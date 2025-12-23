import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

// Validation schemas
const availabilitySchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  end_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  is_available: z.boolean().optional().default(true),
});

const scheduleSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  end_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  schedule_type: z.enum([
    'work',
    'meeting',
    'training',
    'vacation',
    'sick',
    'personal',
    'other',
  ]),
  is_all_day: z.boolean().optional().default(false),
  location: z.string().optional(),
});

// GET /api/admin/team/schedules - Get team schedules with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get('user_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const scheduleType = searchParams.get('type');

    let query = supabase
      .from('team_schedules')
      .select(
        `
        *,
        created_by_user:auth.users!created_by(full_name, email)
      `
      )
      .order('scheduled_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (startDate) {
      query = query.gte('scheduled_date', startDate);
    }

    if (endDate) {
      query = query.lte('scheduled_date', endDate);
    }

    if (scheduleType) {
      query = query.eq('schedule_type', scheduleType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching team schedules:', error);
      return NextResponse.json(
        { error: 'Failed to fetch team schedules' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in team schedules API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/team/schedules - Create a new schedule entry
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const validatedData = scheduleSchema.parse(body);

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scheduleData = {
      ...validatedData,
      scheduled_date: new Date(validatedData.scheduled_date)
        .toISOString()
        .split('T')[0],
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from('team_schedules')
      .insert(scheduleData)
      .select()
      .single();

    if (error) {
      console.error('Error creating team schedule:', error);
      return NextResponse.json(
        { error: 'Failed to create schedule entry' },
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

    console.error('Error in team schedules API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
