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

/**
 * WORKFLOW AUTOMATION FUNCTIONS
 */

/**
 * Auto-create follow-up tasks after job completion
 */
export async function createPostJobWorkflow(jobId: string): Promise<void> {
  try {
    // Get job details
    const { data: job } = await supabase
      .from('jobs')
      .select('*, client:clients(*)')
      .eq('id', jobId)
      .single();

    if (!job) return;

    const clientId = job.client_id;
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 30); // 30 days follow-up

    // 1. Schedule follow-up call
    await createActivity({
      client_id: clientId,
      activity_type: 'task',
      title: 'Schedule follow-up call',
      description: `Follow up with ${job.client.first_name} ${job.client.last_name} after ${job.title} completion`,
      due_date: followUpDate.toISOString(),
      metadata: {
        task_type: 'follow_up_call',
        job_id: jobId,
        priority: 'medium',
      },
    });

    // 2. Send satisfaction survey (if email exists)
    if (job.client.email) {
      await createActivity({
        client_id: clientId,
        activity_type: 'task',
        title: 'Send satisfaction survey',
        description: `Send customer satisfaction survey to ${job.client.email}`,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        metadata: {
          task_type: 'survey',
          job_id: jobId,
          email: job.client.email,
          priority: 'low',
        },
      });
    }

    // 3. Check for maintenance scheduling
    const serviceType = job.title.toLowerCase();
    if (serviceType.includes('lawn') || serviceType.includes('maintenance')) {
      const maintenanceDate = new Date();
      maintenanceDate.setMonth(maintenanceDate.getMonth() + 3); // 3 months

      await createActivity({
        client_id: clientId,
        activity_type: 'task',
        title: 'Schedule maintenance service',
        description: `Schedule next maintenance service for ${job.client.first_name} ${job.client.last_name}`,
        due_date: maintenanceDate.toISOString(),
        metadata: {
          task_type: 'maintenance',
          job_id: jobId,
          service_type: serviceType,
          priority: 'low',
        },
      });
    }
  } catch (error) {
    console.error('Failed to create post-job workflow:', error);
  }
}

/**
 * Auto-create tasks after estimate is sent
 */
export async function createPostEstimateWorkflow(
  estimateId: string
): Promise<void> {
  try {
    const { data: estimate } = await supabase
      .from('estimates')
      .select('*, client:clients(*)')
      .eq('id', estimateId)
      .single();

    if (!estimate) return;

    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 7); // 7 days follow-up

    await createActivity({
      client_id: estimate.client_id,
      activity_type: 'task',
      title: 'Follow up on estimate',
      description: `Follow up with ${estimate.client.first_name} ${estimate.client.last_name} regarding estimate ${estimate.estimate_number}`,
      due_date: followUpDate.toISOString(),
      metadata: {
        task_type: 'estimate_followup',
        estimate_id: estimateId,
        priority: 'high',
      },
    });
  } catch (error) {
    console.error('Failed to create post-estimate workflow:', error);
  }
}

/**
 * Get smart notifications for the dashboard
 */
export async function getSmartNotifications(): Promise<
  Array<{
    type: 'urgent' | 'warning' | 'info' | 'success';
    message: string;
    action?: string;
    link?: string;
  }>
> {
  const notifications = [];

  try {
    // Overdue invoices
    const { data: overdueJobs } = await supabase
      .from('jobs')
      .select('*, client:clients(*)')
      .eq('status', 'completed')
      .gt('total', 0);

    if (overdueJobs) {
      const overduePayments = overdueJobs.filter((job) => {
        // Simple check - in real app, check actual payment status
        return job.total > 0; // Placeholder logic
      });

      if (overduePayments.length > 0) {
        const totalOverdue = overduePayments.reduce(
          (sum, job) => sum + job.total,
          0
        );
        notifications.push({
          type: 'urgent',
          message: `${overduePayments.length} invoices overdue totaling $${totalOverdue.toFixed(2)}`,
          action: 'View Invoices',
          link: '/invoices',
        });
      }
    }

    // Upcoming jobs this week
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const { data: upcomingJobs } = await supabase
      .from('jobs')
      .select('*, client:clients(*)')
      .eq('status', 'scheduled')
      .lte('scheduled_date', weekFromNow.toISOString())
      .gte('scheduled_date', new Date().toISOString());

    if (upcomingJobs && upcomingJobs.length > 0) {
      notifications.push({
        type: 'info',
        message: `${upcomingJobs.length} jobs scheduled this week`,
        action: 'View Schedule',
        link: '/calendar',
      });
    }

    // Pending estimates needing follow-up
    const { data: pendingEstimates } = await supabase
      .from('estimates')
      .select('*, client:clients(*)')
      .eq('status', 'sent')
      .lt(
        'sent_date',
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      ); // Older than 7 days

    if (pendingEstimates && pendingEstimates.length > 0) {
      notifications.push({
        type: 'warning',
        message: `${pendingEstimates.length} estimates need follow-up`,
        action: 'View Estimates',
        link: '/estimates',
      });
    }

    // Clients needing attention (no activity in 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: inactiveClients } = await supabase
      .from('clients')
      .select(
        `
        *,
        activities:client_activities(
          created_at
        )
      `
      )
      .limit(1);

    // This is a simplified check - in real app, we'd need more complex logic
    if (inactiveClients && inactiveClients.length > 5) {
      notifications.push({
        type: 'info',
        message: 'Consider reaching out to inactive clients',
        action: 'View Clients',
        link: '/clients',
      });
    }
  } catch (error) {
    console.error('Failed to get smart notifications:', error);
  }

  return notifications;
}

/**
 * Get pending tasks that need attention
 */
export async function getPendingTasks(): Promise<
  Array<{
    id: string;
    title: string;
    description: string;
    due_date: string;
    priority: 'low' | 'medium' | 'high';
    client_id: string;
    client_name: string;
  }>
> {
  try {
    const { data: tasks } = await supabase
      .from('client_activities')
      .select(
        `
        *,
        client:clients(first_name, last_name)
      `
      )
      .eq('activity_type', 'task')
      .is('completed_at', null)
      .order('due_date', { ascending: true });

    return (
      tasks?.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        due_date: task.due_date || '',
        priority: task.metadata?.priority || 'medium',
        client_id: task.client_id,
        client_name: `${task.client.first_name} ${task.client.last_name}`,
      })) || []
    );
  } catch (error) {
    console.error('Failed to get pending tasks:', error);
    return [];
  }
}
