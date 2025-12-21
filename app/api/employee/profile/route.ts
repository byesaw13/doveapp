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

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    // If userId is provided, check permissions
    if (userId && userId !== user.id) {
      const { data: membership } = await supabase
        .from('account_memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Get employee profile
    const targetUserId = userId || user.id;
    const { data: profile, error } = await supabase
      .from('employee_profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching employee profile:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: profile || null });
  } catch (error) {
    console.error('Error in GET /api/employee/profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAuth = await createAuthClient();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      first_name,
      last_name,
      display_name,
      personal_email,
      work_email,
      primary_phone,
      secondary_phone,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      address_line1,
      address_line2,
      city,
      state,
      zip_code,
      country,
      employee_id,
      hire_date,
      employment_status,
      job_title,
      department,
      manager_id,
      hourly_rate,
      overtime_rate,
      salary,
      pay_frequency,
      work_schedule,
      skills,
      certifications,
      licenses,
      notes,
      custom_fields,
    } = body;

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('employee_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Profile already exists' },
        { status: 409 }
      );
    }

    // Check permissions for sensitive fields
    const { data: membership } = await supabase
      .from('account_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    const isAdmin = membership && ['OWNER', 'ADMIN'].includes(membership.role);

    // If user is not admin, create change request instead of direct update
    if (!isAdmin) {
      const { error: requestError } = await supabase
        .from('profile_change_requests')
        .insert({
          user_id: user.id,
          change_type: 'create',
          requested_changes: {
            first_name,
            last_name,
            display_name,
            personal_email,
            work_email,
            primary_phone,
            secondary_phone,
            emergency_contact_name,
            emergency_contact_phone,
            emergency_contact_relationship,
            address_line1,
            address_line2,
            city,
            state,
            zip_code,
            country,
            employee_id,
            hire_date,
            employment_status,
            job_title,
            department,
            manager_id,
            hourly_rate,
            overtime_rate,
            salary,
            pay_frequency,
            work_schedule,
            skills,
            certifications,
            licenses,
            notes,
            custom_fields,
          },
          requested_by: user.id,
        });

      if (requestError) {
        console.error('Error creating change request:', requestError);
        return NextResponse.json(
          { error: 'Failed to submit change request' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Profile change request submitted for approval',
        requiresApproval: true,
      });
    }

    // Admin can create profile directly
    const { data: profile, error } = await supabase
      .from('employee_profiles')
      .insert({
        user_id: user.id,
        first_name,
        last_name,
        display_name,
        personal_email,
        work_email,
        primary_phone,
        secondary_phone,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relationship,
        address_line1,
        address_line2,
        city,
        state,
        zip_code,
        country,
        employee_id,
        hire_date,
        employment_status,
        job_title,
        department,
        manager_id,
        hourly_rate,
        overtime_rate,
        salary,
        pay_frequency,
        work_schedule,
        skills,
        certifications,
        licenses,
        notes,
        custom_fields,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating employee profile:', error);
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error in POST /api/employee/profile:', error);
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

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    const body = await request.json();
    const updates = body;

    // Check permissions
    const { data: membership } = await supabase
      .from('account_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    const isAdmin = membership && ['OWNER', 'ADMIN'].includes(membership.role);
    const targetUserId = userId || user.id;

    // If updating someone else's profile, must be admin
    if (userId && userId !== user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // If user is not admin and updating their own profile, create change request
    if (!isAdmin && targetUserId === user.id) {
      // Get current profile values
      const { data: currentProfile } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { error: requestError } = await supabase
        .from('profile_change_requests')
        .insert({
          user_id: user.id,
          employee_profile_id: currentProfile?.id,
          change_type: 'update',
          requested_changes: updates,
          current_values: currentProfile,
          requested_by: user.id,
        });

      if (requestError) {
        console.error('Error creating change request:', requestError);
        return NextResponse.json(
          { error: 'Failed to submit change request' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Profile change request submitted for approval',
        requiresApproval: true,
      });
    }

    // Admin can update directly
    const { data: profile, error } = await supabase
      .from('employee_profiles')
      .update({
        ...updates,
        updated_by: user.id,
      })
      .eq('user_id', targetUserId)
      .select()
      .single();

    if (error) {
      console.error('Error updating employee profile:', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error in PUT /api/employee/profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
