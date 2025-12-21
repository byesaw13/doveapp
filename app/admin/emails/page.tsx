'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Plus, Trash2, RefreshCw } from 'lucide-react';

interface GmailConnection {
  id: string;
  email: string;
  display_name?: string;
  connected_at: string;
  last_sync_at?: string;
  sync_status: 'active' | 'error' | 'disabled';
  error_message?: string;
}

export default function GmailConnectionsPage() {
  const [connections, setConnections] = useState<GmailConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gmail/connections');
      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || []);
      } else {
        setMessage({ type: 'error', text: 'Failed to load Gmail connections' });
      }
    } catch (error) {
      console.error('Failed to load connections:', error);
      setMessage({ type: 'error', text: 'Failed to load Gmail connections' });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    setConnecting(true);
    // Redirect to Google OAuth
    window.location.href = '/api/auth/google';
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/gmail/connections/${connectionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Gmail connection removed successfully',
        });
        loadConnections();
      } else {
        setMessage({
          type: 'error',
          text: 'Failed to remove Gmail connection',
        });
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      setMessage({ type: 'error', text: 'Failed to remove Gmail connection' });
    }
  };

  const handleSync = async (connectionId: string) => {
    try {
      const response = await fetch(
        `/api/gmail/connections/${connectionId}/sync`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Gmail sync started successfully',
        });
        loadConnections();
      } else {
        setMessage({ type: 'error', text: 'Failed to start Gmail sync' });
      }
    } catch (error) {
      console.error('Failed to sync:', error);
      setMessage({ type: 'error', text: 'Failed to start Gmail sync' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'disabled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gmail Connections</h1>
          <p className="text-muted-foreground">
            Manage your Gmail connections for email synchronization
          </p>
        </div>
        <Button onClick={handleConnect} disabled={connecting}>
          {connecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Connecting...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Connect Gmail
            </>
          )}
        </Button>
      </div>

      {message && (
        <Alert
          className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}
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

      {connections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Gmail Connections</h3>
            <p className="text-muted-foreground text-center mb-4">
              Connect your Gmail account to synchronize emails and manage
              customer communications.
            </p>
            <Button onClick={handleConnect} disabled={connecting}>
              <Plus className="h-4 w-4 mr-2" />
              Connect Your First Gmail Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {connections.map((connection) => (
            <Card key={connection.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-base">
                        {connection.email}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Connected{' '}
                        {new Date(connection.connected_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(connection.sync_status)}>
                      {connection.sync_status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync(connection.id)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(connection.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {connection.last_sync_at && (
                    <div className="text-sm text-muted-foreground">
                      Last synced:{' '}
                      {new Date(connection.last_sync_at).toLocaleString()}
                    </div>
                  )}
                  {connection.error_message && (
                    <div className="text-sm text-red-600">
                      Error: {connection.error_message}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">
          About Gmail Connections
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>
            • Connected Gmail accounts will automatically sync emails to your
            inbox
          </li>
          <li>
            • Customer emails will be processed and categorized automatically
          </li>
          <li>• You can manage sync settings and view connection status</li>
          <li>
            • Multiple Gmail accounts can be connected for different purposes
          </li>
        </ul>
      </div>
    </div>
  );
}
