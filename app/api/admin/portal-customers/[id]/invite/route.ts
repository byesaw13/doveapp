import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, getCurrentUser } from '@/lib/supabase-auth';
import { supabase } from '@/lib/supabase';
import { sendCustomerInvitationEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseAuth = await createAuthClient();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's account
    const { data: membership } = await supabase
      .from('account_memberships')
      .select('account_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id: customerId } = await params;

    // Get customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('account_id', membership.account_id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Update invited_at timestamp
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        invited_at: new Date().toISOString(),
        status: 'invited',
      })
      .eq('id', customerId);

    if (updateError) {
      console.error('Error updating customer:', updateError);
      return NextResponse.json(
        { error: 'Failed to update customer' },
        { status: 500 }
      );
    }

    // Send invitation email
    try {
      await sendCustomerInvitationEmail({
        to: customer.email,
        customerName: `${customer.first_name} ${customer.last_name}`,
        invitationLink: `${process.env.NEXT_PUBLIC_APP_URL}/portal/invite?token=${customer.id}`,
      });
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send invitation email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      'Error in POST /api/admin/portal-customers/[id]/invite:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
