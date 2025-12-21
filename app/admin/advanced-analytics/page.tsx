'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';

type TabType =
  | 'custom-reports'
  | 'predictive-modeling'
  | 'kpi-tracking'
  | 'business-intelligence'
  | 'performance-metrics';

interface AnalyticsSettings {
  custom_reports: {
    enabled: boolean;
    auto_generate: boolean;
    report_frequency: string;
    include_charts: boolean;
    export_formats: string[];
  };
  predictive_modeling: {
    enabled: boolean;
    demand_forecasting: boolean;
    revenue_prediction: boolean;
    customer_churn_analysis: boolean;
    seasonal_trends: boolean;
  };
  kpi_tracking: {
    enabled: boolean;
    track_revenue: boolean;
    track_customer_satisfaction: boolean;
    track_job_completion: boolean;
    track_technician_performance: boolean;
    custom_kpis: string[];
  };
  business_intelligence: {
    enabled: boolean;
    real_time_dashboards: boolean;
    advanced_filters: boolean;
    data_visualization: boolean;
    comparative_analysis: boolean;
  };
  performance_metrics: {
    enabled: boolean;
    profitability_analysis: boolean;
    efficiency_metrics: boolean;
    quality_assurance: boolean;
    trend_analysis: boolean;
  };
}

export default function AdvancedAnalyticsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('custom-reports');
  const [settings, setSettings] = useState<AnalyticsSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<AnalyticsSettings>({
    custom_reports: {
      enabled: true,
      auto_generate: true,
      report_frequency: 'weekly',
      include_charts: true,
      export_formats: ['pdf', 'excel'],
    },
    predictive_modeling: {
      enabled: false,
      demand_forecasting: false,
      revenue_prediction: false,
      customer_churn_analysis: false,
      seasonal_trends: false,
    },
    kpi_tracking: {
      enabled: true,
      track_revenue: true,
      track_customer_satisfaction: true,
      track_job_completion: true,
      track_technician_performance: true,
      custom_kpis: [],
    },
    business_intelligence: {
      enabled: true,
      real_time_dashboards: true,
      advanced_filters: true,
      data_visualization: true,
      comparative_analysis: true,
    },
    performance_metrics: {
      enabled: true,
      profitability_analysis: true,
      efficiency_metrics: true,
      quality_assurance: true,
      trend_analysis: true,
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/analytics');
      if (!response.ok) {
        throw new Error('Failed to load analytics settings');
      }
      const currentSettings = await response.json();
      setSettings(currentSettings);
      setFormData(currentSettings);
    } catch (error) {
      console.error('Failed to load analytics settings:', error);
      toast({
        title: 'Warning',
        description:
          'Using default analytics settings. Some features may not be available.',
        variant: 'default',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    section: keyof AnalyticsSettings,
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
    section: keyof AnalyticsSettings,
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
      const response = await fetch('/api/admin/analytics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details || 'Failed to save analytics settings'
        );
      }

      const updatedSettings = await response.json();
      setSettings(updatedSettings);

      toast({
        title: 'Success',
        description: 'Analytics settings saved successfully',
      });
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save analytics settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'custom-reports', label: 'Custom Reports', icon: '📊' },
    { id: 'predictive-modeling', label: 'Predictive Modeling', icon: '🔮' },
    { id: 'kpi-tracking', label: 'KPI Tracking', icon: '📈' },
    { id: 'business-intelligence', label: 'Business Intelligence', icon: '🧠' },
    { id: 'performance-metrics', label: 'Performance Metrics', icon: '⚡' },
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
            Loading Analytics Settings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  Advanced Analytics
                </h1>
                <p className="mt-1 text-sm text-purple-100">
                  Deep-dive analytics with custom reports, predictive modeling,
                  and business intelligence dashboards.
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-purple-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    ? 'border-purple-500 text-purple-600'
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
        {activeTab === 'custom-reports' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Custom Reports
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure automated report generation with customizable
                schedules, formats, and content options for comprehensive
                business insights.
              </p>

              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Report Generation Frequency
                    </label>
                    <select
                      value={formData.custom_reports.report_frequency}
                      onChange={(e) =>
                        handleInputChange(
                          'custom_reports',
                          'report_frequency',
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.custom_reports.enabled}
                      onChange={(e) =>
                        handleInputChange(
                          'custom_reports',
                          'enabled',
                          e.target.checked
                        )
                      }
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Enable custom report generation
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.custom_reports.auto_generate}
                      onChange={(e) =>
                        handleInputChange(
                          'custom_reports',
                          'auto_generate',
                          e.target.checked
                        )
                      }
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Automatically generate reports on schedule
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.custom_reports.include_charts}
                      onChange={(e) =>
                        handleInputChange(
                          'custom_reports',
                          'include_charts',
                          e.target.checked
                        )
                      }
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Include charts and visualizations in reports
                    </span>
                  </label>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Export Formats
                  </h4>
                  <div className="space-y-2">
                    {['pdf', 'excel', 'csv', 'json'].map((format) => (
                      <label key={format} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.custom_reports.export_formats.includes(
                            format
                          )}
                          onChange={(e) => {
                            const current =
                              formData.custom_reports.export_formats;
                            const updated = e.target.checked
                              ? [...current, format]
                              : current.filter((f) => f !== format);
                            handleArrayChange(
                              'custom_reports',
                              'export_formats',
                              updated
                            );
                          }}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">
                          {format}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'predictive-modeling' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Predictive Modeling
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Enable AI-powered predictive analytics for demand forecasting,
                revenue prediction, and customer behavior analysis.
              </p>

              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.predictive_modeling.enabled}
                    onChange={(e) =>
                      handleInputChange(
                        'predictive_modeling',
                        'enabled',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Enable predictive modeling features
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.predictive_modeling.demand_forecasting}
                    onChange={(e) =>
                      handleInputChange(
                        'predictive_modeling',
                        'demand_forecasting',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Demand forecasting for service scheduling
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.predictive_modeling.revenue_prediction}
                    onChange={(e) =>
                      handleInputChange(
                        'predictive_modeling',
                        'revenue_prediction',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Revenue prediction and financial forecasting
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={
                      formData.predictive_modeling.customer_churn_analysis
                    }
                    onChange={(e) =>
                      handleInputChange(
                        'predictive_modeling',
                        'customer_churn_analysis',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Customer churn analysis and retention predictions
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.predictive_modeling.seasonal_trends}
                    onChange={(e) =>
                      handleInputChange(
                        'predictive_modeling',
                        'seasonal_trends',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Seasonal trend analysis and forecasting
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'kpi-tracking' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                KPI Tracking
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure key performance indicators for comprehensive business
                metrics tracking and monitoring.
              </p>

              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.kpi_tracking.enabled}
                    onChange={(e) =>
                      handleInputChange(
                        'kpi_tracking',
                        'enabled',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Enable KPI tracking and monitoring
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.kpi_tracking.track_revenue}
                    onChange={(e) =>
                      handleInputChange(
                        'kpi_tracking',
                        'track_revenue',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Track revenue metrics and growth
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.kpi_tracking.track_customer_satisfaction}
                    onChange={(e) =>
                      handleInputChange(
                        'kpi_tracking',
                        'track_customer_satisfaction',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Monitor customer satisfaction scores
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.kpi_tracking.track_job_completion}
                    onChange={(e) =>
                      handleInputChange(
                        'kpi_tracking',
                        'track_job_completion',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Track job completion rates and efficiency
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.kpi_tracking.track_technician_performance}
                    onChange={(e) =>
                      handleInputChange(
                        'kpi_tracking',
                        'track_technician_performance',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Monitor technician performance metrics
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'business-intelligence' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Business Intelligence
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure advanced business intelligence features including
                real-time dashboards, data visualization, and comparative
                analysis tools.
              </p>

              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.business_intelligence.enabled}
                    onChange={(e) =>
                      handleInputChange(
                        'business_intelligence',
                        'enabled',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Enable business intelligence features
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={
                      formData.business_intelligence.real_time_dashboards
                    }
                    onChange={(e) =>
                      handleInputChange(
                        'business_intelligence',
                        'real_time_dashboards',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Real-time dashboards and live data updates
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.business_intelligence.advanced_filters}
                    onChange={(e) =>
                      handleInputChange(
                        'business_intelligence',
                        'advanced_filters',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Advanced filtering and data segmentation
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.business_intelligence.data_visualization}
                    onChange={(e) =>
                      handleInputChange(
                        'business_intelligence',
                        'data_visualization',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Interactive data visualization and charts
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={
                      formData.business_intelligence.comparative_analysis
                    }
                    onChange={(e) =>
                      handleInputChange(
                        'business_intelligence',
                        'comparative_analysis',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Comparative analysis and benchmarking tools
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance-metrics' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Performance Metrics
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure comprehensive performance tracking including
                profitability analysis, efficiency metrics, and quality
                assurance monitoring.
              </p>

              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.performance_metrics.enabled}
                    onChange={(e) =>
                      handleInputChange(
                        'performance_metrics',
                        'enabled',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Enable performance metrics tracking
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={
                      formData.performance_metrics.profitability_analysis
                    }
                    onChange={(e) =>
                      handleInputChange(
                        'performance_metrics',
                        'profitability_analysis',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Profitability analysis by job type and service
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.performance_metrics.efficiency_metrics}
                    onChange={(e) =>
                      handleInputChange(
                        'performance_metrics',
                        'efficiency_metrics',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Efficiency metrics and productivity tracking
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.performance_metrics.quality_assurance}
                    onChange={(e) =>
                      handleInputChange(
                        'performance_metrics',
                        'quality_assurance',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Quality assurance and service standards monitoring
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.performance_metrics.trend_analysis}
                    onChange={(e) =>
                      handleInputChange(
                        'performance_metrics',
                        'trend_analysis',
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Trend analysis and performance forecasting
                  </span>
                </label>
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
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-lg"
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
