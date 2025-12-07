/**
 * Offline Data Storage Utilities
 * Handles storing and syncing data when offline
 */

const DB_NAME = 'doveapp-offline';
const DB_VERSION = 1;

// Store names for different data types
const STORES = {
  JOBS: 'offline-jobs',
  CLIENTS: 'offline-clients',
  TIME_ENTRIES: 'offline-time-entries',
  ESTIMATES: 'offline-estimates',
  ACTIVITIES: 'offline-activities',
};

interface OfflineData {
  id: string;
  data: any;
  timestamp: number;
  synced: boolean;
  operation: 'create' | 'update' | 'delete';
}

/**
 * Initialize IndexedDB
 */
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores for each data type
      Object.values(STORES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
        }
      });
    };
  });
}

/**
 * Store data for offline sync
 */
export async function storeOfflineData(
  storeName: string,
  id: string,
  data: any,
  operation: 'create' | 'update' | 'delete' = 'create'
): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    const offlineData: OfflineData = {
      id,
      data,
      timestamp: Date.now(),
      synced: false,
      operation,
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(offlineData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
    console.log(`Stored offline data: ${storeName}/${id}`);
  } catch (error) {
    console.error('Failed to store offline data:', error);
    throw error;
  }
}

/**
 * Get all unsynced data for a store
 */
export async function getUnsyncedData(
  storeName: string
): Promise<OfflineData[]> {
  try {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index('synced');

    return new Promise<OfflineData[]>((resolve, reject) => {
      const request = index.getAll(false); // Get all where synced = false
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get unsynced data:', error);
    return [];
  }
}

/**
 * Mark data as synced
 */
export async function markAsSynced(
  storeName: string,
  id: string
): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    // Get the current data
    const currentData = await new Promise<OfflineData>((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (currentData) {
      currentData.synced = true;
      await new Promise<void>((resolve, reject) => {
        const request = store.put(currentData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    db.close();
  } catch (error) {
    console.error('Failed to mark as synced:', error);
  }
}

/**
 * Remove synced data (cleanup)
 */
export async function removeSyncedData(
  storeName: string,
  id: string
): Promise<void> {
  try {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  } catch (error) {
    console.error('Failed to remove synced data:', error);
  }
}

/**
 * Check if we're online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function onConnectionChange(
  callback: (online: boolean) => void
): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Enhanced fetch that handles offline storage
 */
export async function offlineAwareFetch(
  url: string,
  options: RequestInit = {},
  storeName?: string
): Promise<Response> {
  if (!isOnline() && storeName) {
    // If offline and we have a store name, queue the request
    const requestData = {
      url,
      options,
      timestamp: Date.now(),
      retries: 0,
    };

    await storeOfflineData(
      `${storeName}-requests`,
      `${Date.now()}`,
      requestData,
      'create'
    );

    // Return a mock response
    return new Response(
      JSON.stringify({
        offline: true,
        message: 'Request queued for when you reconnect',
        queued: true,
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    if (storeName) {
      // If fetch fails and we have a store name, queue the request
      const requestData = {
        url,
        options,
        timestamp: Date.now(),
        retries: 0,
        error: error.message,
      };

      await storeOfflineData(
        `${storeName}-requests`,
        `${Date.now()}`,
        requestData,
        'create'
      );
    }
    throw error;
  }
}

/**
 * Process queued requests when back online
 */
export async function processQueuedRequests(): Promise<void> {
  if (!isOnline()) return;

  try {
    // Process each store type
    for (const [key, storeName] of Object.entries(STORES)) {
      const requests = await getUnsyncedData(`${storeName}-requests`);

      for (const request of requests) {
        try {
          const response = await fetch(request.data.url, request.data.options);

          if (response.ok) {
            await markAsSynced(`${storeName}-requests`, request.id);
            console.log(`Processed queued request: ${request.data.url}`);
          }
        } catch (error) {
          console.error(`Failed to process queued request:`, error);
          // Could implement retry logic here
        }
      }
    }
  } catch (error) {
    console.error('Failed to process queued requests:', error);
  }
}

// Export store names for use in other files
export { STORES };
