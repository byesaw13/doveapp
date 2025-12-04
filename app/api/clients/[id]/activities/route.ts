import { NextRequest, NextResponse } from 'next/server';
import {
  getClientActivities,
  createActivity,
  deleteActivity,
} from '@/lib/db/activities';

// GET /api/clients/[id]/activities - Get timeline activities for a client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const type = searchParams.get('type') || undefined;

    const limit = limitParam ? Math.min(Number(limitParam), 200) : 100;

    const activities = await getClientActivities(id, {
      limit,
      activityType: type,
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching client activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client activities' },
      { status: 500 }
    );
  }
}

// POST /api/clients/[id]/activities - Create a new activity
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.activity_type || !body.title) {
      return NextResponse.json(
        { error: 'activity_type and title are required' },
        { status: 400 }
      );
    }

    const activity = await createActivity({
      ...body,
      client_id: id,
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Error creating client activity:', error);
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id]/activities - Delete an activity (requires activity_id query param)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // ensure client exists in path
    const searchParams = request.nextUrl.searchParams;
    const activityId = searchParams.get('activity_id');

    if (!activityId) {
      return NextResponse.json(
        { error: 'activity_id query parameter is required' },
        { status: 400 }
      );
    }

    await deleteActivity(activityId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client activity:', error);
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    );
  }
}
