import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/db/jobs';
import { generateInvoicePDF } from '@/lib/pdf-invoice';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get job details
    const job = await getJob(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Company information (you can make this configurable)
    const companyInfo = {
      name: 'Dovetails',
      address: 'Your Business Address\nCity, State ZIP',
      phone: '(555) 123-4567',
      email: 'billing@dovetails.com',
      // logo: '/path/to/logo.png' // We'll handle the logo separately
    };

    // Generate invoice number (you might want to store this in the database)
    const invoiceNumber = `INV-${job.job_number}-${Date.now().toString().slice(-4)}`;
    const invoiceDate = new Date().toLocaleDateString('en-US');

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF({
      job,
      companyInfo,
      invoiceNumber,
      invoiceDate,
    });

    // Return PDF as response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${job.job_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice PDF' },
      { status: 500 }
    );
  }
}
