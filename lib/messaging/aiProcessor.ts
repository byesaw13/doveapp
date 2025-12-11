// Lightweight AI pipeline that enriches a saved message.
// Fetches context, calls OpenAI, and writes the AI fields back.
//
// NOTE: The conversations API (/api/inbox/conversations) only hides messages
// explicitly classified as 'spam_or_ads' by default. All other categories
// (including 'other', 'internal_or_personal', etc.) are shown to avoid
// missing legitimate business messages.
import { OpenAI } from 'openai';
import { supabase } from '@/lib/supabase';
import type {
  ConversationRecord,
  CustomerRecord,
  MessageRecord,
} from './types';

// Run the AI workflow for a single message.
export async function runAiForMessage(messageId: string): Promise<void> {
  // Make sure the API key exists before calling the model.
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key missing, skipping AI processing');
    return;
  }

  // Pull together the message, customer, and conversation context.
  const context = await fetchMessageContext(messageId);

  // Build a single prompt with the details the model needs.
  const prompt = buildPrompt(context.message, context.customer);

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Ask the model for structured JSON so we can store the results directly.
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No content returned from OpenAI');
  }

  let aiData: {
    summary?: string;
    category?: string;
    urgency?: string;
    lead_score?: string;
    next_action?: string;
    extracted?: Record<string, unknown>;
  };

  try {
    aiData = JSON.parse(content);
  } catch (parseError) {
    console.error('Failed to parse AI response', parseError, content);
    throw new Error('AI response parsing failed');
  }

  // Write AI fields onto the message row.
  // Ensure ai_category is never null - default to "other" if not provided
  const category = aiData.category || 'other';

  const { error: messageUpdateError } = await supabase
    .from('messages')
    .update({
      ai_summary: aiData.summary || null,
      ai_category: category,
      ai_urgency: aiData.urgency || null,
      ai_next_action: aiData.next_action || null,
      ai_extracted: aiData.extracted || {},
    })
    .eq('id', messageId);

  if (messageUpdateError) {
    console.error('Failed to update AI fields on message', messageUpdateError);
    throw new Error('Unable to save AI data to message');
  }

  // Update the conversation lead score if the model provided one.
  if (aiData.lead_score) {
    const { error: conversationUpdateError } = await supabase
      .from('conversations')
      .update({
        lead_score: aiData.lead_score,
        updated_at: new Date().toISOString(),
      })
      .eq('id', context.conversation.id);

    if (conversationUpdateError) {
      console.error(
        'Failed to update conversation lead score',
        conversationUpdateError
      );
      throw new Error('Unable to update conversation with AI score');
    }
  }
}

// Convenience wrapper so callers can fire-and-forget.
export async function triggerAiProcessing(messageId: string): Promise<void> {
  try {
    await runAiForMessage(messageId);
  } catch (error) {
    console.error('AI processing error', error);
  }
}

// Grab the database rows needed for the prompt.
async function fetchMessageContext(messageId: string): Promise<{
  message: MessageRecord;
  customer: CustomerRecord;
  conversation: ConversationRecord;
}> {
  const { data: message, error: messageError } = await supabase
    .from('messages')
    .select('*')
    .eq('id', messageId)
    .single();

  if (messageError || !message) {
    console.error('Message lookup failed', messageError);
    throw new Error('Unable to load message for AI');
  }

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', message.customer_id)
    .single();

  if (customerError || !customer) {
    console.error('Customer lookup failed', customerError);
    throw new Error('Unable to load customer for AI');
  }

  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', message.conversation_id)
    .single();

  if (conversationError || !conversation) {
    console.error('Conversation lookup failed', conversationError);
    throw new Error('Unable to load conversation for AI');
  }

  return { message, customer, conversation };
}

// Build the structured prompt string for OpenAI.
function buildPrompt(message: MessageRecord, customer: CustomerRecord): string {
  return `
You are the messaging assistant for a small handyman/painting/home services company in Southern NH called Dovetails Services LLC.

Incoming message:
"${message.message_text || ''}"

Customer info:
- Name: ${customer.full_name || 'Unknown'}
- Email: ${customer.email || 'Unknown'}
- Phone: ${customer.phone || 'Unknown'}
- Address: ${customer.address || 'Unknown'}

IMPORTANT CLASSIFICATION RULES:
- Dovetails is a small local business - classify newsletters, ads, cold sales pitches, SaaS tool promotions, and generic marketing as "spam_or_ads".
- Only real business messages belong in the main inbox: leads, customer questions, job updates, scheduling, billing.
- Personal/family/internal messages are "internal_or_personal".
- If unsure, use "other".

Return JSON with:
- summary: short summary of what the client wants
- category: one of ["lead","customer_question","job_update","billing_or_payment","scheduling","internal_or_personal","spam_or_ads","other"]
- urgency: one of ["low","normal","high"]
- lead_score: one of ["A","B","C"]
- next_action: short suggestion of what Nick should do next
- extracted: object with {address, rooms, deadline, budget_hint}
`;
}
