'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Calendar,
  Briefcase,
  AlertTriangle,
  Loader2,
  Send,
  Clock,
} from 'lucide-react';

interface EmployeeProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  display_name?: string;
  personal_email?: string;
  work_email?: string;
  primary_phone?: string;
  secondary_phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  job_title?: string;
  department?: string;
  hourly_rate?: number;
  salary?: number;
  pay_frequency: string;
  notes?: string;
}

export default function EmployeeProfileRequestPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state for requested changes
  const [requestedChanges, setRequestedChanges] = useState<
    Partial<EmployeeProfile>
  >({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employee/profile');
      if (!response.ok) {
        throw new Error('Failed to load profile');
      }
      const data = await response.json();
      setProfile(data.profile);
      // Initialize requested changes with current values
      if (data.profile) {
        setRequestedChanges(data.profile);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setRequestedChanges((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitRequest = async () => {
    try {
      setSubmitting(true);
      setError('');

      const response = await fetch('/api/employee/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestedChanges),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      if (data.requiresApproval) {
        router.push('/employee/profile?success=request-submitted');
      } else {
        router.push('/employee/profile?success=updated');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const hasChanges = () => {
    if (!profile) return false;
    return Object.keys(requestedChanges).some(
      (key) =>
        requestedChanges[key as keyof EmployeeProfile] !==
        profile[key as keyof EmployeeProfile]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
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
            Loading Profile...
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No Profile Found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Your profile hasn't been set up yet. Please contact your
              administrator.
            </p>
          </CardContent>
        </Card>
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
                  Request Profile Changes
                </h1>
                <p className="mt-1 text-sm text-blue-100">
                  Submit changes to your profile for admin approval
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="text-white border-white hover:bg-white hover:text-blue-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <Clock className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Approval Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Your changes will be reviewed by an administrator before being
                  applied.
                </p>
                <p>
                  You will be notified once your request is approved or
                  rejected.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={requestedChanges.first_name || ''}
                      onChange={(e) =>
                        handleInputChange('first_name', e.target.value)
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {profile.first_name}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={requestedChanges.last_name || ''}
                      onChange={(e) =>
                        handleInputChange('last_name', e.target.value)
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {profile.last_name}
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="display_name">Display Name (Optional)</Label>
                  <Input
                    id="display_name"
                    value={requestedChanges.display_name || ''}
                    onChange={(e) =>
                      handleInputChange('display_name', e.target.value)
                    }
                    placeholder="How you want to be displayed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {profile.display_name || 'Not set'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Information Tab */}
          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="personal_email">Personal Email</Label>
                  <Input
                    id="personal_email"
                    type="email"
                    value={requestedChanges.personal_email || ''}
                    onChange={(e) =>
                      handleInputChange('personal_email', e.target.value)
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {profile.personal_email || 'Not set'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="primary_phone">Primary Phone</Label>
                  <Input
                    id="primary_phone"
                    value={requestedChanges.primary_phone || ''}
                    onChange={(e) =>
                      handleInputChange('primary_phone', e.target.value)
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {profile.primary_phone || 'Not set'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="secondary_phone">
                    Secondary Phone (Optional)
                  </Label>
                  <Input
                    id="secondary_phone"
                    value={requestedChanges.secondary_phone || ''}
                    onChange={(e) =>
                      handleInputChange('secondary_phone', e.target.value)
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {profile.secondary_phone || 'Not set'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address_line1">Address Line 1</Label>
                  <Input
                    id="address_line1"
                    value={requestedChanges.address_line1 || ''}
                    onChange={(e) =>
                      handleInputChange('address_line1', e.target.value)
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {profile.address_line1 || 'Not set'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="address_line2">
                    Address Line 2 (Optional)
                  </Label>
                  <Input
                    id="address_line2"
                    value={requestedChanges.address_line2 || ''}
                    onChange={(e) =>
                      handleInputChange('address_line2', e.target.value)
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {profile.address_line2 || 'Not set'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={requestedChanges.city || ''}
                      onChange={(e) =>
                        handleInputChange('city', e.target.value)
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {profile.city || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={requestedChanges.state || ''}
                      onChange={(e) =>
                        handleInputChange('state', e.target.value)
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {profile.state || 'Not set'}
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    value={requestedChanges.zip_code || ''}
                    onChange={(e) =>
                      handleInputChange('zip_code', e.target.value)
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {profile.zip_code || 'Not set'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employment Tab */}
          <TabsContent value="employment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Employment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="job_title">Job Title</Label>
                    <Input
                      id="job_title"
                      value={requestedChanges.job_title || ''}
                      onChange={(e) =>
                        handleInputChange('job_title', e.target.value)
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {profile.job_title || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={requestedChanges.department || ''}
                      onChange={(e) =>
                        handleInputChange('department', e.target.value)
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {profile.department || 'Not set'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Compensation (Admin Approval Required)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-orange-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-orange-800">
                        Pay Rate Changes Require Approval
                      </h3>
                      <div className="mt-2 text-sm text-orange-700">
                        <p>
                          Any changes to compensation will need to be reviewed
                          and approved by an administrator.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hourly_rate">Hourly Rate</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      step="0.01"
                      value={requestedChanges.hourly_rate || ''}
                      onChange={(e) =>
                        handleInputChange(
                          'hourly_rate',
                          parseFloat(e.target.value) || undefined
                        )
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Current: ${profile.hourly_rate || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="salary">Annual Salary</Label>
                    <Input
                      id="salary"
                      type="number"
                      step="1000"
                      value={requestedChanges.salary || ''}
                      onChange={(e) =>
                        handleInputChange(
                          'salary',
                          parseFloat(e.target.value) || undefined
                        )
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Current: ${profile.salary?.toLocaleString() || 'Not set'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Emergency Contact Tab */}
          <TabsContent value="emergency" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="emergency_contact_name">Contact Name</Label>
                    <Input
                      id="emergency_contact_name"
                      value={requestedChanges.emergency_contact_name || ''}
                      onChange={(e) =>
                        handleInputChange(
                          'emergency_contact_name',
                          e.target.value
                        )
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {profile.emergency_contact_name || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="emergency_contact_phone">
                      Contact Phone
                    </Label>
                    <Input
                      id="emergency_contact_phone"
                      value={requestedChanges.emergency_contact_phone || ''}
                      onChange={(e) =>
                        handleInputChange(
                          'emergency_contact_phone',
                          e.target.value
                        )
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {profile.emergency_contact_phone || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="emergency_contact_relationship">
                      Relationship
                    </Label>
                    <Input
                      id="emergency_contact_relationship"
                      value={
                        requestedChanges.emergency_contact_relationship || ''
                      }
                      onChange={(e) =>
                        handleInputChange(
                          'emergency_contact_relationship',
                          e.target.value
                        )
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Current:{' '}
                      {profile.emergency_contact_relationship || 'Not set'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={requestedChanges.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={4}
                  placeholder="Any additional information or context for your change request..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current: {profile.notes || 'No notes'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-4 mt-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitRequest}
            disabled={submitting || !hasChanges()}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting Request...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit for Approval
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
