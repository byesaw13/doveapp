import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext } from '@/lib/auth-guards-api';
import { canManageAdmin } from '@/lib/auth-guards';
import { createAdminClient, errorResponse } from '@/lib/api-helpers';
import { logAuditEvent } from '@/lib/audit-log';

type UpdateUserRoleBody = {
  role?: 'OWNER' | 'ADMIN' | 'TECH' | string;
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAccountContext(request);

    if (!canManageAdmin(context.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();
    const { id: userId } = await params;
    const body = (await request.json()) as UpdateUserRoleBody;
    const { role } = body;

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    // Validate role
    if (!['OWNER', 'ADMIN', 'TECH'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be OWNER, ADMIN, or TECH' },
        { status: 400 }
      );
    }

    // Check if user exists and belongs to the account
    const { data: membership, error: membershipError } = await supabase
      .from('account_memberships')
      .select('role, is_active')
      .eq('account_id', context.accountId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'User not found or not part of this account' },
        { status: 404 }
      );
    }

    // Prevent changing owner role
    if (membership.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot change owner role' },
        { status: 403 }
      );
    }

    // Update the role
    const { error: updateError } = await supabase
      .from('account_memberships')
      .update({ role })
      .eq('account_id', context.accountId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating user role:', updateError);
      return errorResponse(updateError, 'Failed to update user role');
    }

    // Log the action
    await logAuditEvent({
      user_id: context.userId,
      account_id: context.accountId,
      action: 'UPDATE',
      resource: 'USER',
      resource_id: userId,
      metadata: { old_role: membership.role, new_role: role },
    });

    return NextResponse.json({ success: true, role });
  } catch (error) {
    console.error('Error updating user role:', error);
    return errorResponse(error, 'Internal server error');
  }
}
