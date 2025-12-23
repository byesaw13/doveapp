import { Resend } from 'resend';

const getResend = () =>
  new Resend(process.env.RESEND_API_KEY || 'dummy-key-for-build');
const resend = getResend();

export interface WelcomeEmailParams {
  to: string;
  name: string;
  tempPassword: string;
  companyName: string;
}

export interface ChangeRequestEmailParams {
  to: string;
  customerName: string;
  estimateNumber: string;
  requestedChanges: string;
  estimateUrl: string;
}

export interface InvoiceEmailParams {
  to: string;
  cc?: string[];
  subject: string;
  message: string;
  invoiceNumber: string;
  amountDue: number;
  dueDate?: string;
  customerName: string;
  pdfBuffer?: Buffer;
  invoiceUrl: string;
}

export interface SmsParams {
  to: string;
  message: string;
}

export interface CustomerInvitationEmailParams {
  to: string;
  customerName: string;
  invitationLink: string;
}

/**
 * Send welcome email to new team member with temporary password
 */
export async function sendWelcomeEmail({
  to,
  name,
  tempPassword,
  companyName,
}: WelcomeEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️  RESEND_API_KEY not configured. Email not sent.');
    console.log(`📧 Would have sent email to: ${to}`);
    console.log(`🔑 Temporary password: ${tempPassword}`);
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject: `Welcome to ${companyName} - Your Account is Ready`,
      html: getWelcomeEmailHTML({ name, tempPassword, companyName }),
    });

    if (error) {
      console.error('❌ Error sending welcome email:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Welcome email sent to:', to);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Unexpected error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate HTML for welcome email
 */
function getWelcomeEmailHTML({
  name,
  tempPassword,
  companyName,
}: Omit<WelcomeEmailParams, 'to'>) {
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${companyName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">Welcome to ${companyName}! 🎉</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Your account has been created! You can now access the field service management system.
    </p>

    <div style="background: #f5f5f5; padding: 20px; border-radius: 6px; margin: 25px 0;">
      <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #0066cc;">Your Login Credentials</h2>
      <p style="margin: 5px 0;"><strong>Login URL:</strong> <a href="${loginUrl}/auth/login" style="color: #0066cc;">${loginUrl}/auth/login</a></p>
      <p style="margin: 5px 0;"><strong>Email:</strong> ${name.split(' ')[0].toLowerCase()}@example.com</p>
      <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #fff; padding: 5px 10px; border-radius: 4px; font-family: monospace; font-size: 16px;">${tempPassword}</code></p>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0;">
      <p style="margin: 0; color: #856404;">
        <strong>⚠️ Important:</strong> Please change your password after your first login for security.
      </p>
    </div>

    <a href="${loginUrl}/auth/login" style="display: inline-block; background: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px;">
      Login to Your Account
    </a>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
      If you have any questions or need assistance, please contact your administrator.
    </p>

    <p style="font-size: 14px; color: #666; margin: 0;">
      Best regards,<br>
      <strong>${companyName} Team</strong>
    </p>
  </div>

  <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
    <p style="margin: 0;">This is an automated message. Please do not reply to this email.</p>
  </div>

</body>
</html>
  `.trim();
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(to: string, resetLink: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️  RESEND_API_KEY not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    if (error) {
      console.error('❌ Error sending password reset email:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Password reset email sent to:', to);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Unexpected error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send change request notification email to business
 */
export async function sendChangeRequestEmail({
  to,
  customerName,
  estimateNumber,
  requestedChanges,
  estimateUrl,
}: ChangeRequestEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️  RESEND_API_KEY not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject: `Change Request for Estimate ${estimateNumber}`,
      html: getChangeRequestEmailHTML({
        customerName,
        estimateNumber,
        requestedChanges,
        estimateUrl,
      }),
    });

    if (error) {
      console.error('❌ Error sending change request email:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Change request email sent to:', to);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Unexpected error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send customer portal invitation email
 */
export async function sendCustomerInvitationEmail({
  to,
  customerName,
  invitationLink,
}: CustomerInvitationEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️  RESEND_API_KEY not configured. Email not sent.');
    console.log(`📧 Would have sent invitation to: ${to}`);
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject: 'Welcome to Your Customer Portal',
      html: getCustomerInvitationEmailHTML({ customerName, invitationLink }),
    });

    if (error) {
      console.error('❌ Error sending customer invitation email:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Customer invitation email sent to:', to);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Unexpected error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate HTML for customer invitation email
 */
function getCustomerInvitationEmailHTML({
  customerName,
  invitationLink,
}: Omit<CustomerInvitationEmailParams, 'to'>) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Your Customer Portal</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">Welcome to Your Customer Portal! 🎉</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${customerName},</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      You've been invited to access your customer portal where you can view your service history,
      estimates, invoices, and communicate with our team.
    </p>

    <div style="background: #f5f5f5; padding: 20px; border-radius: 6px; margin: 25px 0;">
      <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #667eea;">Get Started</h2>
      <p style="margin: 5px 0;">Click the button below to set up your account and access your portal.</p>
    </div>

    <a href="${invitationLink}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px;">
      Accept Invitation & Set Up Account
    </a>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0;">
      <p style="margin: 0; color: #856404;">
        <strong>⚠️ Important:</strong> This invitation link will expire in 7 days for security reasons.
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
      If you have any questions or need assistance, please don't hesitate to contact us.
    </p>

    <p style="font-size: 14px; color: #666; margin: 0;">
      Best regards,<br>
      <strong>Your Service Team</strong>
    </p>
  </div>

  <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
    <p style="margin: 0;">This is an automated message. Please do not reply to this email.</p>
  </div>

</body>
</html>
  `.trim();
}

/**
 * Send invoice email with PDF attachment
 */
export async function sendInvoiceEmail({
  to,
  cc,
  subject,
  message,
  invoiceNumber,
  amountDue,
  dueDate,
  customerName,
  pdfBuffer,
  invoiceUrl,
}: InvoiceEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️  RESEND_API_KEY not configured. Email not sent.');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const attachments = pdfBuffer
      ? [
          {
            filename: `invoice-${invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ]
      : [];

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'invoices@yourcompany.com',
      to: [to],
      cc: cc,
      subject,
      html: getInvoiceEmailHTML({
        customerName,
        invoiceNumber,
        amountDue,
        dueDate,
        message,
        invoiceUrl,
      }),
      attachments,
    });

    if (error) {
      console.error('❌ Error sending invoice email:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Invoice email sent to:', to);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Unexpected error sending invoice email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate HTML for invoice email
 */
function getInvoiceEmailHTML({
  customerName,
  invoiceNumber,
  amountDue,
  dueDate,
  message,
  invoiceUrl,
}: {
  customerName: string;
  invoiceNumber: string;
  amountDue: number;
  dueDate?: string;
  message: string;
  invoiceUrl: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">Invoice ${invoiceNumber}</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px;">Amount Due: $${amountDue.toFixed(2)}</p>
  </div>

  <div style="background: white; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; padding: 30px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Dear ${customerName},
    </p>

    <div style="white-space: pre-wrap; margin-bottom: 20px;">
      ${message}
    </div>

    <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #059669;">Invoice Summary</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 5px 0; border-bottom: 1px solid #dee2e6;">Invoice Number:</td>
          <td style="padding: 5px 0; border-bottom: 1px solid #dee2e6; text-align: right; font-weight: bold;">${invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; border-bottom: 1px solid #dee2e6;">Amount Due:</td>
          <td style="padding: 5px 0; border-bottom: 1px solid #dee2e6; text-align: right; font-weight: bold; color: #059669;">$${amountDue.toFixed(2)}</td>
        </tr>
        ${
          dueDate
            ? `
        <tr>
          <td style="padding: 5px 0;">Due Date:</td>
          <td style="padding: 5px 0; text-align: right; font-weight: bold;">${new Date(dueDate).toLocaleDateString()}</td>
        </tr>
        `
            : ''
        }
      </table>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${invoiceUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        View Full Invoice
      </a>
    </div>

    <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #856404;">
        <strong>Payment Instructions:</strong> Please remit payment within 30 days. If you have any questions about this invoice, contact us immediately.
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <p style="font-size: 14px; color: #666; margin: 0;">
      Thank you for your business!
    </p>
  </div>

  <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
    <p style="margin: 0;">This is an automated invoice from your service provider.</p>
  </div>

</body>
</html>
  `.trim();
}

/**
 * Send SMS message (placeholder for Twilio integration)
 */
export async function sendSms({ to, message }: SmsParams) {
  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_PHONE_NUMBER
  ) {
    console.warn('⚠️  Twilio not configured. SMS not sent.');
    console.log(`📱 Would send SMS to ${to}: ${message}`);
    return {
      success: true,
      simulated: true,
      message: 'SMS simulated (Twilio not configured)',
    };
  }

  try {
    // TODO: Implement actual Twilio integration
    // const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // const result = await twilio.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: to
    // });

    console.log(`📱 SMS sent to ${to}: ${message}`);
    return { success: true, message: 'SMS sent successfully' };
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate HTML for change request email
 */
function getChangeRequestEmailHTML({
  customerName,
  estimateNumber,
  requestedChanges,
  estimateUrl,
}: Omit<ChangeRequestEmailParams, 'to'>) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Change Request for Estimate ${estimateNumber}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">Estimate Change Request 📝</h1>
  </div>

  <div style="background: white; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; padding: 30px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${customerName}</strong> has requested changes to estimate <strong>${estimateNumber}</strong>.
    </p>

    <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #d97706;">Requested Changes:</h3>
      <p style="margin: 0; white-space: pre-wrap;">${requestedChanges}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${estimateUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        View Estimate & Respond
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <p style="font-size: 14px; color: #666; margin: 0;">
      Please review the requested changes and respond to the customer as soon as possible.
    </p>
  </div>

  <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
    <p style="margin: 0;">This is an automated notification from your estimate system.</p>
  </div>

</body>
</html>
  `.trim();
}
