import { NextRequest, NextResponse } from 'next/server';
import {
  createInvoiceFromJob,
  getInvoiceByIdWithRelations,
  getInvoicesByJobId,
} from '@/lib/db/invoices';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const body = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Check if invoice already exists for this job (unless overwrite is requested)
    if (!body.overwrite) {
      const existingInvoices = await getInvoicesByJobId(jobId);
      if (existingInvoices.length > 0) {
        return NextResponse.json(
          {
            exists: true,
            invoice_id: existingInvoices[0].id,
            message: 'An invoice already exists for this job',
          },
          { status: 200 }
        );
      }
    }

    const invoice = await createInvoiceFromJob(jobId);

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice from job:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create invoice';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
