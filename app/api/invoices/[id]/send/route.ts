import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { sendInvoiceEmail, sendSms } from '@/lib/email';

interface SendInvoiceRequest {
  recipientEmail: string;
  ccEmails?: string;
  subject: string;
  message: string;
  sendSms?: boolean;
  smsPhone?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: invoiceId } = await params;
    const body: SendInvoiceRequest = await request.json();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate input
    if (!body.recipientEmail?.trim()) {
      return NextResponse.json(
        { error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    if (body.sendSms && !body.smsPhone?.trim()) {
      return NextResponse.json(
        { error: 'Phone number is required for SMS' },
        { status: 400 }
      );
    }

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(
        `
        *,
        customer:clients(id, first_name, last_name, email, phone)
      `
      )
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Generate PDF (we'll use the existing PDF endpoint)
    let pdfBuffer: Buffer | null = null;
    try {
      const pdfResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/invoices/${invoiceId}/pdf`,
        {
          headers: {
            // Pass authentication headers if needed
            Cookie: request.headers.get('cookie') || '',
          },
        }
      );

      if (pdfResponse.ok) {
        pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
      }
    } catch (pdfError) {
      console.warn('Failed to generate PDF:', pdfError);
      // Continue without PDF - email will still be sent
    }

    const result = {
      emailSent: false,
      smsSent: false,
    };

    // Send email with PDF attachment
    try {
      const ccEmails = body.ccEmails
        ? body.ccEmails
            .split(',')
            .map((email) => email.trim())
            .filter((email) => email)
        : undefined;

      await sendInvoiceEmail({
        to: body.recipientEmail,
        cc: ccEmails,
        subject: body.subject,
        message: body.message,
        invoiceNumber: invoice.invoice_number,
        amountDue: invoice.balance_due || 0,
        dueDate: invoice.due_date,
        customerName:
          `${invoice.customer?.first_name || ''} ${invoice.customer?.last_name || ''}`.trim() ||
          'Valued Customer',
        pdfBuffer: pdfBuffer || undefined,
        invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/portal/invoices/${invoiceId}`,
      });

      result.emailSent = true;
    } catch (emailError) {
      console.error('Failed to send invoice email:', emailError);
      // Don't fail the request if email fails
    }

    // Send SMS if requested
    if (body.sendSms && body.smsPhone) {
      try {
        const smsMessage = `Invoice ${invoice.invoice_number} for $${(invoice.balance_due || 0).toFixed(2)} is ready. View: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/portal/invoices/${invoiceId}`;

        const smsResult = await sendSms({
          to: body.smsPhone,
          message: smsMessage,
        });

        if (smsResult.success) {
          result.smsSent = true;
        } else {
          console.warn('SMS sending failed:', smsResult.error);
        }
      } catch (smsError) {
        console.error('Failed to send invoice SMS:', smsError);
        // Don't fail the request if SMS fails
      }
    }

    // Update invoice sent status and log activity
    try {
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          sent_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (updateError) {
        console.warn('Failed to update invoice sent status:', updateError);
      }

      // Log activity
      if (invoice.customer?.id) {
        await supabase.from('client_activities').insert({
          client_id: invoice.customer.id,
          activity_type: 'invoice_sent',
          title: `Invoice ${invoice.invoice_number} sent`,
          description: `Invoice sent via ${result.emailSent ? 'email' : ''}${result.emailSent && result.smsSent ? ' and ' : ''}${result.smsSent ? 'SMS' : ''}`,
          related_id: invoiceId,
          related_type: 'invoice',
          created_by: user.email,
        });
      }
    } catch (activityError) {
      console.warn('Failed to log invoice sent activity:', activityError);
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice sent successfully',
      ...result,
    });
  } catch (error) {
    console.error('Error in send invoice:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
