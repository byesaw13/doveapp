'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';

type TabType =
  | 'password-policy'
  | 'session-security'
  | 'audit-logging'
  | 'compliance'
  | 'encryption'
  | 'access-control'
  | 'audit-logs';

interface SecuritySettings {
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_symbols: boolean;
    password_expiry_days: number;
  };
  session_policy: {
    session_timeout_minutes: number;
    max_concurrent_sessions: number;
    require_2fa: boolean;
    remember_me_days: number;
  };
  audit_policy: {
    enable_audit_logging: boolean;
    log_sensitive_actions: boolean;
    retention_days: number;
    export_audit_logs: boolean;
  };
  compliance_policy: {
    data_retention_years: number;
    gdpr_compliance: boolean;
    hipaa_compliance: boolean;
    enable_data_anonymization: boolean;
    require_consent: boolean;
  };
  encryption_policy: {
    encrypt_sensitive_data: boolean;
    encryption_algorithm: string;
    key_rotation_days: number;
    backup_encryption: boolean;
  };
  access_policy: {
    allow_api_access: boolean;
    rate_limiting_enabled: boolean;
    max_requests_per_minute: number;
    ip_whitelist_enabled: boolean;
    allowed_ips: string[];
  };
}

export default function SecurityCompliancePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('password-policy');
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<SecuritySettings>({
    password_policy: {
      min_length: 8,
      require_uppercase: true,
      require_lowercase: true,
      require_numbers: true,
      require_symbols: false,
      password_expiry_days: 90,
    },
    session_policy: {
      session_timeout_minutes: 480,
      max_concurrent_sessions: 5,
      require_2fa: false,
      remember_me_days: 30,
    },
    audit_policy: {
      enable_audit_logging: true,
      log_sensitive_actions: true,
      retention_days: 365,
      export_audit_logs: true,
    },
    compliance_policy: {
      data_retention_years: 7,
      gdpr_compliance: false,
      hipaa_compliance: false,
      enable_data_anonymization: false,
      require_consent: true,
    },
    encryption_policy: {
      encrypt_sensitive_data: true,
      encryption_algorithm: 'AES-256',
      key_rotation_days: 90,
      backup_encryption: true,
    },
    access_policy: {
      allow_api_access: true,
      rate_limiting_enabled: true,
      max_requests_per_minute: 100,
      ip_whitelist_enabled: false,
      allowed_ips: [],
    },
  });

  useEffect(() => {
    loadSettings();
    loadAuditLogs();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/security-settings');
      if (!response.ok) {
        throw new Error('Failed to load security settings');
      }
      const currentSettings = await response.json();
      setSettings(currentSettings);
      setFormData(currentSettings);
    } catch (error) {
      console.error('Failed to load security settings:', error);
      toast({
        title: 'Warning',
        description:
          'Using default security settings. Some features may not be available.',
        variant: 'default',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setLogsLoading(true);
      const response = await fetch('/api/admin/audit-logs?limit=50');
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleInputChange = (
    section: keyof SecuritySettings,
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
    section: keyof SecuritySettings,
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
      const response = await fetch('/api/admin/security-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details || 'Failed to save security settings'
        );
      }

      const updatedSettings = await response.json();
      setSettings(updatedSettings);

      // Log the security settings change
      await logAuditEvent(
        'security_settings_updated',
        'security_settings',
        null,
        'Security settings were updated',
        'info'
      );

      toast({
        title: 'Success',
        description: 'Security settings saved successfully',
      });
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save security settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const logAuditEvent = async (
    action: string,
    resourceType: string,
    resourceId: string | null,
    description: string,
    severity: string = 'info'
  ) => {
    try {
      await fetch('/api/admin/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          description,
          severity,
        }),
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  };

  const tabs = [
    { id: 'password-policy', label: 'Password Policy', icon: '🔒' },
    { id: 'session-security', label: 'Session Security', icon: '🛡️' },
    { id: 'audit-logging', label: 'Audit Logging', icon: '📋' },
    { id: 'compliance', label: 'Compliance', icon: '⚖️' },
    { id: 'encryption', label: 'Encryption', icon: '🔐' },
    { id: 'access-control', label: 'Access Control', icon: '🚪' },
    { id: 'audit-logs', label: 'Audit Logs', icon: '📊' },
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
            Loading Security Settings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  Security & Compliance
                </h1>
                <p className="mt-1 text-sm text-red-100">
                  Configure advanced security, audit logging, compliance
                  settings, and access controls
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    ? 'border-red-500 text-red-600'
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
        {activeTab === 'password-policy' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Password Policy
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure password requirements and expiration policies for
                enhanced security.
              </p>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Minimum Password Length
                  </label>
                  <input
                    type="number"
                    min="8"
                    max="32"
                    value={formData.password_policy.min_length}
                    onChange={(e) =>
                      handleInputChange(
                        'password_policy',
                        'min_length',
                        parseInt(e.target.value)
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Characters required (8-32)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password Expiry (Days)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="365"
                    value={formData.password_policy.password_expiry_days}
                    onChange={(e) =>
                      handleInputChange(
                        'password_policy',
                        'password_expiry_days',
                        parseInt(e.target.value)
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Days before password expires
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Password Requirements
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    {
                      key: 'require_uppercase',
                      label: 'Require uppercase letters (A-Z)',
                    },
                    {
                      key: 'require_lowercase',
                      label: 'Require lowercase letters (a-z)',
                    },
                    { key: 'require_numbers', label: 'Require numbers (0-9)' },
                    {
                      key: 'require_symbols',
                      label: 'Require symbols (!@#$%^&*)',
                    },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(formData.password_policy as any)[key]}
                        onChange={(e) =>
                          handleInputChange(
                            'password_policy',
                            key,
                            e.target.checked
                          )
                        }
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'session-security' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Session Security
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Control session timeouts, concurrent sessions, and two-factor
                authentication requirements.
              </p>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Session Timeout (Minutes)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="1440"
                    value={formData.session_policy.session_timeout_minutes}
                    onChange={(e) =>
                      handleInputChange(
                        'session_policy',
                        'session_timeout_minutes',
                        parseInt(e.target.value)
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Auto-logout after inactivity
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Max Concurrent Sessions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.session_policy.max_concurrent_sessions}
                    onChange={(e) =>
                      handleInputChange(
                        'session_policy',
                        'max_concurrent_sessions',
                        parseInt(e.target.value)
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Maximum simultaneous logins
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Remember Me Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={formData.session_policy.remember_me_days}
                    onChange={(e) =>
                      handleInputChange(
                        'session_policy',
                        'remember_me_days',
                        parseInt(e.target.value)
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Extended login duration
                  </p>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.session_policy.require_2fa}
                      onChange={(e) =>
                        handleInputChange(
                          'session_policy',
                          'require_2fa',
                          e.target.checked
                        )
                      }
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Require Two-Factor Authentication
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audit-logging' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Audit Logging
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure comprehensive audit logging for security monitoring
                and compliance.
              </p>

              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Log Retention (Days)
                    </label>
                    <input
                      type="number"
                      min="30"
                      max="2555"
                      value={formData.audit_policy.retention_days}
                      onChange={(e) =>
                        handleInputChange(
                          'audit_policy',
                          'retention_days',
                          parseInt(e.target.value)
                        )
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      How long to keep audit logs
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.audit_policy.enable_audit_logging}
                      onChange={(e) =>
                        handleInputChange(
                          'audit_policy',
                          'enable_audit_logging',
                          e.target.checked
                        )
                      }
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Enable comprehensive audit logging
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.audit_policy.log_sensitive_actions}
                      onChange={(e) =>
                        handleInputChange(
                          'audit_policy',
                          'log_sensitive_actions',
                          e.target.checked
                        )
                      }
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Log sensitive actions (password changes, data exports)
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.audit_policy.export_audit_logs}
                      onChange={(e) =>
                        handleInputChange(
                          'audit_policy',
                          'export_audit_logs',
                          e.target.checked
                        )
                      }
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Allow audit log exports for compliance reviews
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Compliance Settings
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure compliance with data protection regulations and
                retention policies.
              </p>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Data Retention (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.compliance_policy.data_retention_years}
                    onChange={(e) =>
                      handleInputChange(
                        'compliance_policy',
                        'data_retention_years',
                        parseInt(e.target.value)
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Years to retain business data
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-medium text-gray-900">
                  Compliance Frameworks
                </h4>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.compliance_policy.gdpr_compliance}
                    onChange={(e) =>
                      handleInputChange(
                        'compliance_policy',
                        'gdpr_compliance',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Enable GDPR compliance features
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.compliance_policy.hipaa_compliance}
                    onChange={(e) =>
                      handleInputChange(
                        'compliance_policy',
                        'hipaa_compliance',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Enable HIPAA compliance features
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={
                      formData.compliance_policy.enable_data_anonymization
                    }
                    onChange={(e) =>
                      handleInputChange(
                        'compliance_policy',
                        'enable_data_anonymization',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Enable automatic data anonymization
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.compliance_policy.require_consent}
                    onChange={(e) =>
                      handleInputChange(
                        'compliance_policy',
                        'require_consent',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Require explicit user consent for data processing
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'encryption' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Encryption Settings
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure data encryption, key rotation, and backup security
                policies.
              </p>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Encryption Algorithm
                  </label>
                  <select
                    value={formData.encryption_policy.encryption_algorithm}
                    onChange={(e) =>
                      handleInputChange(
                        'encryption_policy',
                        'encryption_algorithm',
                        e.target.value
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  >
                    <option value="AES-256">AES-256 (Recommended)</option>
                    <option value="AES-128">AES-128</option>
                    <option value="ChaCha20">ChaCha20</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Key Rotation (Days)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="365"
                    value={formData.encryption_policy.key_rotation_days}
                    onChange={(e) =>
                      handleInputChange(
                        'encryption_policy',
                        'key_rotation_days',
                        parseInt(e.target.value)
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Frequency of encryption key rotation
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.encryption_policy.encrypt_sensitive_data}
                    onChange={(e) =>
                      handleInputChange(
                        'encryption_policy',
                        'encrypt_sensitive_data',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Encrypt sensitive data at rest
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.encryption_policy.backup_encryption}
                    onChange={(e) =>
                      handleInputChange(
                        'encryption_policy',
                        'backup_encryption',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Encrypt backup files
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'access-control' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Access Control
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure API access, rate limiting, and IP whitelisting for
                enhanced security.
              </p>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Rate Limit (Requests/Minute)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={formData.access_policy.max_requests_per_minute}
                    onChange={(e) =>
                      handleInputChange(
                        'access_policy',
                        'max_requests_per_minute',
                        parseInt(e.target.value)
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Maximum API requests per minute
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.access_policy.allow_api_access}
                    onChange={(e) =>
                      handleInputChange(
                        'access_policy',
                        'allow_api_access',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Allow external API access
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.access_policy.rate_limiting_enabled}
                    onChange={(e) =>
                      handleInputChange(
                        'access_policy',
                        'rate_limiting_enabled',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Enable rate limiting
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.access_policy.ip_whitelist_enabled}
                    onChange={(e) =>
                      handleInputChange(
                        'access_policy',
                        'ip_whitelist_enabled',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Enable IP whitelisting
                  </span>
                </label>
              </div>

              {formData.access_policy.ip_whitelist_enabled && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allowed IP Addresses
                  </label>
                  <textarea
                    value={formData.access_policy.allowed_ips.join('\n')}
                    onChange={(e) =>
                      handleArrayChange(
                        'access_policy',
                        'allowed_ips',
                        e.target.value.split('\n').filter((ip) => ip.trim())
                      )
                    }
                    placeholder="192.168.1.1&#10;10.0.0.1&#10;203.0.113.5"
                    rows={4}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    One IP address per line
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'audit-logs' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Audit Logs
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                View security events, user actions, and system activities for
                compliance monitoring.
              </p>

              {logsLoading ? (
                <div className="text-center py-8">
                  <svg
                    className="animate-spin h-8 w-8 text-gray-400 mx-auto"
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
                  <p className="mt-2 text-sm text-gray-500">
                    Loading audit logs...
                  </p>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="h-12 w-12 text-gray-400 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No audit logs
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Audit logging may not be enabled yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {log.action}
                            </h4>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                log.severity === 'critical'
                                  ? 'bg-red-100 text-red-800'
                                  : log.severity === 'error'
                                    ? 'bg-orange-100 text-orange-800'
                                    : log.severity === 'warning'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {log.severity}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">
                            {log.description}
                          </p>
                          <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                            <span>User: {log.user?.email || 'System'}</span>
                            <span>IP: {log.ip_address}</span>
                            <span>
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-4 right-4 z-10">
        <div className="flex space-x-2">
          <a
            href="/admin/settings"
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg"
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
            Basic Settings
          </a>
          <a
            href="/admin/advanced-settings"
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg"
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
            </svg>
            Advanced Settings
          </a>
        </div>
      </div>
    </div>
  );
}
