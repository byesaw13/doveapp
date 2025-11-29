'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getSquareAuthUrl } from '@/lib/square/oauth';

interface ConnectSquareButtonProps {
  onConnected?: () => void;
}

export function ConnectSquareButton({ onConnected }: ConnectSquareButtonProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/square/status');
      const data = await response.json();
      setIsConnected(data.connected);
    } catch (error) {
      console.error('Failed to check Square connection:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleConnect = () => {
    const authUrl = getSquareAuthUrl();
    window.location.href = authUrl;
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect from Square?')) {
      return;
    }

    try {
      await fetch('/api/square/disconnect', { method: 'POST' });
      setIsConnected(false);
      if (onConnected) onConnected();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      alert('Failed to disconnect from Square');
    }
  };

  if (checking) {
    return <Button variant="outline" disabled>Checking...</Button>;
  }

  if (isConnected) {
    return (
      <Button variant="outline" onClick={handleDisconnect}>
        Disconnect Square
      </Button>
    );
  }

  return (
    <Button variant="outline" onClick={handleConnect}>
      Connect to Square
    </Button>
  );
}
