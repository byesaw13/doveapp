import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';
import { sendCustomerInvitationEmail } from '@/lib/email';

export async function GET() {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
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

    // Get portal customers for this account
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .eq('account_id', membership.account_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch customers' },
        { status: 500 }
      );
    }

    return NextResponse.json({ customers: customers || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/portal-customers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
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

    const body = await request.json();
    const { first_name, last_name, email, phone, address } = body;

    if (!first_name || !last_name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if customer already exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email)
      .eq('account_id', membership.account_id)
      .single();

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this email already exists' },
        { status: 409 }
      );
    }

    // Create customer
    const { data: customer, error: insertError } = await supabase
      .from('customers')
      .insert({
        account_id: membership.account_id,
        first_name,
        last_name,
        email,
        phone,
        address,
        status: 'invited',
        invited_at: new Date().toISOString(),
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating customer:', insertError);
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      );
    }

    // Send invitation email
    try {
      await sendCustomerInvitationEmail({
        to: email,
        customerName: `${first_name} ${last_name}`,
        invitationLink: `${process.env.NEXT_PUBLIC_APP_URL}/portal/invite?token=${customer.id}`,
      });
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Error in POST /api/admin/portal-customers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
