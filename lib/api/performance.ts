/**
 * API Performance Monitoring Utilities
 *
 * Provides tools for monitoring and logging API endpoint performance
 */

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: string;
  queryCount?: number;
  cacheHit?: boolean;
}

/**
 * Performance logger class for tracking API metrics
 */
export class PerformanceLogger {
  private startTime: number;
  private endpoint: string;
  private method: string;
  private queryCount: number = 0;

  constructor(endpoint: string, method: string) {
    this.startTime = performance.now();
    this.endpoint = endpoint;
    this.method = method;
  }

  /**
   * Increment the database query counter
   */
  incrementQueryCount(): void {
    this.queryCount++;
  }

  /**
   * Log the completion of the request with metrics
   */
  complete(status: number, cacheHit?: boolean): PerformanceMetrics {
    const duration = performance.now() - this.startTime;
    const metrics: PerformanceMetrics = {
      endpoint: this.endpoint,
      method: this.method,
      duration: Math.round(duration * 100) / 100, // Round to 2 decimals
      status,
      timestamp: new Date().toISOString(),
      queryCount: this.queryCount,
      cacheHit,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole(metrics);
    }

    // Log slow requests (>1000ms) in production
    if (duration > 1000) {
      console.warn('⚠️  Slow API request:', metrics);
    }

    return metrics;
  }

  private logToConsole(metrics: PerformanceMetrics): void {
    const emoji = this.getPerformanceEmoji(metrics.duration);
    const cache = metrics.cacheHit ? '💾 CACHED' : '';

    console.log(
      `${emoji} ${metrics.method} ${metrics.endpoint} - ${metrics.duration}ms ${cache}`
    );

    if (metrics.queryCount && metrics.queryCount > 0) {
      console.log(`   📊 Database queries: ${metrics.queryCount}`);
    }
  }

  private getPerformanceEmoji(duration: number): string {
    if (duration < 100) return '⚡'; // Fast
    if (duration < 500) return '✅'; // Good
    if (duration < 1000) return '⚠️'; // Slow
    return '🐌'; // Very slow
  }
}

/**
 * Middleware wrapper to automatically track API performance
 *
 * @example
 * ```ts
 * export async function GET(request: NextRequest) {
 *   return withPerformanceTracking(request, async (logger) => {
 *     const data = await fetchData();
 *     logger.incrementQueryCount();
 *     return Response.json({ data });
 *   });
 * }
 * ```
 */
export async function withPerformanceTracking(
  request: Request,
  handler: (logger: PerformanceLogger) => Promise<Response>
): Promise<Response> {
  const url = new URL(request.url);
  const logger = new PerformanceLogger(url.pathname, request.method);

  try {
    const response = await handler(logger);
    const metrics = logger.complete(response.status);

    // Add performance headers to response
    const headers = new Headers(response.headers);
    headers.set('X-Response-Time', `${metrics.duration}ms`);

    if (metrics.queryCount) {
      headers.set('X-Query-Count', metrics.queryCount.toString());
    }

    // Clone response with new headers
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    logger.complete(500);
    throw error;
  }
}

/**
 * Database query wrapper that tracks query count
 *
 * @example
 * ```ts
 * const result = await trackQuery(logger, () =>
 *   supabase.from('clients').select('*')
 * );
 * ```
 */
export async function trackQuery<T>(
  logger: PerformanceLogger,
  queryFn: () => Promise<T>
): Promise<T> {
  logger.incrementQueryCount();
  return await queryFn();
}

/**
 * Aggregates performance metrics for reporting
 */
export class PerformanceAggregator {
  private metrics: PerformanceMetrics[] = [];

  add(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }

  getStats(): {
    avgDuration: number;
    maxDuration: number;
    minDuration: number;
    totalRequests: number;
    slowRequests: number;
    avgQueriesPerRequest: number;
  } {
    if (this.metrics.length === 0) {
      return {
        avgDuration: 0,
        maxDuration: 0,
        minDuration: 0,
        totalRequests: 0,
        slowRequests: 0,
        avgQueriesPerRequest: 0,
      };
    }

    const durations = this.metrics.map((m) => m.duration);
    const queries = this.metrics
      .map((m) => m.queryCount || 0)
      .filter((q) => q > 0);

    return {
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      totalRequests: this.metrics.length,
      slowRequests: this.metrics.filter((m) => m.duration > 1000).length,
      avgQueriesPerRequest:
        queries.length > 0
          ? queries.reduce((a, b) => a + b, 0) / queries.length
          : 0,
    };
  }

  getByEndpoint(endpoint: string): PerformanceMetrics[] {
    return this.metrics.filter((m) => m.endpoint === endpoint);
  }

  clear(): void {
    this.metrics = [];
  }
}

// Global aggregator instance (use cautiously in serverless environments)
export const globalAggregator = new PerformanceAggregator();
