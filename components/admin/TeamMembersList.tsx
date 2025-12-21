'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Mail,
  Shield,
  AlertTriangle,
  Loader2,
  UserCog,
  UserX,
} from 'lucide-react';

interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  role: 'OWNER' | 'ADMIN' | 'TECH';
  permissions?: string[];
  is_active: boolean;
  created_at: string;
  user_created_at: string;
}

export function TeamMembersList() {
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [newRole, setNewRole] = useState<'OWNER' | 'ADMIN' | 'TECH'>('TECH');

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load team members');
      }

      const data = await response.json();
      setMembers(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load team members'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditPermissions = (member: TeamMember) => {
    setSelectedMember(member);
    setNewRole(member.role);
    setShowRoleDialog(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedMember) return;

    try {
      setUpdatingRole(true);
      const response = await fetch(
        `/api/admin/users/${selectedMember.id}/role`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update role');
      }

      // Update the member in the list
      setMembers((prev) =>
        prev.map((member) =>
          member.id === selectedMember.id
            ? { ...member, role: newRole }
            : member
        )
      );

      setShowRoleDialog(false);
      setSelectedMember(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleDeactivateUser = (member: TeamMember) => {
    setSelectedMember(member);
    setShowDeactivateDialog(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!selectedMember) return;

    try {
      setDeactivating(true);
      const response = await fetch(
        `/api/admin/users/${selectedMember.id}/deactivate`,
        {
          method: 'PUT',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to deactivate user');
      }

      // Remove the member from the list
      setMembers((prev) =>
        prev.filter((member) => member.id !== selectedMember.id)
      );

      setShowDeactivateDialog(false);
      setSelectedMember(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to deactivate user'
      );
    } finally {
      setDeactivating(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'TECH':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading team members...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={loadTeamMembers} className="mt-4" variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No team members yet</p>
            <p className="text-sm mt-2">
              Add your first team member using the form on the left.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Current Team Members ({members.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                {getInitials(member.full_name)}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{member.full_name}</h3>
                  <Badge className={getRoleColor(member.role)}>
                    {member.role}
                  </Badge>
                  {!member.is_active && (
                    <Badge variant="destructive">Inactive</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  {member.email}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Joined {new Date(member.user_created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/admin/employee/${member.id}`)}
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEditPermissions(member)}>
                  <Shield className="h-4 w-4 mr-2" />
                  Edit Permissions
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDeactivateUser(member)}
                  className="text-destructive"
                  disabled={member.role === 'OWNER'}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Deactivate User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </CardContent>

      {/* Role Edit Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Permissions</DialogTitle>
            <DialogDescription>
              Change the role and permissions for {selectedMember?.full_name}.
              This will affect what they can access in the system.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Role
              </label>
              <Select
                value={newRole}
                onValueChange={(value: any) => setNewRole(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TECH">Technician</SelectItem>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                  <SelectItem value="OWNER">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Role Permissions
              </h4>
              <div className="text-sm text-blue-700">
                {newRole === 'TECH' && (
                  <ul className="space-y-1">
                    <li>• View assigned jobs</li>
                    <li>• Update job status</li>
                    <li>• Access customer info</li>
                  </ul>
                )}
                {newRole === 'ADMIN' && (
                  <ul className="space-y-1">
                    <li>• All technician permissions</li>
                    <li>• Manage clients & jobs</li>
                    <li>• Create estimates & invoices</li>
                    <li>• View all reports</li>
                  </ul>
                )}
                {newRole === 'OWNER' && (
                  <ul className="space-y-1">
                    <li>• All admin permissions</li>
                    <li>• Manage team members</li>
                    <li>• Account settings</li>
                    <li>• Full system access</li>
                  </ul>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRoleDialog(false)}
              disabled={updatingRole}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={updatingRole || newRole === selectedMember?.role}
            >
              {updatingRole ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate User Dialog */}
      <Dialog
        open={showDeactivateDialog}
        onOpenChange={setShowDeactivateDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate User</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate {selectedMember?.full_name}?
              They will lose access to the system and their account will be
              marked as inactive.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  This action cannot be undone
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    The user will be deactivated and removed from the team list.
                  </p>
                  <p>You can reactivate them later by contacting support.</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeactivateDialog(false)}
              disabled={deactivating}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeactivate}
              disabled={deactivating}
            >
              {deactivating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deactivating...
                </>
              ) : (
                'Deactivate User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
