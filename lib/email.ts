import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface WelcomeEmailParams {
  to: string;
  name: string;
  tempPassword: string;
  companyName: string;
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
