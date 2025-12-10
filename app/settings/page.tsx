'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';
import type { BusinessSettings } from '@/types/business-settings';
import type { AutomationSettings } from '@/types/automation';
import { DEFAULT_AUTOMATION_SETTINGS } from '@/types/automation';

const automationDescriptions: Record<keyof AutomationSettings, string> = {
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

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    company_name: '',
    company_address: '',
    company_city: '',
    company_state: '',
    company_zip: '',
    company_phone: '',
    company_email: '',
    company_website: '',
    logo_url: '',
    default_estimate_validity_days: 30,
    default_tax_rate: 0,
    default_payment_terms: '',
    default_estimate_terms: '',
    default_invoice_terms: '',
    ai_automation: DEFAULT_AUTOMATION_SETTINGS,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setFormData({
          company_name: data.company_name || '',
          company_address: data.company_address || '',
          company_city: data.company_city || '',
          company_state: data.company_state || '',
          company_zip: data.company_zip || '',
          company_phone: data.company_phone || '',
          company_email: data.company_email || '',
          company_website: data.company_website || '',
          logo_url: data.logo_url || '',
          default_estimate_validity_days:
            data.default_estimate_validity_days || 30,
          default_tax_rate: data.default_tax_rate || 0,
          default_payment_terms: data.default_payment_terms || '',
          default_estimate_terms: data.default_estimate_terms || '',
          default_invoice_terms: data.default_invoice_terms || '',
          ai_automation: {
            ...DEFAULT_AUTOMATION_SETTINGS,
            ...(data.ai_automation || {}),
          },
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load business settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updated = await response.json();
        setSettings(updated);
        setFormData((prev) => ({
          ...prev,
          ai_automation: {
            ...DEFAULT_AUTOMATION_SETTINGS,
            ...(updated.ai_automation || {}),
          },
        }));
        toast({
          title: 'Success',
          description: 'Business settings saved successfully',
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save business settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAutomationToggle = (key: keyof AutomationSettings) => {
    setFormData((prev) => ({
      ...prev,
      ai_automation: {
        ...prev.ai_automation,
        [key]: !prev.ai_automation[key],
      },
    }));
  };

  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    try {
      const response = await fetch('/api/backup');
      if (!response.ok) throw new Error('Failed to download backup');

      const backup = await response.json();
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `doveapp-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Backup Downloaded',
        description: 'Your data has been saved to a local file.',
      });
    } catch (error) {
      console.error('Backup download failed:', error);
      toast({
        title: 'Backup Failed',
        description: 'Unable to download backup. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleImportBackup = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // File validation
    if (!file.name.endsWith('.json')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a valid JSON backup file.',
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }

    // File size validation (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Backup file must be smaller than 50MB.',
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }

    // Confirmation prompt
    const confirmed = window.confirm(
      `Are you sure you want to import this backup? This will overwrite existing data.\n\nFile: ${file.name}\nSize: ${(file.size / 1024 / 1024).toFixed(2)} MB`
    );

    if (!confirmed) {
      event.target.value = '';
      return;
    }

    setImportLoading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('backup', file);

      const response = await fetch('/api/backup', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }

      const result = await response.json();
      toast({
        title: 'Import Successful',
        description: 'Your data has been restored from the backup.',
      });

      // Reload settings and potentially redirect to refresh app state
      loadSettings();
    } catch (error: any) {
      console.error('Import failed:', error);
      toast({
        title: 'Import Failed',
        description:
          error.message ||
          'Unable to import backup. Please check the file format.',
        variant: 'destructive',
      });
    } finally {
      setImportLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

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
            Loading settings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  Settings
                </h1>
                <p className="mt-1 text-sm text-emerald-100">
                  Manage your business information, preferences, and automations
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Information */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">
              Company Information
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Basic details about your business
            </p>
          </div>
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="company_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Company Name *
                </label>
                <input
                  type="text"
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) =>
                    handleInputChange('company_name', e.target.value)
                  }
                  placeholder="Your Company Name"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="company_address"
                  className="block text-sm font-medium text-gray-700"
                >
                  Address
                </label>
                <input
                  type="text"
                  id="company_address"
                  value={formData.company_address}
                  onChange={(e) =>
                    handleInputChange('company_address', e.target.value)
                  }
                  placeholder="123 Main Street"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="company_city"
                  className="block text-sm font-medium text-gray-700"
                >
                  City
                </label>
                <input
                  type="text"
                  id="company_city"
                  value={formData.company_city}
                  onChange={(e) =>
                    handleInputChange('company_city', e.target.value)
                  }
                  placeholder="Anytown"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="company_state"
                  className="block text-sm font-medium text-gray-700"
                >
                  State
                </label>
                <input
                  type="text"
                  id="company_state"
                  value={formData.company_state}
                  onChange={(e) =>
                    handleInputChange('company_state', e.target.value)
                  }
                  placeholder="ST"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="company_zip"
                  className="block text-sm font-medium text-gray-700"
                >
                  ZIP Code
                </label>
                <input
                  type="text"
                  id="company_zip"
                  value={formData.company_zip}
                  onChange={(e) =>
                    handleInputChange('company_zip', e.target.value)
                  }
                  placeholder="12345"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="company_phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone
                </label>
                <input
                  type="tel"
                  id="company_phone"
                  value={formData.company_phone}
                  onChange={(e) =>
                    handleInputChange('company_phone', e.target.value)
                  }
                  placeholder="(555) 123-4567"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="company_email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="company_email"
                  value={formData.company_email}
                  onChange={(e) =>
                    handleInputChange('company_email', e.target.value)
                  }
                  placeholder="info@company.com"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="company_website"
                  className="block text-sm font-medium text-gray-700"
                >
                  Website
                </label>
                <input
                  type="url"
                  id="company_website"
                  value={formData.company_website}
                  onChange={(e) =>
                    handleInputChange('company_website', e.target.value)
                  }
                  placeholder="https://www.company.com"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="logo_url"
                  className="block text-sm font-medium text-gray-700"
                >
                  Logo URL
                </label>
                <input
                  type="url"
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) =>
                    handleInputChange('logo_url', e.target.value)
                  }
                  placeholder="https://example.com/logo.png"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Default Settings */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">
              Default Settings
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Configure default values for estimates and invoices
            </p>
          </div>
          <div className="px-6 py-6 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="default_estimate_validity_days"
                  className="block text-sm font-medium text-gray-700"
                >
                  Estimate Validity (Days)
                </label>
                <input
                  type="number"
                  id="default_estimate_validity_days"
                  min="1"
                  value={formData.default_estimate_validity_days}
                  onChange={(e) =>
                    handleInputChange(
                      'default_estimate_validity_days',
                      parseInt(e.target.value) || 30
                    )
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="default_tax_rate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Default Tax Rate (%)
                </label>
                <input
                  type="number"
                  id="default_tax_rate"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.default_tax_rate}
                  onChange={(e) =>
                    handleInputChange(
                      'default_tax_rate',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="default_payment_terms"
                className="block text-sm font-medium text-gray-700"
              >
                Default Payment Terms
              </label>
              <textarea
                id="default_payment_terms"
                value={formData.default_payment_terms}
                onChange={(e) =>
                  handleInputChange('default_payment_terms', e.target.value)
                }
                placeholder="Payment due within 30 days"
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Default Terms */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">
              Default Terms & Conditions
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Set default legal terms for estimates and invoices
            </p>
          </div>
          <div className="px-6 py-6 space-y-6">
            <div>
              <label
                htmlFor="default_estimate_terms"
                className="block text-sm font-medium text-gray-700"
              >
                Default Estimate Terms
              </label>
              <textarea
                id="default_estimate_terms"
                value={formData.default_estimate_terms}
                onChange={(e) =>
                  handleInputChange('default_estimate_terms', e.target.value)
                }
                placeholder="Terms that appear on estimates"
                rows={4}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="default_invoice_terms"
                className="block text-sm font-medium text-gray-700"
              >
                Default Invoice Terms
              </label>
              <textarea
                id="default_invoice_terms"
                value={formData.default_invoice_terms}
                onChange={(e) =>
                  handleInputChange('default_invoice_terms', e.target.value)
                }
                placeholder="Terms that appear on invoices"
                rows={4}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* AI Automations */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">
              AI Automations
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Configure automated follow-ups and responses
            </p>
          </div>
          <div className="px-6 py-6">
            <div className="space-y-4">
              {(
                Object.keys(formData.ai_automation) as Array<
                  keyof AutomationSettings
                >
              ).map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 capitalize">
                      {key.split('_').join(' ')}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {automationDescriptions[key]}
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      type="button"
                      onClick={() => handleAutomationToggle(key)}
                      className={`${
                        formData.ai_automation[key]
                          ? 'bg-emerald-600'
                          : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2`}
                      role="switch"
                      aria-checked={formData.ai_automation[key]}
                    >
                      <span
                        aria-hidden="true"
                        className={`${
                          formData.ai_automation[key]
                            ? 'translate-x-5'
                            : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">
              Data Management
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Backup and restore your business data
            </p>
          </div>
          <div className="px-6 py-6 space-y-6">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  Download Backup
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Export all your data to a JSON file for safe keeping.
                </p>
              </div>
              <button
                onClick={handleDownloadBackup}
                disabled={backupLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {backupLoading ? (
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                ) : (
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
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                )}
                Download
              </button>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  Import Backup
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Restore data from a previously exported backup file.
                </p>
              </div>
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                  id="backup-upload"
                  disabled={importLoading}
                />
                <label
                  htmlFor="backup-upload"
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 cursor-pointer ${
                    importLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {importLoading ? (
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  ) : (
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
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  )}
                  Upload
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  className="-ml-1 mr-3 h-5 w-5"
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
  );
}
