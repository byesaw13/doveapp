import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { sendChangeRequestEmail } from '@/lib/email';

interface EmergencyRequestData {
  location: string;
  description: string;
  urgency: string;
  contactPhone: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body: EmergencyRequestData = await request.json();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate input
    if (
      !body.location?.trim() ||
      !body.description?.trim() ||
      !body.contactPhone?.trim()
    ) {
      return NextResponse.json(
        { error: 'Location, description, and contact phone are required' },
        { status: 400 }
      );
    }

    // Get user profile information
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.warn('Could not fetch user profile for emergency request');
    }

    // Get business email from environment or settings
    const businessEmail = process.env.BUSINESS_EMAIL || 'admin@example.com';

    // Determine priority based on urgency
    const priorityMap = {
      high: 'high',
      urgent: 'urgent',
      critical: 'urgent',
    };

    // Create emergency request record
    try {
      await supabase.from('contact_requests').insert({
        user_id: user.id,
        category: 'emergency',
        subject: `EMERGENCY: ${body.location}`,
        message: `
Urgency: ${body.urgency.toUpperCase()}
Location: ${body.location}
Contact Phone: ${body.contactPhone}
Description: ${body.description}

Customer: ${profile?.full_name || 'Unknown'} (${profile?.email || user.email})
        `.trim(),
        status: 'pending',
        priority:
          priorityMap[body.urgency as keyof typeof priorityMap] || 'urgent',
      });
    } catch (dbError) {
      console.error('Failed to save emergency request to database:', dbError);
      // Continue with email even if DB save fails
    }

    // Send urgent email notification
    try {
      await sendChangeRequestEmail({
        to: businessEmail,
        customerName: profile?.full_name || 'Customer',
        estimateNumber: `EMERGENCY-${Date.now()}`,
        requestedChanges: `
🚨 EMERGENCY SERVICE REQUEST 🚨

Urgency Level: ${body.urgency.toUpperCase()}
Location: ${body.location}
Contact Phone: ${body.contactPhone}
Description: ${body.description}

Customer: ${profile?.full_name || 'Unknown'} (${profile?.email || user.email})

This is an EMERGENCY - please respond immediately!
        `.trim(),
        estimateUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/dashboard`,
      });
    } catch (emailError) {
      console.error('Failed to send emergency email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send emergency request. Please call us directly.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        'Emergency request submitted successfully. Our team will contact you shortly.',
    });
  } catch (error) {
    console.error('Error in emergency request submission:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please call us directly.' },
      { status: 500 }
    );
  }
}
