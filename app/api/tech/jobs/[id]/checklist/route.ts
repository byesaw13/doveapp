import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: jobId } = await params;

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch checklist items
    const { data: items, error } = await supabase
      .from('job_checklist_items')
      .select('*')
      .eq('job_id', jobId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching checklist items:', error);
      return NextResponse.json(
        { error: 'Failed to fetch checklist items' },
        { status: 500 }
      );
    }

    return NextResponse.json(items || []);
  } catch (error) {
    console.error('Error in GET /api/tech/jobs/[id]/checklist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: jobId } = await params;
    const body = await request.json();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { item_text } = body;

    if (
      !item_text ||
      typeof item_text !== 'string' ||
      item_text.trim().length === 0
    ) {
      return NextResponse.json(
        { error: 'Item text is required' },
        { status: 400 }
      );
    }

    // Get max sort order for this job
    const { data: maxSortOrder } = await supabase
      .from('job_checklist_items')
      .select('sort_order')
      .eq('job_id', jobId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const nextSortOrder = (maxSortOrder?.sort_order || 0) + 1;

    // Insert checklist item
    const { data, error } = await supabase
      .from('job_checklist_items')
      .insert({
        job_id: jobId,
        item_text: item_text.trim(),
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding checklist item:', error);
      return NextResponse.json(
        { error: 'Failed to add checklist item' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/tech/jobs/[id]/checklist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
