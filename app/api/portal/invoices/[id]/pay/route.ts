import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerContext } from '@/lib/auth-guards-api';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

const STRIPE_API_VERSION: Stripe.StripeConfig['apiVersion'] =
  '2025-11-17.clover';
const stripe =
  process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.length > 0
    ? new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: STRIPE_API_VERSION,
      })
    : null;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!stripe) {
      console.error('Stripe not configured: missing STRIPE_SECRET_KEY');
      return NextResponse.json(
        { error: 'Payments are not configured' },
        { status: 500 }
      );
    }

    const context = await requireCustomerContext(request);
    const supabase = await createRouteHandlerClient();
    const { id: invoiceId } = await params;

    // Verify ownership
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('customer_id, status, total, invoice_number')
      .eq('id', invoiceId)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.customer_id !== context.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (invoice.status !== 'sent') {
      return NextResponse.json(
        { error: 'Invoice cannot be paid' },
        { status: 400 }
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Invoice ${invoice.invoice_number}`,
            },
            unit_amount: Math.round(invoice.total * 100), // cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/invoices/${invoiceId}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/invoices/${invoiceId}`,
      metadata: {
        invoice_id: invoiceId,
        customer_id: context.userId,
      },
    });

    // Store session ID
    await supabase
      .from('invoices')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', invoiceId);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating payment session:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
