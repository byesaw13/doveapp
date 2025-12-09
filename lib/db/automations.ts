import { supabase } from '@/lib/supabase';
import { getOrCreateBusinessSettings } from '@/lib/db/business-settings';
import type {
  AutomationHistoryRecord,
  AutomationRecord,
  AutomationSettings,
  AutomationStatus,
  AutomationType,
} from '@/types/automation';
import { DEFAULT_AUTOMATION_SETTINGS } from '@/types/automation';

const typeSettingMap: Record<AutomationType, keyof AutomationSettings> = {
  estimate_followup: 'estimate_followups',
  invoice_followup: 'invoice_followups',
  job_closeout: 'job_closeout',
  review_request: 'review_requests',
  lead_response: 'lead_response',
};

export interface ScheduleAutomationInput {
  type: AutomationType;
  relatedId?: string | null;
  runAt: Date;
  payload?: Record<string, any> | null;
}

export interface AutomationFilterOptions {
  status?: AutomationStatus | 'all';
  limit?: number;
}

export async function getAutomationSettings(): Promise<AutomationSettings> {
  const settings = await getOrCreateBusinessSettings();
  return {
    ...DEFAULT_AUTOMATION_SETTINGS,
    ...(settings.ai_automation || {}),
  };
}

export function isAutomationEnabledForSettings(
  type: AutomationType,
  settings: AutomationSettings
): boolean {
  const key = typeSettingMap[type];
  return Boolean(settings[key]);
}

export async function isAutomationEnabled(
  type: AutomationType
): Promise<boolean> {
  const settings = await getAutomationSettings();
  return isAutomationEnabledForSettings(type, settings);
}

export async function recordAutomationHistory(
  automationId: string,
  status: string,
  message: string
): Promise<AutomationHistoryRecord | null> {
  const { data, error } = await supabase
    .from('automation_history')
    .insert({ automation_id: automationId, status, message })
    .select()
    .single();

  if (error) {
    console.error('Failed to record automation history', error);
    return null;
  }

  return data as AutomationHistoryRecord;
}

export async function scheduleAutomation(
  input: ScheduleAutomationInput
): Promise<AutomationRecord | null> {
  const settings = await getAutomationSettings();
  if (!isAutomationEnabledForSettings(input.type, settings)) {
    return null;
  }

  const runAtIso = input.runAt.toISOString();
  const existingQuery = supabase
    .from('automations')
    .select('*')
    .eq('type', input.type)
    .eq('run_at', runAtIso);

  if (input.relatedId) {
    existingQuery.eq('related_id', input.relatedId);
  } else {
    existingQuery.is('related_id', null);
  }

  const { data: existing, error: existingError } = await existingQuery;

  if (existingError) {
    console.error('Failed to check existing automations', existingError);
  }

  if (existing && existing.length > 0) {
    return existing[0] as AutomationRecord;
  }

  const { data, error } = await supabase
    .from('automations')
    .insert({
      type: input.type,
      related_id: input.relatedId || null,
      status: 'pending',
      run_at: runAtIso,
      payload: input.payload || null,
      attempts: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to schedule automation', error);
    throw error;
  }

  if (data?.id) {
    await recordAutomationHistory(data.id, 'pending', 'Automation scheduled');
  }

  return data as AutomationRecord;
}

export async function updateAutomationStatus(
  automationId: string,
  status: AutomationStatus,
  result?: Record<string, any> | null,
  message?: string
): Promise<void> {
  const updateData: Partial<AutomationRecord> = { status };
  if (result !== undefined) {
    updateData.result = result;
  }

  const { error } = await supabase
    .from('automations')
    .update(updateData)
    .eq('id', automationId);

  if (error) {
    console.error('Failed to update automation status', error);
    throw error;
  }

  if (message) {
    await recordAutomationHistory(automationId, status, message);
  }
}

export async function listAutomationsWithHistory(
  filters: AutomationFilterOptions = {}
): Promise<
  Array<AutomationRecord & { automation_history?: AutomationHistoryRecord[] }>
> {
  let query = supabase
    .from('automations')
    .select('*, automation_history(*)')
    .order('run_at', { ascending: true })
    .limit(filters.limit || 100);

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to list automations', error);
    throw error;
  }

  return (data || []) as Array<
    AutomationRecord & { automation_history?: AutomationHistoryRecord[] }
  >;
}

export async function getDueAutomations(
  limit: number = 10
): Promise<AutomationRecord[]> {
  const { data, error } = await supabase
    .from('automations')
    .select('*')
    .eq('status', 'pending')
    .lte('run_at', new Date().toISOString())
    .order('run_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch due automations', error);
    throw error;
  }

  return (data || []) as AutomationRecord[];
}

export async function claimAutomation(
  automation: AutomationRecord
): Promise<AutomationRecord | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('automations')
    .update({
      status: 'processing',
      last_attempt: now,
      attempts: (automation.attempts || 0) + 1,
    })
    .eq('id', automation.id)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) {
    console.error('Failed to claim automation', error);
    return null;
  }

  if (!data) return null;

  await recordAutomationHistory(
    automation.id,
    'processing',
    'Picked up by scheduler'
  );

  return data as AutomationRecord;
}
