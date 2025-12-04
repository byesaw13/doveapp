import { supabase } from '@/lib/supabase';
import type { ClientActivity, ClientActivityInsert } from '@/types/activity';

/**
 * Get all activities for a client
 */
export async function getClientActivities(
  clientId: string,
  options?: { limit?: number; activityType?: string }
): Promise<ClientActivity[]> {
  let query = supabase
    .from('client_activities')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (options?.activityType) {
    query = query.eq('activity_type', options.activityType);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Create a new activity
 */
export async function createActivity(
  activity: ClientActivityInsert
): Promise<ClientActivity> {
  const { data, error } = await supabase
    .from('client_activities')
    .insert(activity)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Log a job creation activity
 */
export async function logJobCreated(
  clientId: string,
  jobId: string,
  jobTitle: string,
  jobAmount?: number
): Promise<ClientActivity> {
  return createActivity({
    client_id: clientId,
    activity_type: 'job_created',
    title: `New job created: ${jobTitle}`,
    description: jobAmount ? `Total: $${jobAmount.toFixed(2)}` : undefined,
    related_id: jobId,
    related_type: 'job',
    metadata: { amount: jobAmount },
  });
}

/**
 * Log a job completion activity
 */
export async function logJobCompleted(
  clientId: string,
  jobId: string,
  jobTitle: string
): Promise<ClientActivity> {
  return createActivity({
    client_id: clientId,
    activity_type: 'job_completed',
    title: `Job completed: ${jobTitle}`,
    related_id: jobId,
    related_type: 'job',
  });
}

/**
 * Log a job started activity
 */
export async function logJobStarted(
  clientId: string,
  jobId: string,
  jobTitle: string
): Promise<ClientActivity> {
  return createActivity({
    client_id: clientId,
    activity_type: 'job_started',
    title: `Job started: ${jobTitle}`,
    related_id: jobId,
    related_type: 'job',
  });
}

/**
 * Log a job cancelled activity
 */
export async function logJobCancelled(
  clientId: string,
  jobId: string,
  jobTitle: string,
  reason?: string
): Promise<ClientActivity> {
  return createActivity({
    client_id: clientId,
    activity_type: 'job_cancelled',
    title: `Job cancelled: ${jobTitle}`,
    description: reason,
    related_id: jobId,
    related_type: 'job',
  });
}

/**
 * Log a property added activity
 */
export async function logPropertyAdded(
  clientId: string,
  propertyId: string,
  propertyName: string,
  city?: string,
  state?: string
): Promise<ClientActivity> {
  return createActivity({
    client_id: clientId,
    activity_type: 'property_added',
    title: `Property added: ${propertyName}`,
    description: [city, state].filter(Boolean).join(', '),
    related_id: propertyId,
    related_type: 'property',
    metadata: { city, state },
  });
}

/**
 * Log an estimate sent activity
 */
export async function logEstimateSent(
  clientId: string,
  estimateId: string,
  estimateNumber: string,
  amount: number
): Promise<ClientActivity> {
  return createActivity({
    client_id: clientId,
    activity_type: 'estimate_sent',
    title: `Estimate ${estimateNumber} sent`,
    description: `Amount: $${amount.toFixed(2)}`,
    related_id: estimateId,
    related_type: 'estimate',
    metadata: { amount, estimate_number: estimateNumber },
  });
}

/**
 * Log an estimate accepted activity
 */
export async function logEstimateAccepted(
  clientId: string,
  estimateId: string,
  estimateNumber: string,
  amount: number
): Promise<ClientActivity> {
  return createActivity({
    client_id: clientId,
    activity_type: 'estimate_accepted',
    title: `Estimate ${estimateNumber} accepted`,
    description: `Amount: $${amount.toFixed(2)}`,
    related_id: estimateId,
    related_type: 'estimate',
    metadata: { amount, estimate_number: estimateNumber },
  });
}

/**
 * Log an estimate declined activity
 */
export async function logEstimateDeclined(
  clientId: string,
  estimateId: string,
  estimateNumber: string,
  reason?: string
): Promise<ClientActivity> {
  return createActivity({
    client_id: clientId,
    activity_type: 'estimate_declined',
    title: `Estimate ${estimateNumber} declined`,
    description: reason,
    related_id: estimateId,
    related_type: 'estimate',
    metadata: { estimate_number: estimateNumber, reason },
  });
}

/**
 * Log a payment received activity
 */
export async function logPaymentReceived(
  clientId: string,
  paymentId: string,
  amount: number,
  paymentMethod?: string
): Promise<ClientActivity> {
  return createActivity({
    client_id: clientId,
    activity_type: 'payment_received',
    title: `Payment received: $${amount.toFixed(2)}`,
    description: paymentMethod ? `via ${paymentMethod}` : undefined,
    related_id: paymentId,
    related_type: 'payment',
    metadata: { amount, payment_method: paymentMethod },
  });
}

/**
 * Log a note/comment
 */
export async function logNote(
  clientId: string,
  title: string,
  description?: string,
  createdBy?: string
): Promise<ClientActivity> {
  return createActivity({
    client_id: clientId,
    activity_type: 'note',
    title,
    description,
    created_by: createdBy,
  });
}

/**
 * Log an email sent
 */
export async function logEmailSent(
  clientId: string,
  subject: string,
  body?: string,
  emailId?: string
): Promise<ClientActivity> {
  return createActivity({
    client_id: clientId,
    activity_type: 'email_sent',
    title: `Email sent: ${subject}`,
    description: body,
    related_id: emailId,
    related_type: 'email',
    metadata: { subject },
  });
}

/**
 * Log an email received
 */
export async function logEmailReceived(
  clientId: string,
  subject: string,
  body?: string,
  emailId?: string
): Promise<ClientActivity> {
  return createActivity({
    client_id: clientId,
    activity_type: 'email_received',
    title: `Email received: ${subject}`,
    description: body,
    related_id: emailId,
    related_type: 'email',
    metadata: { subject },
  });
}

/**
 * Log a phone call
 */
export async function logCall(
  clientId: string,
  callType: 'incoming' | 'outgoing',
  duration?: number,
  notes?: string,
  createdBy?: string
): Promise<ClientActivity> {
  return createActivity({
    client_id: clientId,
    activity_type: 'call',
    title: `${callType === 'incoming' ? 'Incoming' : 'Outgoing'} call`,
    description: notes,
    created_by: createdBy,
    metadata: { call_type: callType, duration },
  });
}

/**
 * Delete an activity
 */
export async function deleteActivity(id: string): Promise<void> {
  const { error } = await supabase
    .from('client_activities')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
