import { NextRequest, NextResponse } from 'next/server';
import { addPayment } from '@/lib/db/invoices';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params;
    const body = await request.json();

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    if (!body.amount || !body.method) {
      return NextResponse.json(
        { error: 'Amount and payment method are required' },
        { status: 400 }
      );
    }

    const updatedInvoice = await addPayment(invoiceId, {
      amount: parseFloat(body.amount),
      method: body.method,
      reference: body.reference,
      notes: body.notes,
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Error recording payment:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to record payment';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
