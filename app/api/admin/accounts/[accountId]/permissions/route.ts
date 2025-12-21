import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { Permission, UserRole } from '@/lib/auth-guards';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const supabase = createClient();
    const { accountId } = await params;

    // Get current user and verify they have permission to manage users
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users for this account
    const { data: memberships, error } = await supabase
      .from('account_memberships')
      .select(
        `
        user_id,
        role,
        permissions,
        users!inner (
          email,
          full_name
        )
      `
      )
      .eq('account_id', accountId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching account memberships:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Format the response
    const users =
      memberships?.map((membership) => ({
        userId: membership.user_id,
        email: (membership.users as any)?.email || '',
        fullName: (membership.users as any)?.full_name || undefined,
        role: membership.role as UserRole,
        customPermissions: membership.permissions as Permission[] | undefined,
        isCustom:
          Array.isArray(membership.permissions) &&
          membership.permissions.length > 0,
      })) || [];

    return NextResponse.json(users);
  } catch (error) {
    console.error(
      'Error in GET /api/admin/accounts/[accountId]/permissions:',
      error
    );
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const supabase = createClient();
    const { accountId } = await params;
    const body = await request.json();
    const { userId, permissions } = body;

    // Get current user and verify they have permission to manage users
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate permissions array
    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Permissions must be an array' },
        { status: 400 }
      );
    }

    // Update permissions (empty array means use role defaults)
    const { error: updateError } = await supabase
      .from('account_memberships')
      .update({
        permissions: permissions.length > 0 ? permissions : null,
        updated_at: new Date().toISOString(),
      })
      .eq('account_id', accountId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating permissions:', updateError);
      return NextResponse.json(
        { error: 'Failed to update permissions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      'Error in PATCH /api/admin/accounts/[accountId]/permissions:',
      error
    );
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
