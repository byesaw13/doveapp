'use client';

import { useEffect } from 'react';

export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker in both development and production
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);

          // Register for periodic sync if supported
          if ('periodicSync' in registration) {
            try {
              // @ts-ignore - periodicSync is not in all TypeScript definitions yet
              registration.periodicSync.register('update-data', {
                minInterval: 24 * 60 * 60 * 1000, // 24 hours
              });
              console.log('Periodic sync registered');
            } catch (error) {
              console.error('Periodic sync registration failed:', error);
            }
          }
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  return null;
}
