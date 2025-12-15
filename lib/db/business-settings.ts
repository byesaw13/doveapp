import { supabase } from '@/lib/supabase';
import type {
  BusinessSettings,
  BusinessSettingsUpdate,
} from '@/types/business-settings';
import type { AutomationSettings } from '@/types/automation';
import { DEFAULT_AUTOMATION_SETTINGS } from '@/types/automation';

type SupabaseClient = typeof supabase;

const applyAutomationDefaults = (
  settings: BusinessSettings
): BusinessSettings => ({
  ...settings,
  ai_automation: {
    ...DEFAULT_AUTOMATION_SETTINGS,
    ...(settings.ai_automation || {}),
  },
});

const mergeAutomationSettings = (
  current?: AutomationSettings | null,
  updates?: AutomationSettings
): AutomationSettings => ({
  ...DEFAULT_AUTOMATION_SETTINGS,
  ...(current || {}),
  ...(updates || {}),
});

const getClient = (client?: SupabaseClient) => client || supabase;

/**
 * Get business settings (returns the first/only record)
 */
export async function getBusinessSettings(
  client?: SupabaseClient
): Promise<BusinessSettings | null> {
  const sb = getClient(client);

  const { data, error } = await sb
    .from('business_settings')
    .select('*')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found, return null
      return null;
    }
    throw error;
  }

  if (!data) return null;
  return applyAutomationDefaults(data as BusinessSettings);
}

/**
 * Update business settings
 */
export async function updateBusinessSettings(
  updates: BusinessSettingsUpdate,
  client?: SupabaseClient
): Promise<BusinessSettings> {
  const sb = getClient(client);
  const current = await getOrCreateBusinessSettings(sb);
  const payload: BusinessSettingsUpdate = { ...updates };

  if (updates.ai_automation || current.ai_automation) {
    payload.ai_automation = mergeAutomationSettings(
      current.ai_automation,
      updates.ai_automation
    );
  }

  const { data, error } = await sb
    .from('business_settings')
    .update(payload)
    .eq('id', current.id)
    .select()
    .single();

  if (error) throw error;
  return applyAutomationDefaults(data as BusinessSettings);
}

/**
 * Create default business settings if none exist
 */
export async function createDefaultBusinessSettings(
  client?: SupabaseClient
): Promise<BusinessSettings> {
  const sb = getClient(client);

  const { data, error } = await sb
    .from('business_settings')
    .insert({
      company_name: 'Your Company Name',
      default_estimate_validity_days: 30,
      default_tax_rate: 0,
      default_payment_terms: 'Payment due within 30 days',
      default_estimate_terms:
        'This estimate is valid for 30 days. All work is guaranteed for 90 days.',
      default_invoice_terms:
        'Thank you for your business. Please remit payment within 30 days.',
      ai_automation: DEFAULT_AUTOMATION_SETTINGS,
    })
    .select()
    .single();

  if (error) throw error;
  return applyAutomationDefaults(data as BusinessSettings);
}

/**
 * Get or create business settings
 */
export async function getOrCreateBusinessSettings(
  client?: SupabaseClient
): Promise<BusinessSettings> {
  const sb = getClient(client);
  const settings = await getBusinessSettings(sb);
  if (!settings) {
    return createDefaultBusinessSettings(sb);
  }
  return settings;
}
