import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { CustomerInsert } from '@/types/customer';

// POST /api/customers - Register a new customer (public)
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient();

    const body = await request.json();

    // Basic validation
    const requiredFields = ['first_name', 'last_name', 'email', 'phone'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // For self-registration, create customers without account_id initially
    // Since schema requires account_id, use a default for leads
    // In production, might have a dedicated lead account
    const accountId = '00000000-0000-0000-0000-000000000000'; // placeholder for leads

    const customerData: CustomerInsert = {
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      phone: body.phone,
      secondary_phone: body.secondary_phone,
      address_line1: body.address_line1,
      address_line2: body.address_line2,
      city: body.city,
      state: body.state,
      zip_code: body.zip_code,
      source: 'self_registration',
      status: 'inactive',
      account_id: accountId,
    };

    const { data: customer, error } = await supabaseAdmin
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      );
    }

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Error registering customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
