'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import {
  generateAIEstimate,
  getDefaultAIEstimateSettings,
} from '@/lib/ai/estimate-generation';
import { getAIEstimateSettings } from '@/lib/db/ai-estimate-settings';
import type {
  AIEstimateRequest,
  AIEstimateResult,
  AIEstimateSettings,
} from '@/types/estimate';
import { createEstimate } from '@/lib/db/estimates';
import {
  Sparkles,
  Upload,
  X,
  Loader2,
  Settings,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  DollarSign,
  Clock,
} from 'lucide-react';

interface AIImagePreview {
  file: File;
  preview: string;
  id: string;
}

interface AIEstimateGeneratorProps {
  onEstimateCreated?: (estimate: any) => void;
  clientId?: string;
  leadId?: string;
}

export default function AIEstimateGenerator({
  onEstimateCreated,
  clientId,
  leadId,
}: AIEstimateGeneratorProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEstimate, setGeneratedEstimate] =
    useState<AIEstimateResult | null>(null);
  const [images, setImages] = useState<AIImagePreview[]>([]);
  const [settings, setSettings] = useState<AIEstimateSettings | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<AIEstimateRequest>({
    description: '',
    service_type: 'general',
    images: [],
    property_details: {
      square_footage: undefined,
      stories: undefined,
      age: undefined,
      condition: 'good',
    },
    urgency: 'normal',
    client_budget: undefined,
    location: '',
    special_requirements: [],
  });

  const loadSettings = async () => {
    try {
      const userSettings = await getAIEstimateSettings();
      setSettings(userSettings);
    } catch (error) {
      console.error('Failed to load AI settings:', error);
      setSettings({
        ...getDefaultAIEstimateSettings(),
        id: 'default',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = e.target?.result as string;
          const imagePreview: AIImagePreview = {
            file,
            preview,
            id: `img-${Date.now()}-${i}`,
          };
          setImages((prev) => [...prev, imagePreview]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleGenerateEstimate = async () => {
    if (!formData.description.trim()) {
      toast({
        title: 'Description Required',
        description: 'Please provide a description of the work needed.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      if (!settings) {
        await loadSettings();
      }

      const imageUrls = images.map((img) => img.preview);

      const request: AIEstimateRequest = {
        ...formData,
        images: imageUrls,
      };

      const result = await generateAIEstimate({
        settings: settings || {
          ...getDefaultAIEstimateSettings(),
          id: 'default',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        request,
        useVision: imageUrls.length > 0,
      });

      setGeneratedEstimate(result);

      toast({
        title: 'Estimate Generated',
        description:
          'AI has successfully generated an estimate based on your inputs.',
      });
    } catch (error) {
      console.error('Failed to generate estimate:', error);
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate AI estimate. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEstimate = async () => {
    if (!generatedEstimate) return;

    try {
      const estimateData = {
        title: `AI Generated - ${formData.service_type.charAt(0).toUpperCase() + formData.service_type.slice(1)}`,
        description: formData.description,
        client_id: clientId,
        lead_id: leadId,
        status: 'draft' as const,
        line_items: generatedEstimate.line_items,
        subtotal: generatedEstimate.subtotal,
        tax_rate: generatedEstimate.applied_settings.taxes,
        tax_amount: generatedEstimate.breakdown.taxes,
        discount_amount: 0,
        total: generatedEstimate.total,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        payment_terms: 'Net 30',
        terms_and_conditions:
          'Standard terms apply. Estimate valid for 30 days.',
        notes: `AI-generated estimate with ${Math.round(generatedEstimate.analysis.confidence_score * 100)}% confidence. ${generatedEstimate.reasoning}`,
      };

      const savedEstimate = await createEstimate(estimateData);

      toast({
        title: 'Estimate Saved',
        description: 'The AI-generated estimate has been saved successfully.',
      });

      setGeneratedEstimate(null);
      setImages([]);
      setFormData({
        description: '',
        service_type: 'general',
        images: [],
        property_details: {
          square_footage: undefined,
          stories: undefined,
          age: undefined,
          condition: 'good',
        },
        urgency: 'normal',
        client_budget: undefined,
        location: '',
        special_requirements: [],
      });
      setIsOpen(false);

      if (onEstimateCreated) {
        onEstimateCreated(savedEstimate);
      }
    } catch (error) {
      console.error('Failed to save estimate:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save the estimate. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const openGenerator = async () => {
    setIsOpen(true);
    await loadSettings();
  };

  return (
    <>
      <button
        onClick={openGenerator}
        className="px-4 py-2 bg-white text-emerald-700 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        AI Estimate
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl font-bold text-slate-900">
              AI Estimate Generator
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Generate professional estimates using AI analysis
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto flex-1">
            {/* Left Column - Input */}
            <div className="space-y-4">
              {/* Project Details */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Service Type *
                </label>
                <Select
                  value={formData.service_type}
                  onValueChange={(value: any) =>
                    setFormData((prev) => ({ ...prev, service_type: value }))
                  }
                >
                  <SelectTrigger className="border-slate-300 focus:ring-emerald-500 focus:border-emerald-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="painting">Painting</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="hvac">HVAC</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project Description *
                </label>
                <Textarea
                  placeholder="Describe the work needed in detail..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={6}
                  className="border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Urgency
                  </label>
                  <Select
                    value={formData.urgency}
                    onValueChange={(value: any) =>
                      setFormData((prev) => ({ ...prev, urgency: value }))
                    }
                  >
                    <SelectTrigger className="border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Client Budget
                  </label>
                  <Input
                    type="number"
                    placeholder="$0"
                    value={formData.client_budget || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        client_budget: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }))
                    }
                    className="border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Location
                </label>
                <Input
                  placeholder="City, State"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  className="border-slate-300"
                />
              </div>

              {/* Property Details */}
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">
                  Property Details (Optional)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Square Footage
                    </label>
                    <Input
                      type="number"
                      placeholder="sq ft"
                      value={formData.property_details?.square_footage || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          property_details: {
                            ...prev.property_details,
                            square_footage: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          },
                        }))
                      }
                      className="border-slate-300 h-9"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Stories
                    </label>
                    <Input
                      type="number"
                      placeholder="#"
                      value={formData.property_details?.stories || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          property_details: {
                            ...prev.property_details,
                            stories: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          },
                        }))
                      }
                      className="border-slate-300 h-9"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Age (years)
                    </label>
                    <Input
                      type="number"
                      placeholder="years"
                      value={formData.property_details?.age || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          property_details: {
                            ...prev.property_details,
                            age: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          },
                        }))
                      }
                      className="border-slate-300 h-9"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Condition
                    </label>
                    <Select
                      value={formData.property_details?.condition}
                      onValueChange={(value: any) =>
                        setFormData((prev) => ({
                          ...prev,
                          property_details: {
                            ...prev.property_details,
                            condition: value,
                          },
                        }))
                      }
                    >
                      <SelectTrigger className="border-slate-300 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Photo Upload */}
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">
                  Project Photos
                </h4>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors flex flex-col items-center justify-center gap-2 text-slate-600"
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-sm font-medium">Upload photos</span>
                </button>

                {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {images.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.preview}
                          alt="Project"
                          className="w-full h-20 object-cover rounded border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleGenerateEstimate}
                  disabled={isGenerating || !formData.description.trim()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Estimate
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowSettings(true)}
                  className="px-3"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Right Column - Results */}
            <div className="space-y-4">
              {generatedEstimate ? (
                <>
                  {/* Summary */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-emerald-900">
                        Estimate Ready
                      </h3>
                      <Badge className="bg-emerald-600 text-white">
                        {Math.round(
                          generatedEstimate.analysis.confidence_score * 100
                        )}
                        % Confident
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded p-3">
                        <div className="text-xs text-slate-600 mb-1">
                          Service
                        </div>
                        <div className="font-medium text-slate-900 capitalize">
                          {generatedEstimate.analysis.service_type}
                        </div>
                      </div>
                      <div className="bg-white rounded p-3">
                        <div className="text-xs text-slate-600 mb-1">
                          Complexity
                        </div>
                        <div className="font-medium text-slate-900 capitalize">
                          {generatedEstimate.analysis.complexity.replace(
                            '_',
                            ' '
                          )}
                        </div>
                      </div>
                      <div className="bg-white rounded p-3">
                        <div className="text-xs text-slate-600 mb-1">
                          Duration
                        </div>
                        <div className="font-medium text-slate-900">
                          {generatedEstimate.analysis.estimated_duration.days}{' '}
                          days
                        </div>
                      </div>
                      <div className="bg-white rounded p-3">
                        <div className="text-xs text-slate-600 mb-1">Total</div>
                        <div className="font-bold text-emerald-600">
                          ${generatedEstimate.total.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="border border-slate-200 rounded-lg">
                    <div className="border-b border-slate-200 px-4 py-3 bg-slate-50">
                      <h3 className="font-semibold text-slate-900">
                        Line Items
                      </h3>
                    </div>
                    <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                      {generatedEstimate.line_items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-start p-3 border border-slate-200 rounded"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 text-sm">
                              {item.description}
                            </p>
                            <p className="text-xs text-slate-600 mt-1">
                              {item.quantity} × ${item.unit_price.toFixed(2)}
                            </p>
                          </div>
                          <span className="font-semibold text-slate-900">
                            ${item.total.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="border border-slate-200 rounded-lg p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Subtotal</span>
                        <span className="font-medium">
                          ${generatedEstimate.subtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">
                          Tax ({generatedEstimate.applied_settings.taxes}%)
                        </span>
                        <span className="font-medium">
                          ${generatedEstimate.breakdown.taxes.toFixed(2)}
                        </span>
                      </div>
                      <div className="border-t border-slate-200 pt-2 flex justify-between">
                        <span className="font-bold text-slate-900">Total</span>
                        <span className="font-bold text-lg text-emerald-600">
                          ${generatedEstimate.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {generatedEstimate.suggestions.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        Recommendations
                      </h4>
                      <ul className="space-y-1">
                        {generatedEstimate.suggestions.map(
                          (suggestion, index) => (
                            <li
                              key={index}
                              className="text-xs text-yellow-800 flex items-start gap-2"
                            >
                              <span className="text-yellow-600">•</span>
                              <span>{suggestion}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Save Button */}
                  <Button
                    onClick={handleSaveEstimate}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save Estimate
                  </Button>
                </>
              ) : (
                <div className="border border-slate-200 rounded-lg flex items-center justify-center h-full min-h-[500px]">
                  <div className="text-center text-slate-500 p-8">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Estimate Preview
                    </h3>
                    <p className="text-sm text-slate-600">
                      Fill in the details and generate to see your estimate
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Settings</DialogTitle>
            <DialogDescription>
              Configure business rules and pricing
            </DialogDescription>
          </DialogHeader>

          {settings && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Profit Margin (%)
                  </label>
                  <Input
                    type="number"
                    value={settings.default_profit_margin}
                    onChange={(e) =>
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              default_profit_margin: Number(e.target.value),
                            }
                          : null
                      )
                    }
                    className="border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Labor Rate ($/hr)
                  </label>
                  <Input
                    type="number"
                    value={settings.hourly_labor_rate}
                    onChange={(e) =>
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              hourly_labor_rate: Number(e.target.value),
                            }
                          : null
                      )
                    }
                    className="border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Billable Rate ($/hr)
                  </label>
                  <Input
                    type="number"
                    value={settings.billable_hourly_rate}
                    onChange={(e) =>
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              billable_hourly_rate: Number(e.target.value),
                            }
                          : null
                      )
                    }
                    className="border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tax Rate (%)
                  </label>
                  <Input
                    type="number"
                    value={settings.default_tax_rate}
                    onChange={(e) =>
                      setSettings((prev) =>
                        prev
                          ? {
                              ...prev,
                              default_tax_rate: Number(e.target.value),
                            }
                          : null
                      )
                    }
                    className="border-slate-300"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end border-t border-slate-200 pt-4">
            <Button
              onClick={() => setShowSettings(false)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
