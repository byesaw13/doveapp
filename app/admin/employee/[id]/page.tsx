'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Calendar,
  Briefcase,
  AlertTriangle,
  Loader2,
  Save,
  Clock,
  Award,
  FileText,
} from 'lucide-react';

interface EmployeeProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  display_name?: string;
  avatar_url?: string;
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
  country?: string;
  employee_id?: string;
  hire_date?: string;
  employment_status: string;
  job_title?: string;
  department?: string;
  manager_id?: string;
  hourly_rate?: number;
  overtime_rate?: number;
  salary?: number;
  pay_frequency: string;
  work_schedule?: string;
  skills?: string[];
  certifications?: string[];
  licenses?: string[];
  notes?: string;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<EmployeeProfile>>({});

  useEffect(() => {
    loadProfile();
    checkPermissions();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employee/profile?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to load profile');
      }
      const data = await response.json();
      setProfile(data.profile);
      setFormData(data.profile || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    try {
      // Check if current user can edit this profile
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      const currentUserMemberships = data; // This will include current user's membership
      const isAdmin = currentUserMemberships.some((m: any) =>
        ['OWNER', 'ADMIN'].includes(m.role)
      );
      setCanEdit(isAdmin);
    } catch (err) {
      console.error('Failed to check permissions:', err);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: string, value: string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/employee/profile?userId=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      const data = await response.json();
      setProfile(data.profile);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
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
            Loading Employee Profile...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Error Loading Profile
            </h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <Button onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
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
              This employee hasn't set up their profile yet.
            </p>
            <Button onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.first_name} {profile.last_name}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {profile.job_title || 'Employee'} •{' '}
                    {profile.employee_id || 'No ID'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                {canEdit && (
                  <>
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)}>
                        Edit Profile
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setFormData(profile);
                            setIsEditing(false);
                          }}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                          {saving ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="compensation">Compensation</TabsTrigger>
            <TabsTrigger value="skills">Skills & Certs</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>First Name</Label>
                      {isEditing ? (
                        <Input
                          value={formData.first_name || ''}
                          onChange={(e) =>
                            handleInputChange('first_name', e.target.value)
                          }
                        />
                      ) : (
                        <p className="text-sm text-gray-900">
                          {profile.first_name}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      {isEditing ? (
                        <Input
                          value={formData.last_name || ''}
                          onChange={(e) =>
                            handleInputChange('last_name', e.target.value)
                          }
                        />
                      ) : (
                        <p className="text-sm text-gray-900">
                          {profile.last_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Display Name</Label>
                    {isEditing ? (
                      <Input
                        value={formData.display_name || ''}
                        onChange={(e) =>
                          handleInputChange('display_name', e.target.value)
                        }
                      />
                    ) : (
                      <p className="text-sm text-gray-900">
                        {profile.display_name || 'Not set'}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Employee ID</Label>
                    {isEditing ? (
                      <Input
                        value={formData.employee_id || ''}
                        onChange={(e) =>
                          handleInputChange('employee_id', e.target.value)
                        }
                      />
                    ) : (
                      <p className="text-sm text-gray-900">
                        {profile.employee_id || 'Not assigned'}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Employment Status</Label>
                    {isEditing ? (
                      <Select
                        value={formData.employment_status || 'active'}
                        onValueChange={(value) =>
                          handleInputChange('employment_status', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="terminated">Terminated</SelectItem>
                          <SelectItem value="on_leave">On Leave</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant={
                          profile.employment_status === 'active'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {profile.employment_status}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Hire Date</span>
                    <span className="text-sm font-medium">
                      {profile.hire_date
                        ? new Date(profile.hire_date).toLocaleDateString()
                        : 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Department</span>
                    <span className="text-sm font-medium">
                      {profile.department || 'Not assigned'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Job Title</span>
                    <span className="text-sm font-medium">
                      {profile.job_title || 'Not assigned'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Pay Rate</span>
                    <span className="text-sm font-medium">
                      {profile.pay_frequency === 'salary'
                        ? `$${profile.salary?.toLocaleString()}/year`
                        : `$${profile.hourly_rate}/hour`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Primary Phone</Label>
                    {isEditing ? (
                      <Input
                        value={formData.primary_phone || ''}
                        onChange={(e) =>
                          handleInputChange('primary_phone', e.target.value)
                        }
                      />
                    ) : (
                      <p className="text-sm text-gray-900">
                        {profile.primary_phone || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Secondary Phone</Label>
                    {isEditing ? (
                      <Input
                        value={formData.secondary_phone || ''}
                        onChange={(e) =>
                          handleInputChange('secondary_phone', e.target.value)
                        }
                      />
                    ) : (
                      <p className="text-sm text-gray-900">
                        {profile.secondary_phone || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Personal Email</Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={formData.personal_email || ''}
                        onChange={(e) =>
                          handleInputChange('personal_email', e.target.value)
                        }
                      />
                    ) : (
                      <p className="text-sm text-gray-900">
                        {profile.personal_email || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Work Email</Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={formData.work_email || ''}
                        onChange={(e) =>
                          handleInputChange('work_email', e.target.value)
                        }
                      />
                    ) : (
                      <p className="text-sm text-gray-900">
                        {profile.work_email || 'Not provided'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Address Line 1</Label>
                    {isEditing ? (
                      <Input
                        value={formData.address_line1 || ''}
                        onChange={(e) =>
                          handleInputChange('address_line1', e.target.value)
                        }
                      />
                    ) : (
                      <p className="text-sm text-gray-900">
                        {profile.address_line1 || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Address Line 2</Label>
                    {isEditing ? (
                      <Input
                        value={formData.address_line2 || ''}
                        onChange={(e) =>
                          handleInputChange('address_line2', e.target.value)
                        }
                      />
                    ) : (
                      <p className="text-sm text-gray-900">
                        {profile.address_line2 || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>City</Label>
                      {isEditing ? (
                        <Input
                          value={formData.city || ''}
                          onChange={(e) =>
                            handleInputChange('city', e.target.value)
                          }
                        />
                      ) : (
                        <p className="text-sm text-gray-900">
                          {profile.city || 'Not provided'}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>State</Label>
                      {isEditing ? (
                        <Input
                          value={formData.state || ''}
                          onChange={(e) =>
                            handleInputChange('state', e.target.value)
                          }
                        />
                      ) : (
                        <p className="text-sm text-gray-900">
                          {profile.state || 'Not provided'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>ZIP Code</Label>
                    {isEditing ? (
                      <Input
                        value={formData.zip_code || ''}
                        onChange={(e) =>
                          handleInputChange('zip_code', e.target.value)
                        }
                      />
                    ) : (
                      <p className="text-sm text-gray-900">
                        {profile.zip_code || 'Not provided'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Contact Name</Label>
                      {isEditing ? (
                        <Input
                          value={formData.emergency_contact_name || ''}
                          onChange={(e) =>
                            handleInputChange(
                              'emergency_contact_name',
                              e.target.value
                            )
                          }
                        />
                      ) : (
                        <p className="text-sm text-gray-900">
                          {profile.emergency_contact_name || 'Not provided'}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Contact Phone</Label>
                      {isEditing ? (
                        <Input
                          value={formData.emergency_contact_phone || ''}
                          onChange={(e) =>
                            handleInputChange(
                              'emergency_contact_phone',
                              e.target.value
                            )
                          }
                        />
                      ) : (
                        <p className="text-sm text-gray-900">
                          {profile.emergency_contact_phone || 'Not provided'}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Relationship</Label>
                      {isEditing ? (
                        <Input
                          value={formData.emergency_contact_relationship || ''}
                          onChange={(e) =>
                            handleInputChange(
                              'emergency_contact_relationship',
                              e.target.value
                            )
                          }
                        />
                      ) : (
                        <p className="text-sm text-gray-900">
                          {profile.emergency_contact_relationship ||
                            'Not provided'}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Employment Tab */}
          <TabsContent value="employment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Employment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Job Title</Label>
                    {isEditing ? (
                      <Input
                        value={formData.job_title || ''}
                        onChange={(e) =>
                          handleInputChange('job_title', e.target.value)
                        }
                      />
                    ) : (
                      <p className="text-sm text-gray-900">
                        {profile.job_title || 'Not assigned'}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Department</Label>
                    {isEditing ? (
                      <Input
                        value={formData.department || ''}
                        onChange={(e) =>
                          handleInputChange('department', e.target.value)
                        }
                      />
                    ) : (
                      <p className="text-sm text-gray-900">
                        {profile.department || 'Not assigned'}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Hire Date</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={formData.hire_date || ''}
                        onChange={(e) =>
                          handleInputChange('hire_date', e.target.value)
                        }
                      />
                    ) : (
                      <p className="text-sm text-gray-900">
                        {profile.hire_date
                          ? new Date(profile.hire_date).toLocaleDateString()
                          : 'Not set'}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Employment Status</Label>
                    {isEditing ? (
                      <Select
                        value={formData.employment_status || 'active'}
                        onValueChange={(value) =>
                          handleInputChange('employment_status', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="terminated">Terminated</SelectItem>
                          <SelectItem value="on_leave">On Leave</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant={
                          profile.employment_status === 'active'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {profile.employment_status}
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  {isEditing ? (
                    <Textarea
                      value={formData.notes || ''}
                      onChange={(e) =>
                        handleInputChange('notes', e.target.value)
                      }
                      rows={4}
                      placeholder="Additional notes about employment..."
                    />
                  ) : (
                    <p className="text-sm text-gray-900">
                      {profile.notes || 'No notes'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compensation Tab */}
          <TabsContent value="compensation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Compensation & Pay
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Pay Frequency</Label>
                  {isEditing ? (
                    <Select
                      value={formData.pay_frequency || 'hourly'}
                      onValueChange={(value) =>
                        handleInputChange('pay_frequency', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="salary">Salary</SelectItem>
                        <SelectItem value="commission">Commission</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-gray-900 capitalize">
                      {profile.pay_frequency}
                    </p>
                  )}
                </div>

                {(formData.pay_frequency || profile.pay_frequency) ===
                  'hourly' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Hourly Rate</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.hourly_rate || ''}
                          onChange={(e) =>
                            handleInputChange(
                              'hourly_rate',
                              parseFloat(e.target.value)
                            )
                          }
                        />
                      ) : (
                        <p className="text-sm text-gray-900">
                          ${profile.hourly_rate?.toFixed(2) || 'Not set'}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Overtime Rate</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.overtime_rate || ''}
                          onChange={(e) =>
                            handleInputChange(
                              'overtime_rate',
                              parseFloat(e.target.value)
                            )
                          }
                        />
                      ) : (
                        <p className="text-sm text-gray-900">
                          ${profile.overtime_rate?.toFixed(2) || 'Not set'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {(formData.pay_frequency || profile.pay_frequency) ===
                  'salary' && (
                  <div>
                    <Label>Annual Salary</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="1000"
                        value={formData.salary || ''}
                        onChange={(e) =>
                          handleInputChange(
                            'salary',
                            parseFloat(e.target.value)
                          )
                        }
                      />
                    ) : (
                      <p className="text-sm text-gray-900">
                        ${profile.salary?.toLocaleString() || 'Not set'}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Skills & Certifications Tab */}
          <TabsContent value="skills" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Skills */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={(formData.skills || []).join('\n')}
                      onChange={(e) =>
                        handleArrayChange(
                          'skills',
                          e.target.value.split('\n').filter((s) => s.trim())
                        )
                      }
                      rows={6}
                      placeholder="Enter skills, one per line..."
                    />
                  ) : (
                    <div className="space-y-2">
                      {profile.skills && profile.skills.length > 0 ? (
                        profile.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">
                          No skills listed
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Certifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={(formData.certifications || []).join('\n')}
                      onChange={(e) =>
                        handleArrayChange(
                          'certifications',
                          e.target.value.split('\n').filter((s) => s.trim())
                        )
                      }
                      rows={6}
                      placeholder="Enter certifications, one per line..."
                    />
                  ) : (
                    <div className="space-y-2">
                      {profile.certifications &&
                      profile.certifications.length > 0 ? (
                        profile.certifications.map((cert, index) => (
                          <Badge key={index} variant="outline">
                            {cert}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">
                          No certifications listed
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Licenses */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Licenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={(formData.licenses || []).join('\n')}
                      onChange={(e) =>
                        handleArrayChange(
                          'licenses',
                          e.target.value.split('\n').filter((s) => s.trim())
                        )
                      }
                      rows={4}
                      placeholder="Enter licenses, one per line..."
                    />
                  ) : (
                    <div className="space-y-2">
                      {profile.licenses && profile.licenses.length > 0 ? (
                        profile.licenses.map((license, index) => (
                          <Badge key={index} variant="default">
                            {license}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">
                          No licenses listed
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
