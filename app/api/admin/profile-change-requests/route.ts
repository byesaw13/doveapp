import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, getCurrentUser } from '@/lib/supabase-auth';
import { supabase } from '@/lib/supabase';
import { canManageAdmin } from '@/lib/auth-guards';

export async function GET(request: NextRequest) {
  try {
    const supabaseAuth = await createAuthClient();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: membership } = await supabase
      .from('account_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';

    // Get change requests
    const { data: requests, error } = await supabase
      .from('profile_change_requests')
      .select(
        `
        *,
        users:requested_by (
          id,
          email,
          full_name
        ),
        employee_profiles (
          first_name,
          last_name,
          job_title
        )
      `
      )
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching change requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests: requests || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/profile-change-requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabaseAuth = await createAuthClient();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: membership } = await supabase
      .from('account_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { requestId, action, reviewNotes } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get the change request
    const { data: changeRequest, error: fetchError } = await supabase
      .from('profile_change_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !changeRequest) {
      return NextResponse.json(
        { error: 'Change request not found' },
        { status: 404 }
      );
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Update the change request
    const { error: updateError } = await supabase
      .from('profile_change_requests')
      .update({
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes,
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating change request:', updateError);
      return NextResponse.json(
        { error: 'Failed to update request' },
        { status: 500 }
      );
    }

    // If approved, apply the changes
    if (action === 'approve') {
      if (changeRequest.change_type === 'create') {
        // Create new profile
        const { error: createError } = await supabase
          .from('employee_profiles')
          .insert({
            user_id: changeRequest.user_id,
            ...changeRequest.requested_changes,
            created_by: user.id,
            updated_by: user.id,
          });

        if (createError) {
          console.error('Error creating profile:', createError);
          return NextResponse.json(
            { error: 'Failed to create profile' },
            { status: 500 }
          );
        }
      } else if (changeRequest.change_type === 'update') {
        // Update existing profile
        const { error: updateProfileError } = await supabase
          .from('employee_profiles')
          .update({
            ...changeRequest.requested_changes,
            updated_by: user.id,
          })
          .eq('user_id', changeRequest.user_id);

        if (updateProfileError) {
          console.error('Error updating profile:', updateProfileError);
          return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('Error in PUT /api/admin/profile-change-requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
