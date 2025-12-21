'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';

type TabType =
  | 'follow-ups'
  | 'responses'
  | 'workflows'
  | 'scheduling'
  | 'triggers';

interface AutomationSettings {
  follow_up_automations: {
    enabled: boolean;
    default_delay_days: number;
    auto_follow_up: boolean;
    reminder_frequency: string;
    follow_up_template: string;
  };
  response_automations: {
    enabled: boolean;
    auto_responses: boolean;
    response_templates: { [key: string]: string };
    smart_responses: boolean;
  };
  workflow_rules: {
    enabled: boolean;
    auto_assign_jobs: boolean;
    priority_escalation: boolean;
    deadline_notifications: boolean;
    overdue_alerts: boolean;
  };
  scheduling_automations: {
    enabled: boolean;
    auto_schedule: boolean;
    resource_optimization: boolean;
    conflict_resolution: boolean;
    calendar_sync: boolean;
  };
  trigger_rules: {
    enabled: boolean;
    job_completion_triggers: string[];
    payment_triggers: string[];
    client_feedback_triggers: string[];
    custom_triggers: string[];
  };
}

export default function AdvancedAutomationPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('follow-ups');
  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<AutomationSettings>({
    follow_up_automations: {
      enabled: true,
      default_delay_days: 7,
      auto_follow_up: true,
      reminder_frequency: 'weekly',
      follow_up_template: 'Thank you for your business. How was our service?',
    },
    response_automations: {
      enabled: true,
      auto_responses: true,
      response_templates: {
        positive: 'Thank you for your positive feedback!',
        negative:
          'We apologize for any inconvenience. Please contact us to resolve this.',
        neutral: 'Thank you for your feedback. We appreciate your input.',
      },
      smart_responses: true,
    },
    workflow_rules: {
      enabled: true,
      auto_assign_jobs: true,
      priority_escalation: true,
      deadline_notifications: true,
      overdue_alerts: true,
    },
    scheduling_automations: {
      enabled: false,
      auto_schedule: false,
      resource_optimization: false,
      conflict_resolution: false,
      calendar_sync: false,
    },
    trigger_rules: {
      enabled: true,
      job_completion_triggers: ['send_invoice', 'schedule_follow_up'],
      payment_triggers: ['send_receipt', 'update_status'],
      client_feedback_triggers: ['log_feedback', 'notify_team'],
      custom_triggers: [],
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/automations');
      if (!response.ok) {
        throw new Error('Failed to load automation settings');
      }
      const currentSettings = await response.json();
      setSettings(currentSettings);
      setFormData(currentSettings);
    } catch (error) {
      console.error('Failed to load automation settings:', error);
      toast({
        title: 'Warning',
        description:
          'Using default automation settings. Some features may not be available.',
        variant: 'default',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    section: keyof AutomationSettings,
    field: string,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleArrayChange = (
    section: keyof AutomationSettings,
    field: string,
    value: string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/automations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details || 'Failed to save automation settings'
        );
      }

      const updatedSettings = await response.json();
      setSettings(updatedSettings);

      toast({
        title: 'Success',
        description: 'Automation settings saved successfully',
      });
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save automation settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'follow-ups', label: 'Follow-up Automations', icon: '📧' },
    { id: 'responses', label: 'Response Automations', icon: '💬' },
    { id: 'workflows', label: 'Workflow Rules', icon: '⚙️' },
    { id: 'scheduling', label: 'Scheduling', icon: '📅' },
    { id: 'triggers', label: 'Trigger Rules', icon: '🚀' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-gray-700 bg-white transition ease-in-out duration-150">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading Automation Settings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  Advanced Automation
                </h1>
                <p className="mt-1 text-sm text-blue-100">
                  Configure advanced automation rules, triggers, and workflow
                  optimizations with AI-powered task automation.
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg
                        className="-ml-1 mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'follow-ups' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Follow-up Automations
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Automate follow-up communications after job completion,
                including reminders and satisfaction surveys.
              </p>

              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Default Delay (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={formData.follow_up_automations.default_delay_days}
                      onChange={(e) =>
                        handleInputChange(
                          'follow_up_automations',
                          'default_delay_days',
                          parseInt(e.target.value)
                        )
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Days after job completion to send follow-up
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Reminder Frequency
                    </label>
                    <select
                      value={formData.follow_up_automations.reminder_frequency}
                      onChange={(e) =>
                        handleInputChange(
                          'follow_up_automations',
                          'reminder_frequency',
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Follow-up Template
                  </label>
                  <textarea
                    value={formData.follow_up_automations.follow_up_template}
                    onChange={(e) =>
                      handleInputChange(
                        'follow_up_automations',
                        'follow_up_template',
                        e.target.value
                      )
                    }
                    rows={3}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter your follow-up message template..."
                  />
                </div>

                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.follow_up_automations.enabled}
                      onChange={(e) =>
                        handleInputChange(
                          'follow_up_automations',
                          'enabled',
                          e.target.checked
                        )
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Enable follow-up automations
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.follow_up_automations.auto_follow_up}
                      onChange={(e) =>
                        handleInputChange(
                          'follow_up_automations',
                          'auto_follow_up',
                          e.target.checked
                        )
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Automatically send follow-up messages
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'responses' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Response Automations
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure automated responses to client communications and
                feedback with AI-powered smart replies.
              </p>

              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.response_automations.enabled}
                      onChange={(e) =>
                        handleInputChange(
                          'response_automations',
                          'enabled',
                          e.target.checked
                        )
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Enable response automations
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.response_automations.auto_responses}
                      onChange={(e) =>
                        handleInputChange(
                          'response_automations',
                          'auto_responses',
                          e.target.checked
                        )
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Automatically respond to client messages
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.response_automations.smart_responses}
                      onChange={(e) =>
                        handleInputChange(
                          'response_automations',
                          'smart_responses',
                          e.target.checked
                        )
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Use AI-powered smart responses
                    </span>
                  </label>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Response Templates
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(
                      formData.response_automations.response_templates
                    ).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 capitalize">
                          {key} Response
                        </label>
                        <textarea
                          value={value}
                          onChange={(e) => {
                            const newTemplates = {
                              ...formData.response_automations
                                .response_templates,
                              [key]: e.target.value,
                            };
                            handleInputChange(
                              'response_automations',
                              'response_templates',
                              newTemplates
                            );
                          }}
                          rows={2}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workflows' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Workflow Rules
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Define automated workflow rules for job management, priority
                escalation, and notification triggers.
              </p>

              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.workflow_rules.enabled}
                    onChange={(e) =>
                      handleInputChange(
                        'workflow_rules',
                        'enabled',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Enable workflow automation rules
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.workflow_rules.auto_assign_jobs}
                    onChange={(e) =>
                      handleInputChange(
                        'workflow_rules',
                        'auto_assign_jobs',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Automatically assign jobs to technicians
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.workflow_rules.priority_escalation}
                    onChange={(e) =>
                      handleInputChange(
                        'workflow_rules',
                        'priority_escalation',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Enable priority escalation for urgent jobs
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.workflow_rules.deadline_notifications}
                    onChange={(e) =>
                      handleInputChange(
                        'workflow_rules',
                        'deadline_notifications',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Send notifications for approaching deadlines
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.workflow_rules.overdue_alerts}
                    onChange={(e) =>
                      handleInputChange(
                        'workflow_rules',
                        'overdue_alerts',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Send alerts for overdue jobs
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scheduling' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Scheduling Automations
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure automated scheduling with resource optimization and
                conflict resolution for efficient job management.
              </p>

              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.scheduling_automations.enabled}
                    onChange={(e) =>
                      handleInputChange(
                        'scheduling_automations',
                        'enabled',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Enable scheduling automations
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.scheduling_automations.auto_schedule}
                    onChange={(e) =>
                      handleInputChange(
                        'scheduling_automations',
                        'auto_schedule',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Automatically schedule jobs based on availability
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={
                      formData.scheduling_automations.resource_optimization
                    }
                    onChange={(e) =>
                      handleInputChange(
                        'scheduling_automations',
                        'resource_optimization',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Optimize resource allocation across jobs
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={
                      formData.scheduling_automations.conflict_resolution
                    }
                    onChange={(e) =>
                      handleInputChange(
                        'scheduling_automations',
                        'conflict_resolution',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Automatically resolve scheduling conflicts
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.scheduling_automations.calendar_sync}
                    onChange={(e) =>
                      handleInputChange(
                        'scheduling_automations',
                        'calendar_sync',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Sync with external calendars (Google, Outlook)
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'triggers' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Trigger Rules
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Define custom triggers for automated actions based on job
                events, payments, and client feedback.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      checked={formData.trigger_rules.enabled}
                      onChange={(e) =>
                        handleInputChange(
                          'trigger_rules',
                          'enabled',
                          e.target.checked
                        )
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Enable custom trigger rules
                    </span>
                  </label>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Job Completion Triggers
                  </h4>
                  <div className="space-y-2">
                    {[
                      'send_invoice',
                      'schedule_follow_up',
                      'send_receipt',
                      'notify_client',
                    ].map((trigger) => (
                      <label key={trigger} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.trigger_rules.job_completion_triggers.includes(
                            trigger
                          )}
                          onChange={(e) => {
                            const current =
                              formData.trigger_rules.job_completion_triggers;
                            const updated = e.target.checked
                              ? [...current, trigger]
                              : current.filter((t) => t !== trigger);
                            handleArrayChange(
                              'trigger_rules',
                              'job_completion_triggers',
                              updated
                            );
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">
                          {trigger.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Payment Triggers
                  </h4>
                  <div className="space-y-2">
                    {[
                      'send_receipt',
                      'update_status',
                      'notify_team',
                      'log_payment',
                    ].map((trigger) => (
                      <label key={trigger} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.trigger_rules.payment_triggers.includes(
                            trigger
                          )}
                          onChange={(e) => {
                            const current =
                              formData.trigger_rules.payment_triggers;
                            const updated = e.target.checked
                              ? [...current, trigger]
                              : current.filter((t) => t !== trigger);
                            handleArrayChange(
                              'trigger_rules',
                              'payment_triggers',
                              updated
                            );
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">
                          {trigger.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Client Feedback Triggers
                  </h4>
                  <div className="space-y-2">
                    {[
                      'log_feedback',
                      'notify_team',
                      'send_response',
                      'escalate_negative',
                    ].map((trigger) => (
                      <label key={trigger} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.trigger_rules.client_feedback_triggers.includes(
                            trigger
                          )}
                          onChange={(e) => {
                            const current =
                              formData.trigger_rules.client_feedback_triggers;
                            const updated = e.target.checked
                              ? [...current, trigger]
                              : current.filter((t) => t !== trigger);
                            handleArrayChange(
                              'trigger_rules',
                              'client_feedback_triggers',
                              updated
                            );
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">
                          {trigger.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-4 right-4 z-10">
        <div className="flex space-x-2">
          <a
            href="/admin/advanced-settings"
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg"
          >
            <svg
              className="mr-1 w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Advanced Settings
          </a>
        </div>
      </div>
    </div>
  );
}
