import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const availabilitySchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  end_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  is_available: z.boolean().optional().default(true),
});

const bulkAvailabilitySchema = z.object({
  availabilities: z.array(availabilitySchema),
});

// GET /api/admin/team/availability - Get team availability
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get('user_id');
    const dayOfWeek = searchParams.get('day_of_week');

    let query = supabase
      .from('team_availability')
      .select('*')
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (dayOfWeek) {
      query = query.eq('day_of_week', parseInt(dayOfWeek));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching team availability:', error);
      return NextResponse.json(
        { error: 'Failed to fetch team availability' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in team availability API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/team/availability - Create availability entry
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Check if it's bulk or single
    if (body.availabilities) {
      const validatedData = bulkAvailabilitySchema.parse(body);

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const availabilityData = validatedData.availabilities.map((avail) => ({
        ...avail,
        user_id: user.id,
      }));

      const { data, error } = await supabase
        .from('team_availability')
        .insert(availabilityData)
        .select();

      if (error) {
        console.error('Error creating team availability:', error);
        return NextResponse.json(
          { error: 'Failed to create availability entries' },
          { status: 500 }
        );
      }

      return NextResponse.json(data, { status: 201 });
    } else {
      const validatedData = availabilitySchema.parse(body);

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const availabilityData = {
        ...validatedData,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('team_availability')
        .insert(availabilityData)
        .select()
        .single();

      if (error) {
        console.error('Error creating team availability:', error);
        return NextResponse.json(
          { error: 'Failed to create availability entry' },
          { status: 500 }
        );
      }

      return NextResponse.json(data, { status: 201 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error in team availability API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
