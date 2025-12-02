import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Webhook endpoint to receive email summaries from Cloudflare Worker
 * POST /api/email-summaries/webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.EMAIL_WEBHOOK_SECRET;

    if (!expectedSecret) {
      console.error('EMAIL_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      console.error('Invalid webhook secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse payload
    const payload = await request.json();

    const {
      gmailId,
      gmailThreadId,
      from,
      subject,
      receivedAt,
      snippet,
      summary,
      category,
      priority,
      actionRequired,
      actionType,
      actionItems,
      extractedData,
    } = payload;

    // Validate required fields
    if (!gmailId || !from || !summary) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if we already have this email summary
    const { data: existing } = await supabase
      .from('email_summaries')
      .select('id')
      .eq('gmail_id', gmailId)
      .single();

    if (existing) {
      console.log(`Email summary for ${gmailId} already exists, skipping`);
      return NextResponse.json({
        success: true,
        message: 'Email summary already exists',
        id: existing.id,
      });
    }

    // Store email summary
    const { data, error } = await supabase
      .from('email_summaries')
      .insert([
        {
          gmail_id: gmailId,
          gmail_thread_id: gmailThreadId,
          from_address: from,
          subject: subject || '',
          received_at: receivedAt,
          snippet: snippet || '',
          ai_summary: summary,
          category: category,
          priority: priority,
          action_required: actionRequired || false,
          action_type: actionType || 'none',
          action_items: actionItems || [],
          extracted_data: extractedData || {},
          is_read: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error storing email summary:', error);
      return NextResponse.json(
        { error: 'Failed to store email summary' },
        { status: 500 }
      );
    }

    console.log(`✅ Stored email summary for ${gmailId}`);

    // Optionally: Create alerts for high-priority items
    if (priority === 'urgent' || priority === 'high') {
      // You can add logic here to create notifications/alerts
      console.log(`🚨 High priority email: ${subject}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Email summary stored',
      id: data.id,
    });
  } catch (error) {
    console.error('Error in webhook:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
