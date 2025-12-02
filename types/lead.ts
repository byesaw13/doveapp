// Lead tracking types
export type LeadSource =
  | 'website'
  | 'referral'
  | 'social_media'
  | 'email'
  | 'phone'
  | 'walk_in'
  | 'advertisement'
  | 'other';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal_sent'
  | 'negotiating'
  | 'converted'
  | 'lost'
  | 'unqualified';

export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Lead {
  id: string;

  // Contact Information
  first_name: string;
  last_name: string;
  company_name?: string;
  email: string;
  phone: string;
  alternate_phone?: string;

  // Lead Details
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;

  // Service Details
  service_type?: string;
  service_description?: string;
  estimated_value?: number;

  // Location
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;

  // Tracking
  assigned_to?: string; // User/Team member ID
  follow_up_date?: string;
  last_contact_date?: string;
  converted_to_client_id?: string;
  lost_reason?: string;

  // Metadata
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: 'call' | 'email' | 'meeting' | 'note' | 'status_change';
  description: string;
  created_by?: string;
  created_at: string;
}

export interface LeadStats {
  total_leads: number;
  new_leads: number;
  qualified_leads: number;
  converted_leads: number;
  lost_leads: number;
  conversion_rate: number;
  average_time_to_conversion: number;
  total_estimated_value: number;
  by_source: Record<LeadSource, number>;
  by_status: Record<LeadStatus, number>;
  by_priority: Record<LeadPriority, number>;
}
