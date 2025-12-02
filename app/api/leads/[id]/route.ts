import { NextRequest, NextResponse } from 'next/server';
import {
  getLead,
  updateLead,
  deleteLead,
  convertLeadToClient,
  getLeadActivities,
  createLeadActivity,
} from '@/lib/db/leads';

// GET /api/leads/[id] - Get lead by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const include = searchParams.get('include');

    if (include === 'activities') {
      const [lead, activities] = await Promise.all([
        getLead(id),
        getLeadActivities(id),
      ]);
      return NextResponse.json({ ...lead, activities });
    }

    const lead = await getLead(id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead' },
      { status: 500 }
    );
  }
}

// PUT /api/leads/[id] - Update lead
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const lead = await updateLead(id, body);
    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}

// DELETE /api/leads/[id] - Delete lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteLead(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    );
  }
}

// POST /api/leads/[id] - Special actions (convert, add activity)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === 'convert') {
      const { client_id } = body;
      if (!client_id) {
        return NextResponse.json(
          { error: 'client_id is required' },
          { status: 400 }
        );
      }
      const lead = await convertLeadToClient(id, client_id);
      return NextResponse.json(lead);
    }

    if (action === 'add_activity') {
      const { activity_type, description, created_by } = body;
      const activity = await createLeadActivity({
        lead_id: id,
        activity_type,
        description,
        created_by,
      });
      return NextResponse.json(activity);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error performing lead action:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
