'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import type { BusinessSettings } from '@/types/business-settings';
import { Save, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-gray-600 font-medium">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Business Settings</h1>
            <p className="mt-2 text-blue-100">
              Configure your company information and default settings
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) =>
                    handleInputChange('company_name', e.target.value)
                  }
                  placeholder="Your Company Name"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="company_address">Address</Label>
                <Input
                  id="company_address"
                  value={formData.company_address}
                  onChange={(e) =>
                    handleInputChange('company_address', e.target.value)
                  }
                  placeholder="123 Main Street"
                />
              </div>
              <div>
                <Label htmlFor="company_city">City</Label>
                <Input
                  id="company_city"
                  value={formData.company_city}
                  onChange={(e) =>
                    handleInputChange('company_city', e.target.value)
                  }
                  placeholder="Anytown"
                />
              </div>
              <div>
                <Label htmlFor="company_state">State</Label>
                <Input
                  id="company_state"
                  value={formData.company_state}
                  onChange={(e) =>
                    handleInputChange('company_state', e.target.value)
                  }
                  placeholder="ST"
                />
              </div>
              <div>
                <Label htmlFor="company_zip">ZIP Code</Label>
                <Input
                  id="company_zip"
                  value={formData.company_zip}
                  onChange={(e) =>
                    handleInputChange('company_zip', e.target.value)
                  }
                  placeholder="12345"
                />
              </div>
              <div>
                <Label htmlFor="company_phone">Phone</Label>
                <Input
                  id="company_phone"
                  value={formData.company_phone}
                  onChange={(e) =>
                    handleInputChange('company_phone', e.target.value)
                  }
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="company_email">Email</Label>
                <Input
                  id="company_email"
                  value={formData.company_email}
                  onChange={(e) =>
                    handleInputChange('company_email', e.target.value)
                  }
                  placeholder="info@company.com"
                />
              </div>
              <div>
                <Label htmlFor="company_website">Website</Label>
                <Input
                  id="company_website"
                  value={formData.company_website}
                  onChange={(e) =>
                    handleInputChange('company_website', e.target.value)
                  }
                  placeholder="https://www.company.com"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) =>
                    handleInputChange('logo_url', e.target.value)
                  }
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Default Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Default Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="default_estimate_validity_days">
                  Estimate Validity (Days)
                </Label>
                <Input
                  id="default_estimate_validity_days"
                  type="number"
                  min="1"
                  value={formData.default_estimate_validity_days}
                  onChange={(e) =>
                    handleInputChange(
                      'default_estimate_validity_days',
                      parseInt(e.target.value) || 30
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="default_tax_rate">Default Tax Rate (%)</Label>
                <Input
                  id="default_tax_rate"
                  type="number"
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
                />
              </div>
            </div>

            <div>
              <Label htmlFor="default_payment_terms">
                Default Payment Terms
              </Label>
              <Textarea
                id="default_payment_terms"
                value={formData.default_payment_terms}
                onChange={(e) =>
                  handleInputChange('default_payment_terms', e.target.value)
                }
                placeholder="Payment due within 30 days"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Default Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Default Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="default_estimate_terms">
                Default Estimate Terms
              </Label>
              <Textarea
                id="default_estimate_terms"
                value={formData.default_estimate_terms}
                onChange={(e) =>
                  handleInputChange('default_estimate_terms', e.target.value)
                }
                placeholder="Terms that appear on estimates"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="default_invoice_terms">
                Default Invoice Terms
              </Label>
              <Textarea
                id="default_invoice_terms"
                value={formData.default_invoice_terms}
                onChange={(e) =>
                  handleInputChange('default_invoice_terms', e.target.value)
                }
                placeholder="Terms that appear on invoices"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
