'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
                <DropdownMenuItem disabled>View Profile</DropdownMenuItem>
                <DropdownMenuItem disabled>Edit Permissions</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="text-destructive">
                  Deactivate User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
