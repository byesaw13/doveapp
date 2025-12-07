// Enhanced Service Worker for DoveApp PWA
const CACHE_NAME = 'doveapp-v2';
const STATIC_CACHE = 'doveapp-static-v2';
const DYNAMIC_CACHE = 'doveapp-dynamic-v2';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/offline.html',
  '/calendar',
  '/clients',
  '/jobs',
  '/time-tracking',
  '/inventory',
  '/emails',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Enhanced fetch event with different strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests (CDN, APIs, etc.)
  if (!url.origin.includes(self.location.origin)) return;

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached API response if available
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline message for API failures
            return new Response(
              JSON.stringify({
                error: 'Offline',
                message:
                  'You are currently offline. This data will sync when you reconnect.',
                offline: true,
              }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          });
        })
    );
    return;
  }

  // Handle page requests with cache-first strategy, fallback to offline page
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response.ok) return response;

          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/offline.html').then((cachedOffline) => {
              return (
                cachedOffline ||
                new Response('Offline - Please check your connection', {
                  status: 503,
                  headers: { 'Content-Type': 'text/plain' },
                })
              );
            });
          }
          return new Response('Offline', { status: 503 });
        });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);

  if (event.tag === 'sync-jobs') {
    event.waitUntil(syncOfflineJobs());
  } else if (event.tag === 'sync-time-entries') {
    event.waitUntil(syncOfflineTimeEntries());
  } else if (event.tag === 'sync-clients') {
    event.waitUntil(syncOfflineClients());
  }
});

// Enhanced push notifications with actions
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received', event);

  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: data.actions || [
      {
        action: 'view',
        title: 'View',
        icon: '/icon-192.png',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
    requireInteraction: true,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'DoveApp', options)
  );
});

// Enhanced notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);

  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === 'view') {
    event.waitUntil(clients.openWindow(data.url || '/'));
  } else if (action === 'dismiss') {
    // Just close the notification
    console.log('Notification dismissed');
  } else if (action === 'start-job') {
    event.waitUntil(clients.openWindow(`/jobs/${data.jobId}?action=start`));
  } else if (action === 'view-client') {
    event.waitUntil(clients.openWindow(`/clients?client=${data.clientId}`));
  } else {
    // Default action - open the app
    event.waitUntil(clients.openWindow('/'));
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-data') {
    event.waitUntil(updateBackgroundData());
  }
});

// Sync offline jobs
async function syncOfflineJobs() {
  try {
    console.log('Service Worker: Syncing offline jobs...');

    // This would integrate with the offline storage utility
    // For now, just simulate sync completion
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await showSyncNotification('Jobs synced successfully');
  } catch (error) {
    console.error('Service Worker: Job sync failed', error);
  }
}

// Sync offline time entries
async function syncOfflineTimeEntries() {
  try {
    console.log('Service Worker: Syncing offline time entries...');

    const offlineEntries = await getOfflineData('time-entries');

    for (const entry of offlineEntries) {
      try {
        const response = await fetch('/api/time-tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });

        if (response.ok) {
          await removeOfflineData('time-entries', entry.id);
          console.log('Synced time entry:', entry.id);
        }
      } catch (error) {
        console.error('Failed to sync time entry:', entry.id, error);
      }
    }

    await showSyncNotification('Time entries synced successfully');
  } catch (error) {
    console.error('Service Worker: Time entry sync failed', error);
  }
}

// Sync offline clients
async function syncOfflineClients() {
  try {
    console.log('Service Worker: Syncing offline clients...');

    const offlineClients = await getOfflineData('clients');

    for (const client of offlineClients) {
      try {
        const response = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(client),
        });

        if (response.ok) {
          await removeOfflineData('clients', client.id);
          console.log('Synced client:', client.id);
        }
      } catch (error) {
        console.error('Failed to sync client:', client.id, error);
      }
    }

    await showSyncNotification('Clients synced successfully');
  } catch (error) {
    console.error('Service Worker: Client sync failed', error);
  }
}

// Update background data periodically
async function updateBackgroundData() {
  try {
    console.log('Service Worker: Updating background data...');

    // Refresh cached data in background
    const cache = await caches.open(DYNAMIC_CACHE);

    // Update dashboard stats
    try {
      const response = await fetch('/api/dashboard-stats');
      if (response.ok) {
        await cache.put('/api/dashboard-stats', response);
      }
    } catch (error) {
      console.error('Failed to update dashboard stats:', error);
    }

    // Update client list
    try {
      const response = await fetch('/api/clients?limit=50');
      if (response.ok) {
        await cache.put('/api/clients?limit=50', response);
      }
    } catch (error) {
      console.error('Failed to update client list:', error);
    }
  } catch (error) {
    console.error('Service Worker: Background update failed', error);
  }
}

// Helper functions for offline data management
async function getOfflineData(storeName) {
  // This would use IndexedDB in a real implementation
  // For now, return empty array
  return [];
}

async function removeOfflineData(storeName, id) {
  // This would remove from IndexedDB in a real implementation
  console.log(`Removed ${storeName} item:`, id);
}

async function showSyncNotification(message) {
  await self.registration.showNotification('DoveApp Sync', {
    body: message,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'sync-complete',
  });
}
