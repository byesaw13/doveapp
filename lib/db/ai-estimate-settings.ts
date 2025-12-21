import { supabase } from '@/lib/supabase';
import type { AIEstimateSettings } from '@/types/estimate';

/**
 * Get AI estimate settings for a user, falling back to global defaults
 */
export async function getAIEstimateSettings(
  userId?: string
): Promise<AIEstimateSettings> {
  // First try to get user-specific settings
  if (userId) {
    const { data: userSettings, error: userError } = await supabase
      .from('ai_estimate_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!userError && userSettings) {
      return userSettings as AIEstimateSettings;
    }
  }

  // Fall back to global defaults
  const { data: globalSettings, error: globalError } = await supabase
    .from('ai_estimate_settings')
    .select('*')
    .is('user_id', null)
    .single();

  if (globalError) {
    throw globalError;
  }

  if (!globalSettings) {
    throw new Error(
      'No AI estimate settings found - database may not be properly initialized'
    );
  }

  return globalSettings as AIEstimateSettings;
}

/**
 * Create or update AI estimate settings for a user
 */
export async function upsertAIEstimateSettings(
  settings: Omit<AIEstimateSettings, 'id' | 'created_at' | 'updated_at'>
): Promise<AIEstimateSettings> {
  const userId = settings.user_id;

  console.log('Upserting settings for userId:', userId);

  // Check if settings already exist (don't use .single() to avoid error on empty result)
  let existingSettings;
  if (userId) {
    const { data, error } = await supabase
      .from('ai_estimate_settings')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking existing user settings:', error);
      throw error;
    }
    existingSettings = data;
  } else {
    const { data, error } = await supabase
      .from('ai_estimate_settings')
      .select('id')
      .is('user_id', null)
      .maybeSingle();

    if (error) {
      console.error('Error checking existing global settings:', error);
      throw error;
    }
    existingSettings = data;
  }

  console.log('Existing settings found:', existingSettings);

  // Update existing or insert new
  if (existingSettings) {
    console.log('Updating existing settings with id:', existingSettings.id);
    const { data, error } = await supabase
      .from('ai_estimate_settings')
      .update(settings)
      .eq('id', existingSettings.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating settings:', error);
      throw error;
    }

    if (!data) {
      console.error('Update returned no data - likely RLS policy blocking');
      throw new Error('Failed to update settings - permission denied');
    }

    return data as AIEstimateSettings;
  } else {
    console.log('Inserting new settings');
    const { data, error } = await supabase
      .from('ai_estimate_settings')
      .insert(settings)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error inserting settings:', error);
      throw error;
    }

    if (!data) {
      console.error('Insert returned no data - likely RLS policy blocking');
      throw new Error('Failed to insert settings - permission denied');
    }

    return data as AIEstimateSettings;
  }
}

/**
 * Update specific AI estimate settings for a user
 */
export async function updateAIEstimateSettings(
  userId: string,
  updates: Partial<
    Omit<AIEstimateSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  >
): Promise<AIEstimateSettings> {
  const { data, error } = await supabase
    .from('ai_estimate_settings')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as AIEstimateSettings;
}

/**
 * Reset user settings to global defaults
 */
export async function resetAIEstimateSettingsToDefaults(
  userId: string
): Promise<void> {
  // Delete user settings (this will cause fallback to globals)
  const { error } = await supabase
    .from('ai_estimate_settings')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Get all user-specific settings (admin function)
 */
export async function getAllUserAIEstimateSettings(): Promise<
  AIEstimateSettings[]
> {
  const { data, error } = await supabase
    .from('ai_estimate_settings')
    .select('*')
    .not('user_id', 'is', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as AIEstimateSettings[];
}

/**
 * Validate AI estimate settings
 */
export function validateAIEstimateSettings(
  settings: Partial<AIEstimateSettings>
): string[] {
  const errors: string[] = [];

  if (
    settings.default_profit_margin !== undefined &&
    (settings.default_profit_margin < 0 || settings.default_profit_margin > 100)
  ) {
    errors.push('Profit margin must be between 0 and 100');
  }

  if (
    settings.hourly_labor_rate !== undefined &&
    settings.hourly_labor_rate <= 0
  ) {
    errors.push('Hourly labor rate must be greater than 0');
  }

  if (
    settings.billable_hourly_rate !== undefined &&
    settings.billable_hourly_rate <= 0
  ) {
    errors.push('Billable hourly rate must be greater than 0');
  }

  if (
    settings.overtime_multiplier !== undefined &&
    (settings.overtime_multiplier < 1 || settings.overtime_multiplier > 5)
  ) {
    errors.push('Overtime multiplier must be between 1 and 5');
  }

  if (
    settings.material_markup_percentage !== undefined &&
    settings.material_markup_percentage < 0
  ) {
    errors.push('Material markup percentage cannot be negative');
  }

  if (
    settings.overhead_percentage !== undefined &&
    (settings.overhead_percentage < 0 || settings.overhead_percentage > 100)
  ) {
    errors.push('Overhead percentage must be between 0 and 100');
  }

  if (
    settings.default_tax_rate !== undefined &&
    (settings.default_tax_rate < 0 || settings.default_tax_rate > 100)
  ) {
    errors.push('Tax rate must be between 0 and 100');
  }

  if (
    settings.minimum_job_size !== undefined &&
    settings.minimum_job_size < 0
  ) {
    errors.push('Minimum job size cannot be negative');
  }

  if (
    settings.round_to_nearest !== undefined &&
    settings.round_to_nearest <= 0
  ) {
    errors.push('Round to nearest must be greater than 0');
  }

  return errors;
}
