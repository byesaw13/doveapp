'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRequired = searchParams.get('required') === 'true';

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email || '');
      } else {
        router.push('/auth/login');
      }
    });
  }, [router]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate new password
      const validationError = validatePassword(newPassword);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Check passwords match
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      // Check not same as current
      if (currentPassword === newPassword) {
        setError('New password must be different from current password');
        return;
      }

      // Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error('❌ Password update error:', updateError);
        setError(updateError.message);
        return;
      }

      // Update the must_change_password flag via API
      const response = await fetch('/api/auth/password-changed', {
        method: 'POST',
      });

      if (!response.ok) {
        console.warn(
          '⚠️ Failed to update password flag, but password was changed'
        );
      }

      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        // Get user's role and redirect appropriately
            supabase.auth.getUser().then(async ({ data }) => {
              if (data.user) {
                const { data: memberships } = await supabase
                  .from('account_memberships')
                  .select('role')
                  .eq('user_id', data.user.id)
                  .eq('is_active', true)
                  .order('created_at', { ascending: false })
                  .limit(1);

                const membership = memberships?.[0];

                if (membership) {
                  if (membership.role === 'OWNER' || membership.role === 'ADMIN') {
                    window.location.href = '/admin/dashboard';
                  } else if (membership.role === 'TECH') {
                    window.location.href = '/tech/today';
                  } else {
                window.location.href = '/portal/home';
              }
            } else {
              window.location.href = '/';
            }
          }
        });
      }, 2000);
    } catch (err: any) {
      console.error('❌ Unexpected error:', err);
      setError('An unexpected error occurred: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Lock className="text-white w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {isRequired ? 'Password Change Required' : 'Change Password'}
          </CardTitle>
          <CardDescription>
            {isRequired
              ? 'For security, you must change your temporary password before continuing'
              : 'Update your password to keep your account secure'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isRequired && (
            <Alert className="border-amber-500 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                This is your first login. Please create a new password.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Password changed successfully! Redirecting...
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading || success}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading || success}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading || success}
                />
              </div>
            </div>

            <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
              <p className="font-semibold text-foreground">
                Password Requirements:
              </p>
              <ul className="text-muted-foreground space-y-1">
                <li>• At least 8 characters long</li>
                <li>• Contains uppercase and lowercase letters</li>
                <li>• Contains at least one number</li>
                <li>• Different from your current password</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Changing Password...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Success!
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </form>

          {!isRequired && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.back()}
              disabled={loading || success}
            >
              Cancel
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChangePasswordForm />
    </Suspense>
  );
}
