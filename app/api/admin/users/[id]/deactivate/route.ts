import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext, canManageAdmin } from '@/lib/auth-guards';
import { createAdminClient, errorResponse } from '@/lib/api-helpers';
import { logAuditEvent } from '@/lib/audit-log';

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

    // Prevent deactivating owner
    if (membership.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot deactivate account owner' },
        { status: 403 }
      );
    }

    // Prevent self-deactivation
    if (userId === context.userId) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 403 }
      );
    }

    // Deactivate the user (soft delete by setting is_active = false)
    const { error: updateError } = await supabase
      .from('account_memberships')
      .update({ is_active: false })
      .eq('account_id', context.accountId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error deactivating user:', updateError);
      return errorResponse(updateError, 'Failed to deactivate user');
    }

    // Log the action
    await logAuditEvent({
      user_id: context.userId,
      account_id: context.accountId,
      action: 'UPDATE',
      resource: 'USER',
      resource_id: userId,
      metadata: { action: 'deactivate', role: membership.role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deactivating user:', error);
    return errorResponse(error, 'Internal server error');
  }
}
