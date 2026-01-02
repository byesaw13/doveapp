'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Wifi,
  WifiOff,
  Download,
  Bell,
  BellOff,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface PWAStatus {
  isOnline: boolean;
  isInstalled: boolean;
  canInstall: boolean;
  hasNotifications: boolean;
  serviceWorkerStatus: 'registering' | 'registered' | 'error' | null;
  syncStatus: 'idle' | 'syncing' | 'completed' | 'error';
}

export function PWARegistration() {
  const { toast } = useToast();
  const isClient = typeof window !== 'undefined';
  const [status, setStatus] = useState<PWAStatus>(() => ({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isInstalled: isClient
      ? window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
      : false,
    canInstall: false,
    hasNotifications:
      isClient &&
      'Notification' in window &&
      Notification.permission === 'granted',
    serviceWorkerStatus: null,
    syncStatus: 'idle',
  }));
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  // Helper function for VAPID key conversion
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const registerServiceWorker = useCallback(async () => {
    // Only register service worker in secure contexts (HTTPS or localhost)
    if (
      'serviceWorker' in navigator &&
      (window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost')
    ) {
      try {
        setStatus((prev) => ({ ...prev, serviceWorkerStatus: 'registering' }));

        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        setRegistration(reg);
        setStatus((prev) => ({ ...prev, serviceWorkerStatus: 'registered' }));

        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New version available
                toast({
                  title: 'Update Available',
                  description:
                    'A new version of DoveApp is available. Please refresh the page.',
                });
              }
            });
          }
        });

        console.log('Service Worker registered:', reg);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        setStatus((prev) => ({ ...prev, serviceWorkerStatus: 'error' }));
      }
    }
  }, [toast]);

  const handleInstallPrompt = useCallback((e: Event) => {
    e.preventDefault();
    setDeferredPrompt(e);
    setStatus((prev) => ({ ...prev, canInstall: true }));
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    setDeferredPrompt(null);
    setStatus((prev) => ({ ...prev, canInstall: false }));
  }, [deferredPrompt]);

  const handleOnlineStatus = useCallback(() => {
    setStatus((prev) => ({ ...prev, isOnline: true }));
    toast({
      title: 'Back Online',
      description: 'Connection restored. Syncing data...',
    });

    // Trigger background sync
    if (registration && 'sync' in registration) {
      (registration as any).sync.register('sync-jobs');
      (registration as any).sync.register('sync-time-entries');
      (registration as any).sync.register('sync-clients');
    }
  }, [registration, toast]);

  const handleOfflineStatus = useCallback(() => {
    setStatus((prev) => ({ ...prev, isOnline: false }));
    toast({
      title: 'Offline Mode',
      description:
        'You can continue working. Data will sync when connection is restored.',
      variant: 'destructive',
    });
  }, [toast]);

  const handleAppInstalled = useCallback(() => {
    setStatus((prev) => ({ ...prev, isInstalled: true, canInstall: false }));
    toast({
      title: 'App Installed!',
      description: 'DoveApp has been installed on your device.',
    });
  }, [toast]);

  const subscribeToPushNotifications = useCallback(async () => {
    if (!registration) return;

    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        ),
      });

      // Send subscription to server
      await fetch('/api/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      console.log('Push subscription created:', subscription);
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  }, [registration]);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Not Supported',
        description: 'Notifications are not supported in this browser.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        setStatus((prev) => ({ ...prev, hasNotifications: true }));
        toast({
          title: 'Notifications Enabled',
          description: 'You will now receive job updates and reminders.',
        });

        // Subscribe to push notifications
        await subscribeToPushNotifications();
      } else {
        toast({
          title: 'Notifications Denied',
          description: 'You can enable notifications in your browser settings.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Notification permission error:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable notifications.',
        variant: 'destructive',
      });
    }
  }, [subscribeToPushNotifications, toast]);

  const manualSync = useCallback(async () => {
    if (!registration) return;

    setStatus((prev) => ({ ...prev, syncStatus: 'syncing' }));

    try {
      if ('sync' in registration) {
        await (registration as any).sync.register('sync-jobs');
        await (registration as any).sync.register('sync-time-entries');
        await (registration as any).sync.register('sync-clients');
      }

      setStatus((prev) => ({ ...prev, syncStatus: 'completed' }));

      toast({
        title: 'Sync Complete',
        description: 'All offline data has been synchronized.',
      });

      setTimeout(() => {
        setStatus((prev) => ({ ...prev, syncStatus: 'idle' }));
      }, 3000);
    } catch (error) {
      console.error('Manual sync failed:', error);
      setStatus((prev) => ({ ...prev, syncStatus: 'error' }));

      toast({
        title: 'Sync Failed',
        description: 'Failed to sync data. Please check your connection.',
        variant: 'destructive',
      });
    }
  }, [registration, toast]);

  useEffect(() => {
    // Register service worker
    const registrationTimeout = window.setTimeout(() => {
      void registerServiceWorker();
    }, 0);

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    // Listen for online/offline
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);

    // Listen for app installed
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.clearTimeout(registrationTimeout);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [
    handleAppInstalled,
    handleInstallPrompt,
    handleOfflineStatus,
    handleOnlineStatus,
    registerServiceWorker,
  ]);
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          PWA Status
        </CardTitle>
        <CardDescription>
          Progressive Web App features and offline capabilities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status.isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm">
              {status.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <Badge variant={status.isOnline ? 'default' : 'destructive'}>
            {status.isOnline ? 'Connected' : 'Offline'}
          </Badge>
        </div>

        {/* Installation Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-blue-600" />
            <span className="text-sm">Installation</span>
          </div>
          {status.isInstalled ? (
            <Badge variant="default">Installed</Badge>
          ) : status.canInstall ? (
            <Button size="sm" onClick={handleInstallClick}>
              Install App
            </Button>
          ) : (
            <Badge variant="secondary">Not Available</Badge>
          )}
        </div>

        {/* Service Worker Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw
              className={`h-4 w-4 ${
                status.serviceWorkerStatus === 'registered'
                  ? 'text-green-600'
                  : status.serviceWorkerStatus === 'error'
                    ? 'text-red-600'
                    : 'text-yellow-600'
              }`}
            />
            <span className="text-sm">Service Worker</span>
          </div>
          <Badge
            variant={
              status.serviceWorkerStatus === 'registered'
                ? 'default'
                : status.serviceWorkerStatus === 'error'
                  ? 'destructive'
                  : 'secondary'
            }
          >
            {status.serviceWorkerStatus || 'Not Registered'}
          </Badge>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isClient ? (
              status.hasNotifications ? (
                <Bell className="h-4 w-4 text-green-600" />
              ) : (
                <BellOff className="h-4 w-4 text-gray-400" />
              )
            ) : (
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            )}
            <span className="text-sm">Notifications</span>
          </div>
          {isClient ? (
            status.hasNotifications ? (
              <Badge variant="default">Enabled</Badge>
            ) : (
              <Button size="sm" onClick={requestNotificationPermission}>
                Enable
              </Button>
            )
          ) : (
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
          )}
        </div>

        {/* Sync Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw
              className={`h-4 w-4 ${
                status.syncStatus === 'syncing'
                  ? 'text-blue-600 animate-spin'
                  : status.syncStatus === 'completed'
                    ? 'text-green-600'
                    : status.syncStatus === 'error'
                      ? 'text-red-600'
                      : 'text-gray-400'
              }`}
            />
            <span className="text-sm">Sync Status</span>
          </div>
          <div className="flex gap-2">
            <Badge
              variant={
                status.syncStatus === 'completed'
                  ? 'default'
                  : status.syncStatus === 'error'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {status.syncStatus === 'idle'
                ? 'Ready'
                : status.syncStatus === 'syncing'
                  ? 'Syncing...'
                  : status.syncStatus === 'completed'
                    ? 'Complete'
                    : status.syncStatus === 'error'
                      ? 'Error'
                      : 'Idle'}
            </Badge>
            {!status.isOnline && (
              <Button
                size="sm"
                onClick={manualSync}
                disabled={status.syncStatus === 'syncing'}
              >
                Sync
              </Button>
            )}
          </div>
        </div>

        {/* PWA Features Info */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            PWA Features Active:
          </h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Offline data access</li>
            <li>• Background synchronization</li>
            <li>• Push notifications</li>
            <li>• App-like installation</li>
            <li>• Fast loading from cache</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
