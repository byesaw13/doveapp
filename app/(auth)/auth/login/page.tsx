'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Loader2, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Auth error:', error);
        setError(error.message);
        return;
      }


      if (data.user) {
        // Check user's role and redirect appropriately
        try {
          // Get user membership to determine role
          const { data: memberships, error: membershipError } = await supabase
            .from('account_memberships')
            .select('role')
            .eq('user_id', data.user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1);

          if (membershipError) {
            console.error('❌ Membership error:', membershipError);

            // Check if infinite recursion
            if (membershipError.message.includes('infinite recursion')) {
              setError('Database configuration error. Please contact support.');
              return;
            }

            setError('Unable to load account access. Please try again.');
            return;
          }

          // Check if user must change password
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('must_change_password')
            .eq('id', data.user.id)
            .single();

          if (!profileError && userProfile?.must_change_password) {
            window.location.href = '/auth/change-password?required=true';
            return;
          }

          const membership = memberships?.[0];

          if (membership) {
            // Redirect based on role
            // Use window.location.href instead of router.push to ensure cookies are sent
            if (membership.role === 'OWNER' || membership.role === 'ADMIN') {
              window.location.href = '/admin/dashboard';
            } else if (membership.role === 'TECH') {
              window.location.href = '/tech/today';
            } else {
              window.location.href = '/portal/home';
            }
          } else {
            // No membership found, redirect to main dashboard
            window.location.href = '/portal/home';
          }
        } catch (err: any) {
          console.error('❌ Unexpected error during membership check:', err);
          setError('Failed to check user permissions: ' + err.message);
        }
      }
    } catch (err: any) {
      console.error('❌ Unexpected error:', err);
      setError('An unexpected error occurred: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'admin' | 'tech' | 'customer') => {
    setLoading(true);
    setError('');

    try {

      // Demo credentials based on role
      const demoCredentials = {
        admin: { email: 'admin@demo.com', password: 'demo123' },
        tech: { email: 'tech@demo.com', password: 'demo123' },
        customer: { email: 'customer@demo.com', password: 'demo123' },
      };

      const { email: demoEmail, password: demoPassword } =
        demoCredentials[role];

      const { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (error) {
        console.error('❌ Demo login error:', error);
        setError(error.message);
        return;
      }


      if (data.user) {
        // Redirect based on role using window.location for hard navigation
        if (role === 'admin') {
          window.location.href = '/admin/dashboard';
        } else if (role === 'tech') {
          window.location.href = '/tech/today';
        } else {
          window.location.href = '/portal/home';
        }
      }
    } catch (err: any) {
      console.error('❌ Demo login error:', err);
      setError('Demo login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-xl">H</span>
          </div>
          <CardTitle className="text-2xl font-bold">FieldOps Pro</CardTitle>
          <CardDescription>
            Sign in to access your field service management portal
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Demo Accounts
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              onClick={() => handleDemoLogin('admin')}
              disabled={loading}
              className="justify-start"
            >
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                <span className="text-primary text-sm">👑</span>
              </div>
              <div className="text-left">
                <div className="font-medium">Admin Portal</div>
                <div className="text-xs text-muted-foreground">
                  Full system access
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleDemoLogin('tech')}
              disabled={loading}
              className="justify-start"
            >
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center mr-3">
                <span className="text-accent text-sm">🔧</span>
              </div>
              <div className="text-left">
                <div className="font-medium">Technician Portal</div>
                <div className="text-xs text-muted-foreground">
                  Field operations
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleDemoLogin('customer')}
              disabled={loading}
              className="justify-start"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-blue-600 text-sm">🏠</span>
              </div>
              <div className="text-left">
                <div className="font-medium">Customer Portal</div>
                <div className="text-xs text-muted-foreground">
                  Service dashboard
                </div>
              </div>
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Demo credentials: email + "demo123"</p>
            <p className="mt-1">Set up accounts in Supabase Auth first</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
