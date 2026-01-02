/**
 * Advanced caching utilities for production performance
 *
 * This module provides a comprehensive client-side and server-side caching solution
 * for the DoveApp field service management system. It includes:
 *
 * - In-memory caching with automatic TTL expiration
 * - Tag-based cache invalidation for related data
 * - Pattern-based invalidation for bulk updates
 * - React hooks for seamless cached data fetching
 * - Next.js integration for server-side caching
 *
 * @module cache
 *
 * @example
 * ```typescript
 * // Basic cache usage
 * import { CachedAPI, CACHE_KEYS, CACHE_TAGS } from '@/lib/cache';
 *
 * const jobs = await CachedAPI.get(
 *   CACHE_KEYS.JOBS_LIST(accountId, filters),
 *   async () => fetchJobsFromAPI(accountId, filters),
 *   { ttl: 5 * 60 * 1000, tags: [CACHE_TAGS.JOBS] }
 * );
 *
 * // Invalidate after update
 * CachedAPI.invalidateByTag(CACHE_TAGS.JOBS);
 * ```
 *
 * @see {@link MemoryCache} for low-level cache operations
 * @see {@link CachedAPI} for high-level API caching
 * @see {@link useCache} for React component integration
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Configuration options for cache entries
 *
 * @interface CacheOptions
 */
export interface CacheOptions {
  /**
   * Time to live in milliseconds before the cache entry expires.
   *
   * @default 300000 (5 minutes)
   *
   * @example
   * ```typescript
   * // Cache for 10 minutes
   * { ttl: 10 * 60 * 1000 }
   *
   * // Cache for 1 hour
   * { ttl: 60 * 60 * 1000 }
   * ```
   */
  ttl?: number;

  /**
   * Tags for grouping related cache entries. Useful for bulk invalidation.
   *
   * @remarks
   * Use tags to invalidate all related data when a single entity changes.
   * For example, when a job is updated, invalidate all caches tagged with 'jobs'.
   *
   * @example
   * ```typescript
   * // Tag with multiple categories
   * { tags: [CACHE_TAGS.JOBS, CACHE_TAGS.CLIENTS] }
   *
   * // Invalidate all jobs-related caches
   * CachedAPI.invalidateByTag(CACHE_TAGS.JOBS);
   * ```
   */
  tags?: string[];

  /**
   * Next.js revalidation time in seconds for server-side caching.
   * Only applicable when using Next.js cache() function.
   *
   * @see {@link nextCache} for server-side caching utilities
   */
  revalidate?: number;
}

/**
 * Internal cache entry structure with metadata
 *
 * @interface CacheEntry
 * @template T - The type of data stored in the cache
 */
export interface CacheEntry<T> {
  /** The cached data payload */
  data: T;

  /** Unix timestamp (milliseconds) when the entry was created */
  timestamp: number;

  /** Time to live in milliseconds from creation timestamp */
  ttl: number;

  /** Tags associated with this cache entry for group invalidation */
  tags: string[];
}

/**
 * In-memory cache implementation for client-side data caching
 *
 * This class provides a Map-based cache with automatic expiration and cleanup.
 * It runs a background interval to remove expired entries every 5 minutes.
 *
 * @remarks
 * **Memory Management**: The cache stores data in browser memory. For large datasets
 * or long-running sessions, monitor memory usage. The automatic cleanup interval
 * helps prevent unbounded growth.
 *
 * **Thread Safety**: This cache is NOT thread-safe. In browser environments with
 * shared workers or service workers, consider using IndexedDB instead.
 *
 * **Production Considerations**:
 * - Cache is lost on page refresh (client-side only)
 * - Not suitable for server-side rendering (use Next.js cache instead)
 * - Consider Redis or similar for production server-side caching
 *
 * @class MemoryCache
 *
 * @example
 * ```typescript
 * const cache = new MemoryCache();
 *
 * // Store data with 10-minute TTL
 * cache.set('user:123', userData, {
 *   ttl: 10 * 60 * 1000,
 *   tags: ['users']
 * });
 *
 * // Retrieve data
 * const user = cache.get<User>('user:123');
 *
 * // Invalidate all user-tagged entries
 * cache.invalidateByTag('users');
 *
 * // Cleanup when done
 * cache.destroy();
 * ```
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Initializes the cache and starts the automatic cleanup interval
   *
   * @remarks
   * The cleanup interval runs every 5 minutes to remove expired entries.
   * This prevents memory leaks in long-running applications.
   *
   * @see {@link destroy} to stop the cleanup interval when cache is no longer needed
   */
  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Stores data in the cache with optional TTL and tags
   *
   * @template T - The type of data being cached
   * @param key - Unique cache key (recommend using CACHE_KEYS helpers)
   * @param data - The data to cache
   * @param options - Cache configuration options
   *
   * @remarks
   * - If a key already exists, it will be overwritten
   * - Default TTL is 5 minutes if not specified
   * - Tags enable bulk invalidation of related entries
   *
   * @example
   * ```typescript
   * // Cache with default 5-minute TTL
   * cache.set('jobs:list', jobsData);
   *
   * // Cache with custom TTL and tags
   * cache.set('jobs:list:123', jobsData, {
   *   ttl: 10 * 60 * 1000, // 10 minutes
   *   tags: ['jobs', 'account:123']
   * });
   * ```
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes default
      tags: options.tags || [],
    };
    this.cache.set(key, entry);
  }

  /**
   * Retrieves data from the cache if it exists and hasn't expired
   *
   * @template T - The expected type of cached data
   * @param key - The cache key to retrieve
   * @returns The cached data if found and valid, null otherwise
   *
   * @remarks
   * - Automatically removes expired entries on access
   * - Returns null for missing or expired entries
   * - Type safety: Caller must provide correct generic type
   *
   * @example
   * ```typescript
   * const jobs = cache.get<Job[]>('jobs:list');
   * if (jobs) {
   *   console.log('Cache hit!', jobs);
   * } else {
   *   console.log('Cache miss or expired');
   * }
   * ```
   */
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

  /**
   * Invalidates all cache entries matching a specific tag
   *
   * @param tag - The tag to match for invalidation
   *
   * @remarks
   * This is useful for invalidating related data when a single entity changes.
   * For example, when a client is updated, invalidate all caches tagged with 'clients'.
   *
   * **Performance**: O(n) operation that iterates all cache entries.
   * For large caches, consider batching invalidations.
   *
   * @example
   * ```typescript
   * // After updating a job, invalidate all job-related caches
   * await updateJob(jobId, updates);
   * cache.invalidateByTag(CACHE_TAGS.JOBS);
   *
   * // Invalidate multiple related entities
   * cache.invalidateByTag(CACHE_TAGS.JOBS);
   * cache.invalidateByTag(CACHE_TAGS.INVOICES);
   * ```
   */
  invalidateByTag(tag: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidates all cache entries with keys containing the pattern string
   *
   * @param pattern - Substring to match in cache keys
   *
   * @remarks
   * Uses simple string inclusion matching (not regex).
   * Useful for invalidating all entries related to a specific entity ID.
   *
   * **Performance**: O(n) operation. Use sparingly for large caches.
   *
   * @example
   * ```typescript
   * // Invalidate all caches for a specific account
   * cache.invalidateByPattern('account:123');
   *
   * // Invalidate all job detail caches
   * cache.invalidateByPattern('jobs:detail');
   *
   * // Invalidate all list caches (jobs, clients, estimates, etc.)
   * cache.invalidateByPattern(':list:');
   * ```
   */
  invalidateByPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Removes all entries from the cache
   *
   * @remarks
   * Use this for:
   * - User logout to clear all user-specific data
   * - Account switching to prevent data leakage
   * - Testing/debugging to reset cache state
   *
   * **Does NOT stop the cleanup interval**. Use {@link destroy} for full cleanup.
   *
   * @example
   * ```typescript
   * // On user logout
   * function handleLogout() {
   *   cache.clear();
   *   // redirect to login...
   * }
   *
   * // Account switch
   * function switchAccount(newAccountId: string) {
   *   cache.clear();
   *   // load new account data...
   * }
   * ```
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Internal method to remove expired entries
   *
   * @remarks
   * Automatically called every 5 minutes by the cleanup interval.
   * Can be called manually for immediate cleanup, but this is rarely needed.
   *
   * **Performance**: O(n) where n is the number of cache entries.
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Stops the cleanup interval and clears all cache entries
   *
   * @remarks
   * Call this method when the cache is no longer needed to prevent memory leaks.
   * Useful in:
   * - React component unmount (if creating cache instances per component)
   * - Test cleanup (afterEach/afterAll hooks)
   * - Application shutdown
   *
   * **Note**: The global {@link memoryCache} instance should NOT be destroyed
   * during normal application lifecycle.
   *
   * @example
   * ```typescript
   * // In a React component (if not using global cache)
   * useEffect(() => {
   *   const cache = new MemoryCache();
   *   // use cache...
   *   return () => cache.destroy(); // cleanup on unmount
   * }, []);
   *
   * // In tests
   * afterEach(() => {
   *   testCache.destroy();
   * });
   * ```
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

/**
 * Global singleton cache instance for application-wide caching
 *
 * @remarks
 * This is the primary cache used throughout the application.
 * Shared across all components and modules within the same browser context.
 *
 * **Do NOT destroy this instance** during normal application lifecycle.
 * It automatically manages cleanup via internal intervals.
 *
 * @example
 * ```typescript
 * import { memoryCache, CACHE_KEYS } from '@/lib/cache';
 *
 * // Direct cache access
 * memoryCache.set(CACHE_KEYS.JOB_DETAIL(jobId), jobData, {
 *   ttl: 10 * 60 * 1000,
 *   tags: ['jobs']
 * });
 *
 * const job = memoryCache.get(CACHE_KEYS.JOB_DETAIL(jobId));
 * ```
 */
export const memoryCache = new MemoryCache();

/**
 * Standardized cache key generators for consistent cache key formatting
 *
 * @remarks
 * Using these helpers ensures:
 * - Consistent key naming across the application
 * - Proper serialization of complex filter objects
 * - Easy pattern-based invalidation
 *
 * **Key Format**: `entity:operation:identifier[:serialized-params]`
 *
 * @example
 * ```typescript
 * import { CACHE_KEYS, CachedAPI } from '@/lib/cache';
 *
 * // Generate cache key for jobs list with filters
 * const key = CACHE_KEYS.JOBS_LIST(accountId, { status: 'in_progress' });
 * // Result: "jobs:list:acc_123:{"status":"in_progress"}"
 *
 * // Use with CachedAPI
 * const jobs = await CachedAPI.get(
 *   CACHE_KEYS.JOBS_LIST(accountId, filters),
 *   () => fetchJobs(accountId, filters)
 * );
 *
 * // Invalidate specific job detail
 * memoryCache.invalidateByPattern(CACHE_KEYS.JOB_DETAIL(jobId));
 * ```
 */
export const CACHE_KEYS = {
  /**
   * Cache key for jobs list with account and filter parameters
   *
   * @param accountId - The account ID to scope the list to
   * @param filters - Filter object (will be JSON serialized)
   * @returns Cache key string
   */
  JOBS_LIST: (accountId: string, filters: any) =>
    `jobs:list:${accountId}:${JSON.stringify(filters)}`,

  /**
   * Cache key for individual job details
   *
   * @param jobId - The unique job identifier
   * @returns Cache key string
   */
  JOB_DETAIL: (jobId: string) => `jobs:detail:${jobId}`,

  /**
   * Cache key for clients list with account and filter parameters
   *
   * @param accountId - The account ID to scope the list to
   * @param filters - Filter object (will be JSON serialized)
   * @returns Cache key string
   */
  CLIENTS_LIST: (accountId: string, filters: any) =>
    `clients:list:${accountId}:${JSON.stringify(filters)}`,

  /**
   * Cache key for individual client details
   *
   * @param clientId - The unique client identifier
   * @returns Cache key string
   */
  CLIENT_DETAIL: (clientId: string) => `clients:detail:${clientId}`,

  /**
   * Cache key for estimates list with account and filter parameters
   *
   * @param accountId - The account ID to scope the list to
   * @param filters - Filter object (will be JSON serialized)
   * @returns Cache key string
   */
  ESTIMATES_LIST: (accountId: string, filters: any) =>
    `estimates:list:${accountId}:${JSON.stringify(filters)}`,

  /**
   * Cache key for invoices list with account and filter parameters
   *
   * @param accountId - The account ID to scope the list to
   * @param filters - Filter object (will be JSON serialized)
   * @returns Cache key string
   */
  INVOICES_LIST: (accountId: string, filters: any) =>
    `invoices:list:${accountId}:${JSON.stringify(filters)}`,
} as const;

/**
 * Predefined cache tags for bulk invalidation of related data
 *
 * @remarks
 * Use these constants when setting cache options to ensure consistent tagging.
 * Tags enable efficient invalidation of all related cache entries when data changes.
 *
 * **Invalidation Strategy**:
 * - After creating/updating/deleting an entity, invalidate its tag
 * - For cross-entity updates (e.g., job affects invoice), invalidate multiple tags
 * - Use `ALL` sparingly - only for logout, account switch, or major state changes
 *
 * @example
 * ```typescript
 * import { CACHE_TAGS, CachedAPI, invalidateCache } from '@/lib/cache';
 *
 * // Cache with tags
 * await CachedAPI.get(key, fetcher, {
 *   tags: [CACHE_TAGS.JOBS, CACHE_TAGS.CLIENTS]
 * });
 *
 * // After job update, invalidate all job caches
 * await updateJob(jobId, data);
 * invalidateCache.jobs();
 *
 * // After invoice creation from job, invalidate both
 * await createInvoiceFromJob(jobId);
 * invalidateCache.jobs();
 * invalidateCache.invoices();
 * ```
 */
export const CACHE_TAGS = {
  /** Tag for all job-related cache entries */
  JOBS: 'jobs',

  /** Tag for all client-related cache entries */
  CLIENTS: 'clients',

  /** Tag for all estimate-related cache entries */
  ESTIMATES: 'estimates',

  /** Tag for all invoice-related cache entries */
  INVOICES: 'invoices',

  /**
   * Global tag for all cache entries
   *
   * @remarks
   * Use sparingly. Only for:
   * - User logout
   * - Account switching
   * - Major application state resets
   */
  ALL: 'all',
} as const;

/**
 * High-level API wrapper for cached data fetching with automatic invalidation
 *
 * This class provides a simple interface for implementing cache-aside pattern:
 * 1. Check cache for existing data
 * 2. If cache miss, fetch from source
 * 3. Store result in cache before returning
 *
 * @remarks
 * **Cache-Aside Pattern**: This is NOT a write-through cache. Updates must
 * manually invalidate the cache to ensure consistency.
 *
 * **Error Handling**: If the fetcher throws an error, it propagates to the caller
 * and is NOT cached. This prevents caching error states.
 *
 * **Concurrency**: Multiple simultaneous requests for the same key will each
 * trigger separate fetches. For high-traffic scenarios, consider request deduplication.
 *
 * @class CachedAPI
 *
 * @example
 * ```typescript
 * // Basic usage with automatic caching
 * const jobs = await CachedAPI.get(
 *   CACHE_KEYS.JOBS_LIST(accountId, filters),
 *   async () => {
 *     const response = await fetch(`/api/jobs?accountId=${accountId}`);
 *     return response.json();
 *   },
 *   { ttl: 5 * 60 * 1000, tags: [CACHE_TAGS.JOBS] }
 * );
 *
 * // After mutation, invalidate cache
 * await updateJob(jobId, updates);
 * CachedAPI.invalidateByTag(CACHE_TAGS.JOBS);
 *
 * // Pattern-based invalidation
 * CachedAPI.invalidateByPattern(`jobs:detail:${jobId}`);
 * ```
 */
export class CachedAPI {
  /**
   * Fetches data with automatic caching
   *
   * @template T - The type of data being fetched
   * @param key - Unique cache key (use CACHE_KEYS helpers)
   * @param fetcher - Async function that fetches the data on cache miss
   * @param options - Cache configuration options
   * @returns Promise resolving to the cached or fetched data
   *
   * @remarks
   * **Cache Hit**: Returns immediately from cache without calling fetcher
   * **Cache Miss**: Calls fetcher, stores result, then returns data
   * **Error Propagation**: Fetcher errors are thrown to caller, not cached
   *
   * **Performance Tip**: Use specific keys and tags for fine-grained invalidation
   * to maximize cache hit rates.
   *
   * @throws Whatever error the fetcher throws on failure
   *
   * @example
   * ```typescript
   * // With error handling
   * try {
   *   const data = await CachedAPI.get(
   *     'my-key',
   *     async () => {
   *       const res = await fetch('/api/data');
   *       if (!res.ok) throw new Error('Fetch failed');
   *       return res.json();
   *     },
   *     { ttl: 10 * 60 * 1000, tags: ['data'] }
   *   );
   * } catch (error) {
   *   console.error('Failed to fetch data:', error);
   * }
   *
   * // With type safety
   * const jobs = await CachedAPI.get<Job[]>(
   *   CACHE_KEYS.JOBS_LIST(accountId, {}),
   *   () => fetchJobsFromAPI(accountId)
   * );
   * ```
   */
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

  /**
   * Invalidates all cache entries matching a specific tag
   *
   * @param tag - The tag to match for invalidation
   *
   * @remarks
   * Delegates to {@link MemoryCache.invalidateByTag}.
   * Use after mutations to ensure cache consistency.
   *
   * **Best Practice**: Invalidate immediately after successful mutations,
   * not before. This prevents race conditions where cached data is invalidated
   * but the mutation fails.
   *
   * @example
   * ```typescript
   * // After creating a job
   * const newJob = await createJob(jobData);
   * CachedAPI.invalidateByTag(CACHE_TAGS.JOBS);
   *
   * // After updating related entities
   * await updateJobAndClient(jobId, clientId, updates);
   * CachedAPI.invalidateByTag(CACHE_TAGS.JOBS);
   * CachedAPI.invalidateByTag(CACHE_TAGS.CLIENTS);
   * ```
   */
  static invalidateByTag(tag: string): void {
    memoryCache.invalidateByTag(tag);
  }

  /**
   * Invalidates all cache entries with keys containing the pattern
   *
   * @param pattern - Substring to match in cache keys
   *
   * @remarks
   * Delegates to {@link MemoryCache.invalidateByPattern}.
   * Useful for invalidating all caches related to a specific entity.
   *
   * @example
   * ```typescript
   * // Invalidate all caches for specific account
   * CachedAPI.invalidateByPattern(`account:${accountId}`);
   *
   * // Invalidate all job detail caches
   * CachedAPI.invalidateByPattern('jobs:detail');
   * ```
   */
  static invalidateByPattern(pattern: string): void {
    memoryCache.invalidateByPattern(pattern);
  }

  /**
   * Clears the entire cache
   *
   * @remarks
   * Delegates to {@link MemoryCache.clear}.
   * Use sparingly - typically only for logout or account switching.
   *
   * **Does NOT stop cleanup interval**. The cache remains functional after clearing.
   *
   * @example
   * ```typescript
   * // On logout
   * function logout() {
   *   CachedAPI.clear();
   *   // Clear auth tokens and redirect...
   * }
   * ```
   */
  static clear(): void {
    memoryCache.clear();
  }
}

/**
 * React hook for cached data fetching with automatic state management
 *
 * This hook provides a declarative way to fetch and cache data in React components.
 * It automatically manages loading, error, and data states, and integrates with
 * the global cache for optimal performance.
 *
 * @template T - The type of data being fetched
 * @param key - Unique cache key (use CACHE_KEYS helpers)
 * @param fetcher - Async function to fetch data on cache miss
 * @param options - Cache configuration options
 * @returns Object containing data, loading state, error state, and refetch function
 *
 * @remarks
 * **Automatic Refetching**: The hook refetches when key, fetcher, or options change.
 * This can cause unnecessary refetches if these values are not memoized.
 *
 * **Dependency Management**: To prevent infinite loops:
 * - Memoize the fetcher function with useCallback
 * - Ensure options object has stable reference (useMemo if needed)
 * - Use consistent cache keys
 *
 * **Initial State**: On mount, loading is true and data is null until first fetch completes.
 *
 * **Cache Integration**: Benefits from global cache - if data is already cached,
 * the loading state will be very brief as CachedAPI returns immediately.
 *
 * **Error Handling**: Errors are caught and stored in the error state. The component
 * must handle error display. Errors are NOT cached.
 *
 * @example
 * ```typescript
 * // Basic usage in a component
 * function JobsList({ accountId }: { accountId: string }) {
 *   const fetcher = useCallback(
 *     async () => {
 *       const res = await fetch(`/api/jobs?accountId=${accountId}`);
 *       return res.json();
 *     },
 *     [accountId]
 *   );
 *
 *   const { data, loading, error, refetch } = useCache<Job[]>(
 *     CACHE_KEYS.JOBS_LIST(accountId, {}),
 *     fetcher,
 *     { ttl: 5 * 60 * 1000, tags: [CACHE_TAGS.JOBS] }
 *   );
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   if (!data) return <EmptyState />;
 *
 *   return (
 *     <div>
 *       <button onClick={refetch}>Refresh</button>
 *       <JobsTable jobs={data} />
 *     </div>
 *   );
 * }
 *
 * // With stable options to prevent refetching
 * const cacheOptions = useMemo(
 *   () => ({ ttl: 10 * 60 * 1000, tags: [CACHE_TAGS.JOBS] }),
 *   []
 * );
 *
 * const { data } = useCache(key, fetcher, cacheOptions);
 * ```
 *
 * @see {@link CachedAPI.get} for the underlying cache implementation
 */
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): {
  /** The fetched data, or null if loading/error/not yet fetched */
  data: T | null;

  /** True while fetching data, false otherwise */
  loading: boolean;

  /** Error object if fetch failed, null otherwise */
  error: Error | null;

  /**
   * Function to manually refetch data, bypassing cache
   *
   * @remarks
   * Calling refetch will:
   * 1. Set loading to true
   * 2. Clear previous error
   * 3. Fetch fresh data (cache hit if available)
   * 4. Update data state or error state
   * 5. Set loading to false
   */
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
 * Server-side caching utilities for Next.js integration
 *
 * @remarks
 * These utilities are designed to work with Next.js App Router caching features:
 * - Server Components with React cache() function
 * - Route Handlers with revalidation options
 * - Tag-based invalidation via revalidateTag()
 *
 * **Note**: This is a placeholder implementation. For full Next.js cache integration,
 * import `revalidateTag` from 'next/cache' and use it in Server Actions.
 *
 * @see {@link https://nextjs.org/docs/app/building-your-application/caching}
 *
 * @example
 * ```typescript
 * // In a Server Component
 * import { cache } from 'react';
 * import { nextCache } from '@/lib/cache';
 *
 * const getJobs = cache(async (accountId: string) => {
 *   const jobs = await db.query.jobs.findMany({
 *     where: eq(jobs.accountId, accountId)
 *   });
 *   return jobs;
 * });
 *
 * // In a Route Handler (app/api/jobs/route.ts)
 * export const revalidate = 300; // 5 minutes
 * export const tags = ['jobs'];
 *
 * // In a Server Action to invalidate
 * import { revalidateTag } from 'next/cache';
 *
 * async function updateJob(jobId: string, data: JobUpdate) {
 *   await db.update(jobs).set(data).where(eq(jobs.id, jobId));
 *   revalidateTag('jobs'); // Invalidate Next.js cache
 *   invalidateCache.jobs(); // Invalidate client cache
 * }
 * ```
 */
export const nextCache = {
  /**
   * Placeholder for Next.js cache tag revalidation
   *
   * @param tag - Cache tag to revalidate
   * @returns The tag string (for compatibility)
   *
   * @remarks
   * **Production Usage**: Import and use `revalidateTag` from 'next/cache' instead.
   * This placeholder exists to maintain consistent API across client and server.
   *
   * @example
   * ```typescript
   * // In production, use Next.js revalidateTag
   * import { revalidateTag } from 'next/cache';
   *
   * async function updateData() {
   *   await performUpdate();
   *   revalidateTag('data'); // Next.js server cache
   *   invalidateCache.all(); // Client-side cache
   * }
   * ```
   */
  revalidateTag: (tag: string) => {
    // This would be used with Next.js cache() function
    return tag;
  },

  /**
   * Generates cache configuration for Next.js API routes
   *
   * @param options - Cache configuration options
   * @param options.revalidate - Revalidation time in seconds (default: 300)
   * @param options.tags - Cache tags for invalidation
   * @returns Configuration object for Next.js route handlers
   *
   * @remarks
   * Use this to standardize cache configuration across API routes.
   *
   * @example
   * ```typescript
   * // In app/api/jobs/route.ts
   * import { nextCache } from '@/lib/cache';
   *
   * const config = nextCache.apiCache({
   *   revalidate: 600, // 10 minutes
   *   tags: ['jobs', 'all']
   * });
   *
   * export const revalidate = config.revalidate;
   * export const tags = config.tags;
   *
   * export async function GET() {
   *   const jobs = await fetchJobs();
   *   return Response.json(jobs);
   * }
   * ```
   */
  apiCache: (options: { revalidate?: number; tags?: string[] }) => {
    return {
      revalidate: options.revalidate || 300, // 5 minutes default
      tags: options.tags || [],
    };
  },
};

/**
 * Convenient helper functions for cache invalidation by entity type
 *
 * These helpers provide a simple, semantic API for cache invalidation after
 * data mutations. Each function invalidates all cache entries tagged with
 * the corresponding entity type.
 *
 * @remarks
 * **When to Invalidate**:
 * - After CREATE operations: Invalidate list caches
 * - After UPDATE operations: Invalidate both detail and list caches
 * - After DELETE operations: Invalidate list caches (detail cache will naturally expire)
 * - After cross-entity operations: Invalidate multiple entity types
 *
 * **Best Practice**: Call invalidation helpers AFTER successful mutations,
 * not before. This prevents cache invalidation when mutations fail.
 *
 * @example
 * ```typescript
 * import { invalidateCache } from '@/lib/cache';
 *
 * // After creating a job
 * async function createJob(jobData: JobCreate) {
 *   const job = await db.insert(jobs).values(jobData).returning();
 *   invalidateCache.jobs(); // Invalidate all job caches
 *   return job;
 * }
 *
 * // After updating a client
 * async function updateClient(clientId: string, updates: ClientUpdate) {
 *   await db.update(clients).set(updates).where(eq(clients.id, clientId));
 *   invalidateCache.clients(); // Invalidate client caches
 *   // If client has jobs, might also invalidate jobs
 *   invalidateCache.jobs();
 * }
 *
 * // After converting estimate to job
 * async function convertEstimateToJob(estimateId: string) {
 *   const job = await createJobFromEstimate(estimateId);
 *   invalidateCache.estimates(); // Estimate status changed
 *   invalidateCache.jobs(); // New job created
 *   return job;
 * }
 *
 * // On logout
 * function handleLogout() {
 *   invalidateCache.all(); // Clear all cached data
 *   // Clear auth and redirect...
 * }
 * ```
 */
export const invalidateCache = {
  /**
   * Invalidates all job-related cache entries
   *
   * @remarks
   * Use after: Creating jobs, updating jobs, deleting jobs,
   * changing job status, updating job line items, etc.
   */
  jobs: () => CachedAPI.invalidateByTag(CACHE_TAGS.JOBS),

  /**
   * Invalidates all client-related cache entries
   *
   * @remarks
   * Use after: Creating clients, updating clients, deleting clients,
   * merging clients, updating client balances, etc.
   */
  clients: () => CachedAPI.invalidateByTag(CACHE_TAGS.CLIENTS),

  /**
   * Invalidates all estimate-related cache entries
   *
   * @remarks
   * Use after: Creating estimates, updating estimates, sending estimates,
   * approving estimates, converting to jobs, etc.
   */
  estimates: () => CachedAPI.invalidateByTag(CACHE_TAGS.ESTIMATES),

  /**
   * Invalidates all invoice-related cache entries
   *
   * @remarks
   * Use after: Creating invoices, recording payments, sending invoices,
   * voiding invoices, updating invoice status, etc.
   */
  invoices: () => CachedAPI.invalidateByTag(CACHE_TAGS.INVOICES),

  /**
   * Clears the entire cache (all entities)
   *
   * @remarks
   * **Use sparingly**. Only for:
   * - User logout
   * - Account switching
   * - Major application state changes
   * - Manual cache reset (debugging)
   *
   * This does NOT stop the cleanup interval - cache remains functional.
   */
  all: () => CachedAPI.clear(),
};
