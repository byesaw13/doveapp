import { NextRequest, NextResponse } from 'next/server';
import { getEstimate } from '@/lib/db/estimates';
import { generateEstimatePdf } from '@/lib/pdf-estimate';
import { createActivity } from '@/lib/db/activities';

interface SendEstimateRequest {
  via: 'email' | 'sms' | 'both';
  message?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: estimateId } = await params;
    const body: SendEstimateRequest = await request.json();

    if (!estimateId) {
      return NextResponse.json(
        { error: 'Estimate ID is required' },
        { status: 400 }
      );
    }

    // Load estimate
    const estimate = await getEstimate(estimateId);
    if (!estimate) {
      return NextResponse.json(
        { error: 'Estimate not found' },
        { status: 404 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateEstimatePdf({ estimateId });

    // Get client contact info
    const clientEmail = estimate.client?.email;
    const clientPhone = estimate.client?.phone;

    if (body.via === 'email' || body.via === 'both') {
      if (!clientEmail) {
        return NextResponse.json(
          { error: 'Client email is required for email sending' },
          { status: 400 }
        );
      }

      // Send email with PDF attachment
      await sendEmail({
        to: clientEmail,
        subject: `Your Estimate from Dovetails Services - ${estimate.estimate_number}`,
        body: generateEmailBody(estimate, body.message),
        attachment: {
          filename: `estimate-${estimate.estimate_number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      });
    }

    if (body.via === 'sms' || body.via === 'both') {
      if (!clientPhone) {
        return NextResponse.json(
          { error: 'Client phone is required for SMS sending' },
          { status: 400 }
        );
      }

      // Send SMS with link
      await sendSms({
        to: clientPhone,
        message: generateSmsMessage(estimate),
      });
    }

    // Log the sending activity
    await logEstimateActivity(
      estimateId,
      'estimate_sent',
      `Estimate sent via ${body.via}`,
      body.message || `Estimate sent to client via ${body.via}`,
      { via: body.via, message: body.message }
    );

    // Update estimate status to 'sent'
    await updateEstimateStatus(estimateId, 'sent');

    return NextResponse.json({
      success: true,
      message: 'Estimate sent successfully',
    });
  } catch (error) {
    console.error('Error sending estimate:', error);
    return NextResponse.json(
      { error: 'Failed to send estimate' },
      { status: 500 }
    );
  }
}

// Helper functions (placeholders - implement based on your email/SMS services)
async function sendEmail(options: {
  to: string;
  subject: string;
  body: string;
  attachment?: {
    filename: string;
    content: Buffer;
    contentType: string;
  };
}) {
  // TODO: Implement email sending (e.g., using Resend, SendGrid, etc.)
  // For now, just log - replace with actual email service
}

async function sendSms(options: { to: string; message: string }) {
  // TODO: Implement SMS sending (e.g., using Twilio, etc.)
  // For now, just log - replace with actual SMS service
}

function generateEmailBody(estimate: any, customMessage?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const approvalUrl = `${baseUrl}/estimates/${estimate.id}/client-view`;

  let body = '';

  if (customMessage) {
    body += `${customMessage}\n\n`;
  }

  body += `Dear ${estimate.client?.first_name || 'Valued Customer'},

Thank you for choosing Dovetails Services. Please find attached your estimate #${estimate.estimate_number} for "${estimate.title}".

Estimate Details:
- Total: $${estimate.total.toFixed(2)}
- Valid Until: ${new Date(estimate.valid_until).toLocaleDateString()}

To approve, decline, or request changes to this estimate, please visit:
${approvalUrl}

If you have any questions, please don't hesitate to contact us.

Best regards,
Dovetails Services Team`;

  return body;
}

function generateSmsMessage(estimate: any): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const approvalUrl = `${baseUrl}/estimates/${estimate.id}/client-view`;

  return `Your estimate #${estimate.estimate_number} for $${estimate.total.toFixed(2)} is ready. View & approve: ${approvalUrl}`;
}

async function logEstimateActivity(
  estimateId: string,
  activityType: string,
  title: string,
  description?: string,
  metadata?: any
) {
  try {
    const estimate = await getEstimate(estimateId);
    if (!estimate) return;

    await createActivity({
      client_id: estimate.client_id!,
      activity_type: activityType as any,
      title,
      description,
      metadata,
      related_id: estimateId,
      related_type: 'estimate',
    });
  } catch (error) {
    console.error('Failed to log estimate activity:', error);
  }
}

async function updateEstimateStatus(estimateId: string, status: string) {
  // TODO: Update estimate status in database
}
