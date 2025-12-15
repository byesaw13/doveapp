'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import type { AutomationSettings } from '@/types/automation';
import { DEFAULT_AUTOMATION_SETTINGS } from '@/types/automation';
import { Loader2, Save } from 'lucide-react';

const settingDescriptions: Record<keyof AutomationSettings, string> = {
  estimate_followups:
    'Send helpful follow-ups 48 hours after an estimate is sent.',
  invoice_followups:
    'Remind customers about open invoices with tone that escalates when overdue.',
  job_closeout:
    'Summarize completed jobs with safety tips and recommended intervals.',
  review_requests:
    'Request a quick review a day after closeout, when contact info is available.',
  lead_response:
    'Auto-reply to new leads with clarifying questions and next steps.',
};

export default function AutomationSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AutomationSettings>(
    DEFAULT_AUTOMATION_SETTINGS
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings({
          ...DEFAULT_AUTOMATION_SETTINGS,
          ...(data.ai_automation || {}),
        });
      }
    } catch (error) {
      console.error('Failed to load automation settings:', error);
      toast({
        title: 'Error',
        description: 'Unable to load automation settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof AutomationSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_automation: settings }),
      });

      if (!response.ok) {
        throw new Error('Failed to save automation settings');
      }

      const data = await response.json();
      setSettings({
        ...DEFAULT_AUTOMATION_SETTINGS,
        ...(data.ai_automation || {}),
      });

      toast({
        title: 'Saved',
        description: 'Automation settings updated',
      });
    } catch (error) {
      console.error('Failed to save automation settings:', error);
      toast({
        title: 'Error',
        description: 'Unable to save automation settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading automation settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <h1 className="text-3xl font-bold">Automation Settings</h1>
          <p className="text-blue-100 mt-2">
            Control AI-powered automations for follow-ups, closeouts, and
            responses.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>AI Automations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(Object.keys(settings) as Array<keyof AutomationSettings>).map(
              (key) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
                >
                  <div>
                    <Label className="capitalize">
                      {key.split('_').join(' ')}
                    </Label>
                    <p className="text-sm text-slate-600 mt-1">
                      {settingDescriptions[key]}
                    </p>
                  </div>
                  <Switch
                    checked={settings[key]}
                    onCheckedChange={() => handleToggle(key)}
                  />
                </div>
              )
            )}

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {!saving && <Save className="h-4 w-4 mr-2" />}
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
