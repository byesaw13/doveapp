'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, UserPlus, Mail, Shield } from 'lucide-react';
import type { Permission } from '@/lib/auth-guards';
import { DEFAULT_ROLE_PERMISSIONS } from '@/lib/auth-guards';

interface CreateUserFormData {
  email: string;
  full_name: string;
  role: 'OWNER' | 'ADMIN' | 'TECH';
  permissions?: Permission[];
}

export function CreateUserForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const [formData, setFormData] = useState<CreateUserFormData>({
    email: '',
    full_name: '',
    role: 'TECH',
    permissions: DEFAULT_ROLE_PERMISSIONS.TECH,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      await response.json();

      setSuccess(
        `User created successfully! Temporary password sent to ${formData.email}`
      );

      // Reset form
      setFormData({
        email: '',
        full_name: '',
        role: 'TECH',
        permissions: DEFAULT_ROLE_PERMISSIONS.TECH,
      });

      // Refresh the page to show new user
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof CreateUserFormData,
    value: string
  ) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Update permissions when role changes
      if (field === 'role') {
        newData.permissions =
          DEFAULT_ROLE_PERMISSIONS[
            value as keyof typeof DEFAULT_ROLE_PERMISSIONS
          ];
      }

      return newData;
    });
  };

  const handlePermissionChange = (permission: Permission, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: checked
        ? [...(prev.permissions || []), permission]
        : (prev.permissions || []).filter((p) => p !== permission),
    }));
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Add New User
        </CardTitle>
        <CardDescription>
          Create a new user account with role-based access
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4">
            <Mail className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@company.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              type="text"
              placeholder="John Doe"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleInputChange('role', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TECH">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Technician
                  </div>
                </SelectItem>
                <SelectItem value="ADMIN">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Administrator
                  </div>
                </SelectItem>
                <SelectItem value="OWNER">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Owner
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Permissions for ADMIN role */}
          {formData.role === 'ADMIN' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Admin Permissions</Label>
              <div className="space-y-2">
                {[
                  {
                    key: 'manage_business',
                    label: 'Manage Business Operations',
                    desc: 'Clients, jobs, estimates, invoices',
                  },
                  {
                    key: 'view_reports',
                    label: 'View Reports',
                    desc: 'Analytics and business intelligence',
                  },
                  {
                    key: 'manage_team',
                    label: 'Manage Team',
                    desc: 'Team scheduling and assignments',
                  },
                  {
                    key: 'manage_inventory',
                    label: 'Manage Inventory',
                    desc: 'Materials and equipment',
                  },
                  {
                    key: 'manage_automations',
                    label: 'Manage Automations',
                    desc: 'Workflows and notifications',
                  },
                  {
                    key: 'view_financial',
                    label: 'View Financial Data',
                    desc: 'Pricing and financial information',
                  },
                  {
                    key: 'manage_leads',
                    label: 'Manage Leads',
                    desc: 'Lead pipeline and sales',
                  },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-start space-x-2">
                    <Checkbox
                      id={key}
                      checked={
                        formData.permissions?.includes(key as Permission) ||
                        false
                      }
                      onCheckedChange={(checked) =>
                        handlePermissionChange(
                          key as Permission,
                          checked as boolean
                        )
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor={key}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating User...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Create User
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> A temporary password will be generated and
            sent to the user&apos;s email. They should change it on first login.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
