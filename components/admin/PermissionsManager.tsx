'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Save } from 'lucide-react';
import {
  Permission,
  DEFAULT_ROLE_PERMISSIONS,
  UserRole,
} from '@/lib/auth-guards';

interface UserPermissions {
  userId: string;
  email: string;
  fullName?: string;
  role: UserRole;
  customPermissions?: Permission[];
  isCustom: boolean;
}

interface PermissionsManagerProps {
  accountId: string;
}

export function PermissionsManager({ accountId }: PermissionsManagerProps) {
  const [users, setUsers] = useState<UserPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    loadUsers();
  }, [accountId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/accounts/${accountId}/permissions`
      );
      if (!response.ok) {
        throw new Error('Failed to load users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  const updateUserPermissions = async (
    userId: string,
    permissions: Permission[]
  ) => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch(
        `/api/admin/accounts/${accountId}/permissions`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            permissions,
          }),
        }
      );

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to update permissions' }));
        throw new Error(error.error || 'Failed to update permissions');
      }

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.userId === userId
            ? {
                ...user,
                customPermissions: permissions,
                isCustom: permissions.length > 0,
              }
            : user
        )
      );

      setMessage({ type: 'success', text: 'Permissions updated successfully' });
    } catch (error) {
      console.error('Failed to update permissions:', error);
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Failed to update permissions',
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = async (userId: string, role: UserRole) => {
    await updateUserPermissions(userId, []);
  };

  const getPermissionDescription = (permission: Permission): string => {
    const descriptions: Record<Permission, string> = {
      manage_users: 'Create, edit, and delete user accounts',
      manage_account: 'Modify account settings, billing, and deletion',
      manage_business:
        'Access all business operations (clients, jobs, estimates, invoices)',
      view_reports: 'Access analytics and reporting dashboard',
      manage_team: 'Manage team members and scheduling',
      manage_inventory: 'Manage inventory, materials, and tools',
      manage_automations: 'Configure workflow automations and settings',
      view_financial: 'Access financial data and pricing information',
      manage_leads: 'Manage leads and sales pipeline',
      export_data: 'Export data and reports',
    };
    return descriptions[permission];
  };

  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-100 text-purple-800';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800';
      case 'TECH':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Shield className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Permissions Management</h2>
      </div>

      {message && (
        <Alert
          className={
            message.type === 'error'
              ? 'border-red-200 bg-red-50'
              : 'border-green-200 bg-green-50'
          }
        >
          <AlertDescription
            className={
              message.type === 'error' ? 'text-red-800' : 'text-green-800'
            }
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {users.map((user) => {
          const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[user.role];
          const currentPermissions =
            user.customPermissions || defaultPermissions;

          return (
            <Card key={user.userId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {user.fullName || user.email}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                    {user.isCustom && (
                      <Badge variant="outline">Custom Permissions</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {user.role === 'OWNER'
                    ? 'Owners have all permissions by default.'
                    : user.isCustom
                      ? 'Custom permissions are set for this user.'
                      : 'Using default permissions for this role.'}
                </div>

                {user.role !== 'OWNER' && (
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Permissions:</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(DEFAULT_ROLE_PERMISSIONS).map(
                        ([role, permissions]) =>
                          permissions.map((permission) => (
                            <div
                              key={permission}
                              className="flex items-start space-x-2"
                            >
                              <Checkbox
                                id={`${user.userId}-${permission}`}
                                checked={currentPermissions.includes(
                                  permission
                                )}
                                onCheckedChange={(checked) => {
                                  const newPermissions = checked
                                    ? [...currentPermissions, permission]
                                    : currentPermissions.filter(
                                        (p) => p !== permission
                                      );
                                  updateUserPermissions(
                                    user.userId,
                                    newPermissions
                                  );
                                }}
                                disabled={saving}
                              />
                              <div className="grid gap-1.5 leading-none">
                                <label
                                  htmlFor={`${user.userId}-${permission}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {permission
                                    .replace(/_/g, ' ')
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </label>
                                <p className="text-xs text-muted-foreground">
                                  {getPermissionDescription(permission)}
                                </p>
                              </div>
                            </div>
                          ))
                      )}
                    </div>

                    {user.isCustom && (
                      <div className="pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resetToDefault(user.userId, user.role)}
                          disabled={saving}
                        >
                          Reset to Role Defaults
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
