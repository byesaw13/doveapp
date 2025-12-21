/**
 * Advanced caching utilities for production performance
 */

import { useState, useEffect, useCallback } from 'react';

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[]; // Cache tags for invalidation
  revalidate?: number; // Next.js revalidate time
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
}

// In-memory cache for client-side data
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
  }

  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes default
      tags: options.tags || [],
    };
    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidateByTag(tag: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
      }
    }
  }

  invalidateByPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Global cache instance
export const memoryCache = new MemoryCache();

// Cache keys
export const CACHE_KEYS = {
  JOBS_LIST: (accountId: string, filters: any) =>
    `jobs:list:${accountId}:${JSON.stringify(filters)}`,
  JOB_DETAIL: (jobId: string) => `jobs:detail:${jobId}`,
  CLIENTS_LIST: (accountId: string, filters: any) =>
    `clients:list:${accountId}:${JSON.stringify(filters)}`,
  CLIENT_DETAIL: (clientId: string) => `clients:detail:${clientId}`,
  ESTIMATES_LIST: (accountId: string, filters: any) =>
    `estimates:list:${accountId}:${JSON.stringify(filters)}`,
  INVOICES_LIST: (accountId: string, filters: any) =>
    `invoices:list:${accountId}:${JSON.stringify(filters)}`,
} as const;

// Cache tags for invalidation
export const CACHE_TAGS = {
  JOBS: 'jobs',
  CLIENTS: 'clients',
  ESTIMATES: 'estimates',
  INVOICES: 'invoices',
  ALL: 'all',
} as const;

/**
 * Cached API wrapper with automatic invalidation
 */
export class CachedAPI {
  static async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try cache first
    const cached = memoryCache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetcher();

    // Cache the result
    memoryCache.set(key, data, options);

    return data;
  }

  static invalidateByTag(tag: string): void {
    memoryCache.invalidateByTag(tag);
  }

  static invalidateByPattern(pattern: string): void {
    memoryCache.invalidateByPattern(pattern);
  }

  static clear(): void {
    memoryCache.clear();
  }
}

/**
 * React hook for cached data fetching
 */
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await CachedAPI.get(key, fetcher, options);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Server-side caching utilities for Next.js
 */
export const nextCache = {
  /**
   * Cache a server component with revalidation
   */
  revalidateTag: (tag: string) => {
    // This would be used with Next.js cache() function
    return tag;
  },

  /**
   * Cache configuration for API routes
   */
  apiCache: (options: { revalidate?: number; tags?: string[] }) => {
    return {
      revalidate: options.revalidate || 300, // 5 minutes default
      tags: options.tags || [],
    };
  },
};

/**
 * Cache invalidation helpers
 */
export const invalidateCache = {
  jobs: () => CachedAPI.invalidateByTag(CACHE_TAGS.JOBS),
  clients: () => CachedAPI.invalidateByTag(CACHE_TAGS.CLIENTS),
  estimates: () => CachedAPI.invalidateByTag(CACHE_TAGS.ESTIMATES),
  invoices: () => CachedAPI.invalidateByTag(CACHE_TAGS.INVOICES),
  all: () => CachedAPI.clear(),
};
