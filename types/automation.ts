import type { JsonObject } from '@/types/json';

export type AutomationType =
  | 'estimate_followup'
  | 'invoice_followup'
  | 'job_closeout'
  | 'review_request'
  | 'lead_response';

export type AutomationStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export interface AutomationRecord {
  id: string;
  type: AutomationType;
  related_id?: string | null;
  status: AutomationStatus;
  run_at: string;
  last_attempt?: string | null;
  attempts: number;
  payload?: JsonObject | null;
  result?: JsonObject | null;
  created_at: string;
}

export interface AutomationHistoryRecord {
  id: string;
  automation_id: string;
  status?: string | null;
  message?: string | null;
  created_at: string;
}

export interface AutomationSettings {
  estimate_followups: boolean;
  invoice_followups: boolean;
  job_closeout: boolean;
  review_requests: boolean;
  lead_response: boolean;
}

export const DEFAULT_AUTOMATION_SETTINGS: AutomationSettings = {
  estimate_followups: true,
  invoice_followups: true,
  job_closeout: true,
  review_requests: true,
  lead_response: true,
};
