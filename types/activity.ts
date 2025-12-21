export type ActivityType =
  | 'note'
  | 'email_sent'
  | 'email_received'
  | 'call'
  | 'task'
  | 'meeting'
  | 'sms'
  | 'job_created'
  | 'job_started'
  | 'job_completed'
  | 'job_cancelled'
  | 'estimate_sent'
  | 'estimate_viewed'
  | 'estimate_accepted'
  | 'estimate_declined'
  | 'payment_received'
  | 'invoice_sent'
  | 'property_added'
  | 'client_created'
  | 'client_updated'
  | 'lead_converted'
  | 'document_uploaded'
  | 'photo_uploaded';

export interface ClientActivity {
  id: string;
  client_id: string;
  activity_type: ActivityType;
  title: string;
  description?: string;
  due_date?: string | null;
  completed_at?: string | null;
  metadata?: Record<string, any>;
  related_id?: string;
  related_type?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientActivityInsert {
  client_id: string;
  activity_type: ActivityType;
  title: string;
  description?: string;
  due_date?: string | null;
  completed_at?: string | null;
  metadata?: Record<string, any>;
  related_id?: string;
  related_type?: string;
  created_by?: string;
}

export interface ClientActivityWithRelated extends ClientActivity {
  related_data?: any;
}
