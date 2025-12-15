'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function TechLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Clear any local session data
      localStorage.clear();
      sessionStorage.clear();

      // Redirect to login (middleware will handle the actual logout)
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback
      window.location.href = '/auth/login';
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      className="w-full text-sm justify-start"
    >
      <LogOut className="w-4 h-4 mr-2" />
      Sign Out
    </Button>
  );
}
