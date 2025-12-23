import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAccountContext } from '@/lib/auth-guards';
import { z } from 'zod';

// Schema for automation settings
const automationSettingsSchema = z.object({
  follow_up_automations: z.object({
    enabled: z.boolean(),
    default_delay_days: z.number(),
    auto_follow_up: z.boolean(),
    reminder_frequency: z.string(),
    follow_up_template: z.string(),
  }),
  response_automations: z.object({
    enabled: z.boolean(),
    auto_responses: z.boolean(),
    response_templates: z.record(z.string(), z.string()),
    smart_responses: z.boolean(),
  }),
  workflow_rules: z.object({
    enabled: z.boolean(),
    auto_assign_jobs: z.boolean(),
    priority_escalation: z.boolean(),
    deadline_notifications: z.boolean(),
    overdue_alerts: z.boolean(),
  }),
  scheduling_automations: z.object({
    enabled: z.boolean(),
    auto_schedule: z.boolean(),
    resource_optimization: z.boolean(),
    conflict_resolution: z.boolean(),
    calendar_sync: z.boolean(),
  }),
  trigger_rules: z.object({
    enabled: z.boolean(),
    job_completion_triggers: z.array(z.string()),
    payment_triggers: z.array(z.string()),
    client_feedback_triggers: z.array(z.string()),
    custom_triggers: z.array(z.string()),
  }),
});

/**
 * GET /api/admin/automations - Get automation settings
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAccountContext(request);
    const supabase = createAdminClient();

    // Get business settings (there's only one row)
    const { data: settings, error } = await supabase
      .from('business_settings')
      .select('ai_automation')
      .single();

    if (error) {
      console.error('Error fetching business settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch business settings' },
        { status: 500 }
      );
    }

    // Extract automation settings from ai_automation JSONB field
    const aiAutomation = settings?.ai_automation || {};
    const automationSettings = aiAutomation.automations || {
      follow_up_automations: {
        enabled: false,
        default_delay_days: 7,
        auto_follow_up: false,
        reminder_frequency: 'weekly',
        follow_up_template: 'default_followup',
      },
      response_automations: {
        enabled: false,
        auto_responses: false,
        response_templates: {},
        smart_responses: false,
      },
      workflow_rules: {
        enabled: false,
        auto_assign_jobs: false,
        priority_escalation: false,
        deadline_notifications: false,
        overdue_alerts: false,
      },
      scheduling_automations: {
        enabled: false,
        auto_schedule: false,
        resource_optimization: false,
        conflict_resolution: false,
        calendar_sync: false,
      },
      trigger_rules: {
        enabled: false,
        job_completion_triggers: [],
        payment_triggers: [],
        client_feedback_triggers: [],
        custom_triggers: [],
      },
    };

    return NextResponse.json(automationSettings);
  } catch (error) {
    console.error('Error in GET /api/admin/automations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/automations - Save automation settings
 */
export async function PUT(request: NextRequest) {
  try {
    const context = await requireAccountContext(request);
    const body = await request.json();

    // Validate the settings
    const validatedSettings = automationSettingsSchema.parse(body);

    const supabase = createAdminClient();

    // Get current business settings
    const { data: currentSettings, error: fetchError } = await supabase
      .from('business_settings')
      .select('ai_automation')
      .single();

    if (fetchError) {
      console.error('Error fetching current settings:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch current settings' },
        { status: 500 }
      );
    }

    // Merge automation settings into ai_automation JSONB
    const updatedAiAutomation = {
      ...currentSettings?.ai_automation,
      automations: validatedSettings,
    };

    // Update the business settings (single row table)
    const { error } = await supabase.from('business_settings').update({
      ai_automation: updatedAiAutomation,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error saving automation settings:', error);
      return NextResponse.json(
        { error: 'Failed to save automation settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Automation settings saved successfully',
      settings: validatedSettings,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error in PUT /api/admin/automations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
