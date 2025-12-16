'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';
import type { AIEstimateSettings } from '@/types/estimate';

type TabType =
  | 'pricing'
  | 'services'
  | 'ai-behavior'
  | 'business-rules'
  | 'preview';

interface FormErrors {
  [key: string]: string[];
}

const getDefaultSettings = () => ({
  default_profit_margin: 25,
  markup_on_materials: 15,
  markup_on_subcontractors: 10,
  hourly_labor_rate: 25,
  billable_hourly_rate: 75,
  overtime_multiplier: 1.5,
  material_markup_percentage: 20,
  equipment_rental_rate: 50,
  fuel_surcharge_percentage: 5,
  overhead_percentage: 15,
  insurance_percentage: 3,
  administrative_fee: 50,
  permit_fees: 100,
  disposal_fees: 25,
  default_tax_rate: 8.5,
  taxable_labor: true,
  taxable_materials: true,
  minimum_job_size: 500,
  round_to_nearest: 5,
  include_contingency: true,
  contingency_percentage: 10,
  service_rates: {
    painting: {
      labor_rate_per_sqft: 2.5,
      material_cost_per_sqft: 1.25,
      primer_included: true,
    },
    plumbing: {
      hourly_rate: 85,
      trip_fee: 75,
      emergency_multiplier: 2.0,
    },
    electrical: {
      hourly_rate: 90,
      permit_fee: 150,
      inspection_fee: 100,
    },
    hvac: {
      hourly_rate: 95,
      diagnostic_fee: 125,
      refrigerant_cost_per_lb: 15,
    },
    general: {
      hourly_rate: 75,
      minimum_charge: 150,
    },
  },
  ai_behavior: {
    historical_data_weight: 0.5,
    confidence_threshold: 0.8,
    risk_strategy: 'balanced' as const,
    image_analysis_detail: 'medium' as const,
    require_human_review_above_value: 5000,
    auto_approve_confidence: 0.9,
  },
});

export default function AdvancedAISettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('pricing');
  const [settings, setSettings] = useState<AIEstimateSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [testingScenario, setTestingScenario] = useState<string | null>(null);

  // Form state with defaults
  const [formData, setFormData] =
    useState<Omit<AIEstimateSettings, 'id' | 'created_at' | 'updated_at'>>(
      getDefaultSettings()
    );

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/ai-estimator/settings');
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }
      const currentSettings = await response.json();
      setSettings(currentSettings);
      setFormData({
        user_id: currentSettings.user_id,
        default_profit_margin: currentSettings.default_profit_margin,
        markup_on_materials: currentSettings.markup_on_materials,
        markup_on_subcontractors: currentSettings.markup_on_subcontractors,
        hourly_labor_rate: currentSettings.hourly_labor_rate,
        billable_hourly_rate: currentSettings.billable_hourly_rate,
        overtime_multiplier: currentSettings.overtime_multiplier,
        material_markup_percentage: currentSettings.material_markup_percentage,
        equipment_rental_rate: currentSettings.equipment_rental_rate,
        fuel_surcharge_percentage: currentSettings.fuel_surcharge_percentage,
        overhead_percentage: currentSettings.overhead_percentage,
        insurance_percentage: currentSettings.insurance_percentage,
        administrative_fee: currentSettings.administrative_fee,
        permit_fees: currentSettings.permit_fees,
        disposal_fees: currentSettings.disposal_fees,
        default_tax_rate: currentSettings.default_tax_rate,
        taxable_labor: currentSettings.taxable_labor,
        taxable_materials: currentSettings.taxable_materials,
        minimum_job_size: currentSettings.minimum_job_size,
        round_to_nearest: currentSettings.round_to_nearest,
        include_contingency: currentSettings.include_contingency,
        contingency_percentage: currentSettings.contingency_percentage,
        service_rates: currentSettings.service_rates,
        ai_behavior:
          currentSettings.ai_behavior || getDefaultSettings().ai_behavior,
      });
    } catch (error) {
      console.error('Failed to load AI settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load AI estimator settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: [] }));
    }
  };

  const handleServiceRateChange = (
    service: string,
    field: string,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      service_rates: {
        ...prev.service_rates,
        [service]: {
          ...prev.service_rates[service as keyof typeof prev.service_rates],
          [field]: value,
        },
      },
    }));
    setHasChanges(true);
  };

  const handleAIBehaviorChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      ai_behavior: {
        ...prev.ai_behavior!,
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const validateForm = (): boolean => {
    const validationErrors: FormErrors = { general: [] };

    if (
      formData.default_profit_margin < 0 ||
      formData.default_profit_margin > 100
    ) {
      validationErrors.general.push('Profit margin must be between 0 and 100');
    }

    if (formData.hourly_labor_rate <= 0) {
      validationErrors.general.push('Hourly labor rate must be greater than 0');
    }

    if (formData.billable_hourly_rate <= 0) {
      validationErrors.general.push(
        'Billable hourly rate must be greater than 0'
      );
    }

    if (validationErrors.general.length > 0) {
      setErrors(validationErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before saving',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/ai-estimator/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to save settings');
      }

      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      setHasChanges(false);

      toast({
        title: 'Success',
        description: 'AI estimator settings saved successfully',
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save AI estimator settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all settings to defaults? This will overwrite your current configuration.'
    );

    if (!confirmed) return;

    try {
      const defaultSettings = getDefaultSettings();
      setFormData(defaultSettings);
      setHasChanges(true);

      toast({
        title: 'Settings Reset',
        description:
          'All settings have been reset to defaults. Save to apply changes.',
      });
    } catch (error) {
      console.error('Failed to reset settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset settings',
        variant: 'destructive',
      });
    }
  };

  const handleTestEstimate = async (scenario: string) => {
    try {
      setTestingScenario(scenario);
      const response = await fetch('/api/admin/ai-estimator/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });

      if (!response.ok) {
        throw new Error('Test failed');
      }

      const result = await response.json();

      toast({
        title: 'Test Completed',
        description: `Generated ${result.result.line_items.length} line items with total $${result.result.total}`,
      });
    } catch (error) {
      console.error('Test failed:', error);
      toast({
        title: 'Test Failed',
        description: 'Unable to generate test estimate',
        variant: 'destructive',
      });
    } finally {
      setTestingScenario(null);
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
            Loading AI Settings...
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'pricing', label: 'Pricing & Profit', icon: '💰' },
    { id: 'services', label: 'Service Rates', icon: '🔧' },
    { id: 'ai-behavior', label: 'AI Behavior', icon: '🤖' },
    { id: 'business-rules', label: 'Business Rules', icon: '📋' },
    { id: 'preview', label: 'Preview & Test', icon: '👁️' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  AI Estimator Settings
                </h1>
                <p className="mt-1 text-sm text-emerald-100">
                  Configure AI-powered estimate generation with advanced pricing
                  and business rules
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center px-4 py-2 border border-white text-sm font-medium rounded-md text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Reset to Defaults
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-emerald-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert for unsaved changes */}
      {hasChanges && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You have unsaved changes. Click "Save Changes" to apply your
                settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.general && errors.general.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Validation Errors
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {errors.general.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
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
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Pricing & Profit Settings
              </h3>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Default Profit Margin (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.default_profit_margin}
                    onChange={(e) =>
                      handleInputChange(
                        'default_profit_margin',
                        parseFloat(e.target.value)
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Percentage added to total costs
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Material Markup (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    step="0.1"
                    value={formData.material_markup_percentage}
                    onChange={(e) =>
                      handleInputChange(
                        'material_markup_percentage',
                        parseFloat(e.target.value)
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Markup on material costs
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Hourly Labor Rate ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.hourly_labor_rate}
                    onChange={(e) =>
                      handleInputChange(
                        'hourly_labor_rate',
                        parseFloat(e.target.value)
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    What you pay employees
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Billable Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.billable_hourly_rate}
                    onChange={(e) =>
                      handleInputChange(
                        'billable_hourly_rate',
                        parseFloat(e.target.value)
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    What you charge clients
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Overtime Multiplier
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={formData.overtime_multiplier}
                    onChange={(e) =>
                      handleInputChange(
                        'overtime_multiplier',
                        parseFloat(e.target.value)
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Time-and-a-half = 1.5
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Equipment Rental Rate ($/hour)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.equipment_rental_rate}
                    onChange={(e) =>
                      handleInputChange(
                        'equipment_rental_rate',
                        parseFloat(e.target.value)
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Hourly equipment cost
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Overhead Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.overhead_percentage}
                    onChange={(e) =>
                      handleInputChange(
                        'overhead_percentage',
                        parseFloat(e.target.value)
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Business overhead costs
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Insurance Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    value={formData.insurance_percentage}
                    onChange={(e) =>
                      handleInputChange(
                        'insurance_percentage',
                        parseFloat(e.target.value)
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">Insurance costs</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Default Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.01"
                    value={formData.default_tax_rate}
                    onChange={(e) =>
                      handleInputChange(
                        'default_tax_rate',
                        parseFloat(e.target.value)
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">Sales tax rate</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Service-Specific Rates
              </h3>

              <div className="grid grid-cols-1 gap-8">
                {/* Painting Services */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    🎨 Painting Services
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Labor Rate per Sqft ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          formData.service_rates.painting.labor_rate_per_sqft
                        }
                        onChange={(e) =>
                          handleServiceRateChange(
                            'painting',
                            'labor_rate_per_sqft',
                            parseFloat(e.target.value)
                          )
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Material Cost per Sqft ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          formData.service_rates.painting.material_cost_per_sqft
                        }
                        onChange={(e) =>
                          handleServiceRateChange(
                            'painting',
                            'material_cost_per_sqft',
                            parseFloat(e.target.value)
                          )
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={
                            formData.service_rates.painting.primer_included
                          }
                          onChange={(e) =>
                            handleServiceRateChange(
                              'painting',
                              'primer_included',
                              e.target.checked
                            )
                          }
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Primer Included
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Plumbing Services */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    🔧 Plumbing Services
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Hourly Rate ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.service_rates.plumbing.hourly_rate}
                        onChange={(e) =>
                          handleServiceRateChange(
                            'plumbing',
                            'hourly_rate',
                            parseFloat(e.target.value)
                          )
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Trip Fee ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.service_rates.plumbing.trip_fee}
                        onChange={(e) =>
                          handleServiceRateChange(
                            'plumbing',
                            'trip_fee',
                            parseFloat(e.target.value)
                          )
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Emergency Multiplier
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        step="0.1"
                        value={
                          formData.service_rates.plumbing.emergency_multiplier
                        }
                        onChange={(e) =>
                          handleServiceRateChange(
                            'plumbing',
                            'emergency_multiplier',
                            parseFloat(e.target.value)
                          )
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Electrical Services */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    ⚡ Electrical Services
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Hourly Rate ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.service_rates.electrical.hourly_rate}
                        onChange={(e) =>
                          handleServiceRateChange(
                            'electrical',
                            'hourly_rate',
                            parseFloat(e.target.value)
                          )
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Permit Fee ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.service_rates.electrical.permit_fee}
                        onChange={(e) =>
                          handleServiceRateChange(
                            'electrical',
                            'permit_fee',
                            parseFloat(e.target.value)
                          )
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Inspection Fee ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.service_rates.electrical.inspection_fee}
                        onChange={(e) =>
                          handleServiceRateChange(
                            'electrical',
                            'inspection_fee',
                            parseFloat(e.target.value)
                          )
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* HVAC Services */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    ❄️ HVAC Services
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Hourly Rate ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.service_rates.hvac.hourly_rate}
                        onChange={(e) =>
                          handleServiceRateChange(
                            'hvac',
                            'hourly_rate',
                            parseFloat(e.target.value)
                          )
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Diagnostic Fee ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.service_rates.hvac.diagnostic_fee}
                        onChange={(e) =>
                          handleServiceRateChange(
                            'hvac',
                            'diagnostic_fee',
                            parseFloat(e.target.value)
                          )
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Refrigerant Cost per LB ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          formData.service_rates.hvac.refrigerant_cost_per_lb
                        }
                        onChange={(e) =>
                          handleServiceRateChange(
                            'hvac',
                            'refrigerant_cost_per_lb',
                            parseFloat(e.target.value)
                          )
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* General Services */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    🔨 General Services
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Hourly Rate ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.service_rates.general.hourly_rate}
                        onChange={(e) =>
                          handleServiceRateChange(
                            'general',
                            'hourly_rate',
                            parseFloat(e.target.value)
                          )
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Minimum Charge ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.service_rates.general.minimum_charge}
                        onChange={(e) =>
                          handleServiceRateChange(
                            'general',
                            'minimum_charge',
                            parseFloat(e.target.value)
                          )
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai-behavior' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                AI Behavior Settings
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure how the AI analyzes requests and generates estimates
              </p>

              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Historical Data Weight
                    </label>
                    <select
                      value={
                        formData.ai_behavior?.historical_data_weight || 0.5
                      }
                      onChange={(e) =>
                        handleAIBehaviorChange(
                          'historical_data_weight',
                          parseFloat(e.target.value)
                        )
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    >
                      <option value="0.1">Low (10%)</option>
                      <option value="0.3">Low-Medium (30%)</option>
                      <option value="0.5">Medium (50%)</option>
                      <option value="0.7">High (70%)</option>
                      <option value="0.9">Very High (90%)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      How much to weight past job data vs defaults
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Confidence Threshold
                    </label>
                    <select
                      value={formData.ai_behavior?.confidence_threshold || 0.8}
                      onChange={(e) =>
                        handleAIBehaviorChange(
                          'confidence_threshold',
                          parseFloat(e.target.value)
                        )
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    >
                      <option value="0.7">70% - Standard</option>
                      <option value="0.8">80% - Conservative</option>
                      <option value="0.9">90% - Very Conservative</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Minimum confidence to auto-accept AI suggestions
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Risk Strategy
                    </label>
                    <select
                      value={formData.ai_behavior?.risk_strategy || 'balanced'}
                      onChange={(e) =>
                        handleAIBehaviorChange('risk_strategy', e.target.value)
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    >
                      <option value="conservative">
                        Conservative - Higher prices, more contingencies
                      </option>
                      <option value="balanced">
                        Balanced - Market competitive pricing
                      </option>
                      <option value="aggressive">
                        Aggressive - Lower prices, higher volume
                      </option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Overall pricing approach
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Image Analysis Detail
                    </label>
                    <select
                      value={
                        formData.ai_behavior?.image_analysis_detail || 'medium'
                      }
                      onChange={(e) =>
                        handleAIBehaviorChange(
                          'image_analysis_detail',
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    >
                      <option value="low">Low - Basic analysis</option>
                      <option value="medium">Medium - Standard detail</option>
                      <option value="high">High - Maximum detail</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Level of detail in image processing
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Human Review Threshold ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={
                        formData.ai_behavior
                          ?.require_human_review_above_value || 5000
                      }
                      onChange={(e) =>
                        handleAIBehaviorChange(
                          'require_human_review_above_value',
                          parseFloat(e.target.value)
                        )
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Estimates above this value require manual review
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Auto-Approve Confidence
                    </label>
                    <select
                      value={
                        formData.ai_behavior?.auto_approve_confidence || 0.9
                      }
                      onChange={(e) =>
                        handleAIBehaviorChange(
                          'auto_approve_confidence',
                          parseFloat(e.target.value)
                        )
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    >
                      <option value="0.8">80% - Auto-approve</option>
                      <option value="0.85">85% - High confidence</option>
                      <option value="0.9">90% - Very high confidence</option>
                      <option value="0.95">95% - Maximum confidence</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Confidence level for automatic approval
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'business-rules' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Business Rules & Fees
              </h3>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Administrative Fee ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.administrative_fee}
                    onChange={(e) =>
                      handleInputChange(
                        'administrative_fee',
                        parseFloat(e.target.value)
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Flat admin fee per job
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Permit Fees ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.permit_fees}
                    onChange={(e) =>
                      handleInputChange(
                        'permit_fees',
                        parseFloat(e.target.value)
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Estimated permit costs
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Disposal Fees ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.disposal_fees}
                    onChange={(e) =>
                      handleInputChange(
                        'disposal_fees',
                        parseFloat(e.target.value)
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Waste disposal costs
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Minimum Job Size ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minimum_job_size}
                    onChange={(e) =>
                      handleInputChange(
                        'minimum_job_size',
                        parseFloat(e.target.value)
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum total before profit margin
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Round to Nearest ($)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.round_to_nearest}
                    onChange={(e) =>
                      handleInputChange(
                        'round_to_nearest',
                        parseFloat(e.target.value)
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Round totals to nearest dollar amount
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fuel Surcharge (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    value={formData.fuel_surcharge_percentage}
                    onChange={(e) =>
                      handleInputChange(
                        'fuel_surcharge_percentage',
                        parseFloat(e.target.value)
                      )
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Transportation fuel costs
                  </p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Tax Settings</h4>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.taxable_labor}
                      onChange={(e) =>
                        handleInputChange('taxable_labor', e.target.checked)
                      }
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Taxable Labor
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.taxable_materials}
                      onChange={(e) =>
                        handleInputChange('taxable_materials', e.target.checked)
                      }
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Taxable Materials
                    </span>
                  </label>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Contingency Settings
                  </h4>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.include_contingency}
                      onChange={(e) =>
                        handleInputChange(
                          'include_contingency',
                          e.target.checked
                        )
                      }
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Include Contingency
                    </span>
                  </label>

                  {formData.include_contingency && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Contingency Percentage (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        step="0.1"
                        value={formData.contingency_percentage}
                        onChange={(e) =>
                          handleInputChange(
                            'contingency_percentage',
                            parseFloat(e.target.value)
                          )
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Settings Preview
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Review your current configuration and test with sample scenarios
              </p>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Current Settings Summary
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Profit Margin:</span>
                      <span className="font-medium">
                        {formData.default_profit_margin}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Labor Rate:</span>
                      <span className="font-medium">
                        ${formData.hourly_labor_rate}/hr
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Billable Rate:</span>
                      <span className="font-medium">
                        ${formData.billable_hourly_rate}/hr
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Material Markup:</span>
                      <span className="font-medium">
                        {formData.material_markup_percentage}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Overhead:</span>
                      <span className="font-medium">
                        {formData.overhead_percentage}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax Rate:</span>
                      <span className="font-medium">
                        {formData.default_tax_rate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risk Strategy:</span>
                      <span className="font-medium capitalize">
                        {formData.ai_behavior?.risk_strategy || 'balanced'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Historical Weight:</span>
                      <span className="font-medium">
                        {Math.round(
                          (formData.ai_behavior?.historical_data_weight ||
                            0.5) * 100
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Test Scenarios
                  </h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleTestEstimate('small-painting')}
                      disabled={testingScenario === 'small-painting'}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-emerald-600 text-sm font-medium rounded-md text-emerald-600 bg-white hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                    >
                      {testingScenario === 'small-painting' ? (
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
                          Testing...
                        </>
                      ) : (
                        <>🎨 Test Small Painting Job</>
                      )}
                    </button>
                    <button
                      onClick={() => handleTestEstimate('plumbing-emergency')}
                      disabled={testingScenario === 'plumbing-emergency'}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-emerald-600 text-sm font-medium rounded-md text-emerald-600 bg-white hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                    >
                      {testingScenario === 'plumbing-emergency' ? (
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
                          Testing...
                        </>
                      ) : (
                        <>🔧 Test Plumbing Emergency</>
                      )}
                    </button>
                    <button
                      onClick={() => handleTestEstimate('electrical-outlet')}
                      disabled={testingScenario === 'electrical-outlet'}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-emerald-600 text-sm font-medium rounded-md text-emerald-600 bg-white hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                    >
                      {testingScenario === 'electrical-outlet' ? (
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
                          Testing...
                        </>
                      ) : (
                        <>⚡ Test Electrical Work</>
                      )}
                    </button>
                    <button
                      onClick={() => handleTestEstimate('hvac-maintenance')}
                      disabled={testingScenario === 'hvac-maintenance'}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-emerald-600 text-sm font-medium rounded-md text-emerald-600 bg-white hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                    >
                      {testingScenario === 'hvac-maintenance' ? (
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
                          Testing...
                        </>
                      ) : (
                        <>❄️ Test HVAC Maintenance</>
                      )}
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-gray-500 text-center">
                    Click to generate sample estimates with current settings
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-center space-x-4">
          <a
            href="/admin/settings"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <svg
              className="mr-2 -ml-1 w-4 h-4"
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
            Back to Basic Settings
          </a>
          <a
            href="/admin/advanced-settings"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <svg
              className="mr-2 -ml-1 w-4 h-4"
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Advanced Settings Hub
          </a>
        </div>
      </div>
    </div>
  );
}
