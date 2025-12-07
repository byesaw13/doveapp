import { NextRequest, NextResponse } from 'next/server';
import { processEmailWithAI } from '@/lib/db/email';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface WebhookPayload {
  gmailId: string;
  gmailThreadId: string;
  from: string;
  subject: string;
  receivedAt: string;
  snippet: string;
  summary: string;
  category: string;
  priority: string;
  actionRequired: boolean;
  actionType: string;
  actionItems: string[];
  extractedData: any;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify webhook secret
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.WEBHOOK_SECRET;

    if (!authHeader || !expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    if (token !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload: WebhookPayload = await request.json();

    console.log('📧 Email webhook received:', {
      gmailId: payload.gmailId,
      category: payload.category,
      from: payload.from,
    });

    // Store email in database
    const { data: emailAccount } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!emailAccount) {
      console.warn('No active email account found');
      return NextResponse.json(
        { error: 'No email account configured' },
        { status: 400 }
      );
    }

    // Create email message record
    const { data: emailMessage, error: emailError } = await supabase
      .from('email_messages')
      .insert({
        email_account_id: emailAccount.id,
        gmail_message_id: payload.gmailId,
        gmail_thread_id: payload.gmailThreadId,
        sender: payload.from,
        subject: payload.subject,
        received_at: payload.receivedAt,
        body_text: payload.snippet,
        category: payload.category,
        priority: payload.priority,
        is_read: false,
        requires_reply: payload.actionRequired,
        extracted_data: payload.extractedData,
      })
      .select()
      .single();

    if (emailError) {
      console.error('Error creating email message:', emailError);
      return NextResponse.json(
        { error: 'Failed to store email' },
        { status: 500 }
      );
    }

    console.log('✅ Email stored:', emailMessage.id);

    // Auto-create lead if category is 'leads'
    if (payload.category === 'leads' && payload.extractedData?.leads) {
      await autoCreateLead(emailMessage.id, payload);
    }

    return NextResponse.json({
      success: true,
      emailId: emailMessage.id,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function autoCreateLead(
  emailId: string,
  payload: WebhookPayload
): Promise<void> {
  try {
    const leadData = payload.extractedData.leads;

    // Extract name parts
    const nameParts = (leadData.contact_name || '').split(' ');
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || 'Lead';

    // Determine priority from email priority
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    if (payload.priority === 'urgent') priority = 'urgent';
    else if (payload.priority === 'high') priority = 'high';

    // Create lead
    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: leadData.contact_email || payload.from,
        phone: leadData.contact_phone || '',
        source: 'email',
        status: 'new',
        priority,
        service_type: leadData.service_type,
        service_description:
          leadData.service_description || payload.summary || payload.snippet,
        estimated_value: leadData.estimated_value,
        notes: `Auto-created from email: ${payload.subject}\n\nAI Summary: ${payload.summary}`,
      })
      .select()
      .single();

    if (leadError) {
      console.error('Error creating lead:', leadError);
      return;
    }

    console.log('✅ Auto-created lead:', newLead.id);

    // Update email message with lead link
    await supabase
      .from('email_messages')
      .update({
        extracted_data: {
          ...payload.extractedData,
          auto_created_lead_id: newLead.id,
        },
      })
      .eq('id', emailId);

    // Create alert for new lead
    await supabase.from('alerts').insert({
      type: 'new_lead',
      severity: priority === 'urgent' ? 'high' : 'medium',
      email_id: emailId,
      title: `New Lead: ${firstName} ${lastName}`,
      message: `Email inquiry: ${payload.subject}. Service: ${leadData.service_type || 'Unknown'}`,
    });
  } catch (error) {
    console.error('Error in autoCreateLead:', error);
  }
}
