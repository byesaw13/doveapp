import { supabase } from '@/lib/supabase';
import type {
  BusinessSettings,
  BusinessSettingsUpdate,
} from '@/types/business-settings';
import type { AutomationSettings } from '@/types/automation';
import { DEFAULT_AUTOMATION_SETTINGS } from '@/types/automation';

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

/**
 * Get business settings (returns the first/only record)
 */
export async function getBusinessSettings(): Promise<BusinessSettings | null> {
  const { data, error } = await supabase
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
  updates: BusinessSettingsUpdate
): Promise<BusinessSettings> {
  const current = await getOrCreateBusinessSettings();
  const payload: BusinessSettingsUpdate = { ...updates };

  if (updates.ai_automation || current.ai_automation) {
    payload.ai_automation = mergeAutomationSettings(
      current.ai_automation,
      updates.ai_automation
    );
  }

  const { data, error } = await supabase
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
export async function createDefaultBusinessSettings(): Promise<BusinessSettings> {
  const { data, error } = await supabase
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
export async function getOrCreateBusinessSettings(): Promise<BusinessSettings> {
  const settings = await getBusinessSettings();
  if (!settings) {
    return createDefaultBusinessSettings();
  }
  return settings;
}
