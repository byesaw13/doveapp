// Core saver that takes a normalized message and persists it.
// The function wires up customers, conversations, and messages
// so every channel ends up in the same inbox.
import { supabase } from '@/lib/supabase';
import type {
  ConversationRecord,
  CustomerRecord,
  NormalizedMessage,
} from './types';
import { triggerAiProcessing } from './aiProcessor';

// Save a normalized message and return the linked records.
export async function saveNormalizedMessage(
  msg: NormalizedMessage
): Promise<{
  customer: CustomerRecord;
  conversation: ConversationRecord;
  messageId: string;
}> {
  // Make sure we always have a timestamp for ordering.
  const receivedAt = msg.receivedAt || new Date().toISOString();

  // 1) Look up or create the customer from the message metadata.
  const customer = await upsertCustomerFromMessage(msg);

  // 2) Find an open conversation or start a new one.
  const conversation = await findOrCreateConversation(customer.id, msg);

  // 3) Insert the message row with the raw payload for debugging.
  const { data: messageInsert, error: messageError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      customer_id: customer.id,
      channel: msg.channel,
      direction: msg.direction,
      external_id: msg.externalId || null,
      raw_payload: msg.rawPayload,
      message_text: msg.messageText,
      attachments: msg.attachments,
      created_at: receivedAt,
    })
    .select('id, created_at')
    .single();

  if (messageError || !messageInsert) {
    console.error('Failed to insert message', messageError);
    throw new Error('Unable to save message');
  }

  // 4) Keep the conversation fresh for the inbox list.
  const { error: conversationUpdateError } = await supabase
    .from('conversations')
    .update({
      last_message_at: messageInsert.created_at,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversation.id);

  if (conversationUpdateError) {
    console.error('Failed to update conversation timestamps', conversationUpdateError);
    throw new Error('Unable to update conversation after message save');
  }

  // 5) Fire AI processing without blocking the webhook response.
  try {
    await triggerAiProcessing(messageInsert.id);
  } catch (aiError) {
    console.error('AI processing failed', aiError);
  }

  return { customer, conversation, messageId: messageInsert.id };
}

// Find an existing customer by phone/email or create a new one.
async function upsertCustomerFromMessage(
  msg: NormalizedMessage
): Promise<CustomerRecord> {
  const phone = msg.customer.phone?.trim() || null;
  const email = msg.customer.email?.trim() || null;

  // Attempt lookup by phone first for SMS/WhatsApp.
  const existingByPhone = phone
    ? await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .limit(1)
        .maybeSingle()
    : null;

  if (existingByPhone?.error) {
    console.error('Customer lookup by phone failed', existingByPhone.error);
    throw new Error('Unable to lookup customer by phone');
  }

  if (existingByPhone?.data) {
    return await updateCustomer(existingByPhone.data, msg);
  }

  // Fallback lookup by email if no phone match.
  const existingByEmail = email
    ? await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .limit(1)
        .maybeSingle()
    : null;

  if (existingByEmail?.error) {
    console.error('Customer lookup by email failed', existingByEmail.error);
    throw new Error('Unable to lookup customer by email');
  }

  if (existingByEmail?.data) {
    return await updateCustomer(existingByEmail.data, msg);
  }

  // No match found, create a fresh customer record.
  const { data: insertedCustomer, error: insertError } = await supabase
    .from('customers')
    .insert({
      full_name: msg.customer.fullName || null,
      email,
      phone,
      address: msg.customer.address || null,
      source: msg.channel,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (insertError || !insertedCustomer) {
    console.error('Customer insert failed', insertError);
    throw new Error('Unable to create customer from message');
  }

  return insertedCustomer;
}

// Update an existing customer with any new details we learned.
async function updateCustomer(
  existing: CustomerRecord,
  msg: NormalizedMessage
): Promise<CustomerRecord> {
  const { data: updatedCustomer, error: updateError } = await supabase
    .from('customers')
    .update({
      full_name: msg.customer.fullName || existing.full_name,
      email: msg.customer.email || existing.email,
      phone: msg.customer.phone || existing.phone,
      address: msg.customer.address || existing.address,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id)
    .select('*')
    .single();

  if (updateError || !updatedCustomer) {
    console.error('Customer update failed', updateError);
    throw new Error('Unable to update customer details');
  }

  return updatedCustomer;
}

// Reuse the newest open conversation or create one.
async function findOrCreateConversation(
  customerId: string,
  msg: NormalizedMessage
): Promise<ConversationRecord> {
  const { data: conversations, error: conversationError } = await supabase
    .from('conversations')
    .select('*')
    .eq('customer_id', customerId)
    .eq('status', 'open')
    .order('last_message_at', { ascending: false })
    .limit(1);

  if (conversationError) {
    console.error('Conversation lookup failed', conversationError);
    throw new Error('Unable to find conversation');
  }

  if (conversations && conversations.length > 0) {
    return conversations[0];
  }

  const { data: insertedConversation, error: insertError } = await supabase
    .from('conversations')
    .insert({
      customer_id: customerId,
      title: msg.customer.fullName || 'New conversation',
      primary_channel: msg.channel,
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (insertError || !insertedConversation) {
    console.error('Conversation insert failed', insertError);
    throw new Error('Unable to create conversation');
  }

  return insertedConversation;
}
