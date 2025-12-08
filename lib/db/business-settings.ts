import { supabase } from '@/lib/supabase';
import type {
  BusinessSettings,
  BusinessSettingsUpdate,
} from '@/types/business-settings';

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

  return data;
}

/**
 * Update business settings
 */
export async function updateBusinessSettings(
  updates: BusinessSettingsUpdate
): Promise<BusinessSettings> {
  const { data, error } = await supabase
    .from('business_settings')
    .update(updates)
    .eq('id', (await getBusinessSettings())?.id)
    .select()
    .single();

  if (error) throw error;
  return data;
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
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get or create business settings
 */
export async function getOrCreateBusinessSettings(): Promise<BusinessSettings> {
  let settings = await getBusinessSettings();
  if (!settings) {
    settings = await createDefaultBusinessSettings();
  }
  return settings;
}
