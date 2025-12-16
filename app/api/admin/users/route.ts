import { NextRequest, NextResponse } from 'next/server';
import { requireAccountContext, canManageAdmin } from '@/lib/auth-guards';
import {
  createAdminClient,
  errorResponse,
  unauthorizedResponse,
} from '@/lib/api-helpers';
import { logAuditEvent } from '@/lib/audit-log';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Validate authentication and require admin access
    const context = await requireAccountContext(request);

    if (!canManageAdmin(context.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Use admin client for user creation (requires service role key)
    const supabase = createAdminClient();
    const body = await request.json();

    const { email, full_name, role, permissions } = body;

    // Validate input
    if (!email || !full_name || !role) {
      return NextResponse.json(
        { error: 'Email, full_name, and role are required' },
        { status: 400 }
      );
    }

    if (!['OWNER', 'ADMIN', 'TECH'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be OWNER, ADMIN, or TECH' },
        { status: 400 }
      );
    }

    // Generate secure temporary password
    const tempPassword = generateSecurePassword();

    // Create auth user
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name,
          created_by: context.userId,
          account_id: context.accountId,
        },
      });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return errorResponse(authError, 'Failed to create user account');
    }

    // Create user profile with password change requirement
    const { error: profileError } = await supabase.from('users').insert({
      id: authUser.user.id,
      email,
      full_name,
      must_change_password: true, // Force password change on first login
    });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return errorResponse(profileError, 'Failed to create user profile');
    }

    // Create account membership (permissions column not yet added to database)
    const membershipData: any = {
      account_id: context.accountId,
      user_id: authUser.user.id,
      role,
      is_active: true,
    };

    // TODO: Store permissions once database column is added
    // if (role === 'ADMIN' && permissions && Array.isArray(permissions)) {
    //   membershipData.permissions = permissions;
    // }

    const { error: membershipError } = await supabase
      .from('account_memberships')
      .insert(membershipData);

    if (membershipError) {
      console.error('Error creating account membership:', membershipError);
      // Clean up on failure
      await supabase.from('users').delete().eq('id', authUser.user.id);
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return errorResponse(
        membershipError,
        'Failed to create account membership'
      );
    }

    // Log the action
    await logAuditEvent({
      user_id: context.userId,
      account_id: context.accountId,
      action: 'CREATE',
      resource: 'USER',
      resource_id: authUser.user.id,
      metadata: { role, email, full_name },
    });

    // Send welcome email with temporary password
    const { sendWelcomeEmail } = await import('@/lib/email');
    const emailResult = await sendWelcomeEmail({
      to: email,
      name: full_name,
      tempPassword,
      companyName: context.account.name,
    });

    if (!emailResult.success) {
      console.warn('⚠️  Email sending failed:', emailResult.error);
    }

    return NextResponse.json(
      {
        user: {
          id: authUser.user.id,
          email,
          full_name,
          role,
        },
        message:
          'User created successfully. Temporary password sent via email.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in user creation:', error);
    return unauthorizedResponse();
  }
}

export async function GET(request: NextRequest) {
  try {
    const context = await requireAccountContext(request);

    if (!canManageAdmin(context.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // Get all users for this account with their membership info
    const { data: memberships, error } = await supabase
      .from('account_memberships')
      .select(
        `
        role,
        is_active,
        created_at,
        users (
          id,
          email,
          full_name,
          created_at,
          updated_at
        )
      `
      )
      .eq('account_id', context.accountId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching team members:', error);
      return errorResponse(error, 'Failed to fetch team members');
    }

    let teamMembers =
      memberships?.map((membership: any) => ({
        id: membership.users.id,
        email: membership.users.email,
        full_name: membership.users.full_name,
        role: membership.role,
        permissions: null, // TODO: Add permissions column to database
        is_active: membership.is_active,
        created_at: membership.created_at,
        user_created_at: membership.users.created_at,
      })) || [];

    // If the current user is not in the memberships (e.g., account owner), add them
    const currentUserIncluded = teamMembers.some(
      (member) => member.id === context.userId
    );
    if (!currentUserIncluded) {
      // Get current user info
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name, created_at, updated_at')
        .eq('id', context.userId)
        .single();

      if (!userError && currentUser) {
        teamMembers.unshift({
          id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser.full_name,
          role: context.role,
          permissions: null, // Will use default permissions based on role
          is_active: true,
          created_at: new Date().toISOString(),
          user_created_at: currentUser.created_at,
        });
      }
    }

    return NextResponse.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return unauthorizedResponse();
  }
}

function generateSecurePassword(): string {
  return randomBytes(12)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 12);
}
