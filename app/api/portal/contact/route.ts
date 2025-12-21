import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { sendChangeRequestEmail } from '@/lib/email';

interface ContactFormData {
  category: string;
  subject: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body: ContactFormData = await request.json();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate input
    if (!body.category || !body.subject?.trim() || !body.message?.trim()) {
      return NextResponse.json(
        { error: 'Category, subject, and message are required' },
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
      console.warn('Could not fetch user profile for contact form');
    }

    // Get business email from environment or settings
    const businessEmail = process.env.BUSINESS_EMAIL || 'admin@example.com';

    // Create contact request record (optional - for tracking)
    try {
      await supabase.from('contact_requests').insert({
        user_id: user.id,
        category: body.category,
        subject: body.subject.trim(),
        message: body.message.trim(),
        status: 'pending',
      });
    } catch (dbError) {
      // Don't fail if we can't save to database
      console.warn('Failed to save contact request to database:', dbError);
    }

    // Send email notification
    try {
      await sendChangeRequestEmail({
        to: businessEmail,
        customerName: profile?.full_name || 'Customer',
        estimateNumber: `Contact-${Date.now()}`, // Use timestamp as reference
        requestedChanges: `
Category: ${body.category}
Subject: ${body.subject}
Message: ${body.message}
From: ${profile?.full_name || 'Unknown'} (${profile?.email || user.email})
        `.trim(),
        estimateUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/dashboard`, // Link to admin dashboard
      });
    } catch (emailError) {
      console.error('Failed to send contact email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send message. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully',
    });
  } catch (error) {
    console.error('Error in contact form submission:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
