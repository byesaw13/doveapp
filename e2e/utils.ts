import { APIRequestContext, Page } from '@playwright/test';
import { config, UrlType, Severity } from './config';
import { routes } from './routes';

// Preflight: Validate config sanity
export function preflightPolicyCheck(): void {
  const errors: string[] = [];

  // Check regex patterns are valid
  const patterns = [
    ...config.ignoredRoutes,
    ...config.blockedRoutePatterns,
    ...config.redirects.allowedFinalPaths,
    ...config.redirects.allowedIntermediatePaths,
    ...config.console.ignoredPatterns,
    ...config.network.ignoredHosts,
    ...config.network.ignoredEndpoints,
    ...config.click.dangerWords,
    ...config.acceptedFailures.map((af) => af.targetPattern),
  ];

  for (const pattern of patterns) {
    try {
      new RegExp(pattern);
    } catch (e) {
      errors.push(
        `Invalid regex pattern: ${pattern} - ${(e as Error).message}`
      );
    }
  }

  // Check strip query params are valid
  for (const param of config.url.stripQueryParams) {
    try {
      new RegExp(param);
    } catch (e) {
      errors.push(
        `Invalid strip query param regex: ${param} - ${(e as Error).message}`
      );
    }
  }

  // Check accepted failures expiry dates
  const now = new Date();
  for (const af of config.acceptedFailures) {
    const expiry = new Date(af.expiresOn);
    if (isNaN(expiry.getTime())) {
      errors.push(`Invalid expiry date for accepted failure: ${af.expiresOn}`);
    } else if (expiry < now) {
      errors.push(
        `Expired accepted failure: ${af.targetPattern.source} expired on ${af.expiresOn}`
      );
    }
  }

  // Check crawl bounds make sense
  if (config.crawl.maxRoutes < 1) errors.push('maxRoutes must be >= 1');
  if (config.crawl.maxDepth < 0) errors.push('maxDepth must be >= 0');
  if (config.crawl.maxLinksPerPage < 1)
    errors.push('maxLinksPerPage must be >= 1');
  if (config.crawl.maxSameTargetPerSource < 1)
    errors.push('maxSameTargetPerSource must be >= 1');

  // Check timeouts
  if (config.timeouts.pageLoadMs < 1000)
    errors.push('pageLoadMs must be >= 1000ms');
  if (config.timeouts.requestMs < 500)
    errors.push('requestMs must be >= 500ms');

  // Check redirects
  if (config.redirects.maxRedirectHops < 1)
    errors.push('maxRedirectHops must be >= 1');

  if (errors.length > 0) {
    throw new Error(`Config validation failed:\n${errors.join('\n')}`);
  }
}

// Classify URL type
export function classifyUrl(url: string): UrlType {
  if (!url.startsWith('/')) return 'external';

  if (url.startsWith('/api/') || url.includes('/api/')) return 'api';

  const assetExtensions = [
    '.js',
    '.css',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.ico',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
  ];
  if (assetExtensions.some((ext) => url.toLowerCase().endsWith(ext)))
    return 'asset';

  return 'page'; // Default to page
}

// Calculate severity
export function calculateSeverity(
  url: string,
  errorType: string,
  depth: number
): Severity {
  // Always critical
  if (routes.some((route) => route === url)) return 'critical'; // Seed routes
  if (url.includes('/dashboard')) return 'critical';
  if (errorType.includes('HTTP 5')) return 'critical'; // API 5xx

  // Depth-based
  if (depth <= 1) return 'high';
  if (depth <= 3) return 'medium';
  return 'low';
}

// Preflight: Check auth for role
export async function preflightAuthCheck(
  page: Page,
  request: APIRequestContext,
  role: 'admin' | 'tech' | 'customer'
): Promise<void> {
  const protectedPage =
    role === 'admin' ? '/admin' : role === 'tech' ? '/tech' : '/customer';
  const testApiEndpoint = '/api/health'; // Assuming a simple endpoint

  // Browser navigation check - use current page if already on protected route
  const currentUrl = page.url();
  const isOnProtectedRoute =
    (role === 'admin' && currentUrl.includes('/admin')) ||
    (role === 'tech' && currentUrl.includes('/tech')) ||
    (role === 'customer' && currentUrl.includes('/customer'));

  if (!isOnProtectedRoute) {
    await page.goto(protectedPage);
  }

  // Check if redirected to login
  const finalUrl = page.url();
  if (finalUrl.includes('/auth/login')) {
    throw new Error(
      `${role} auth failed: redirected to login on ${protectedPage}`
    );
  }

  // Authenticated request check
  const response = await request.get(testApiEndpoint);
  if (response.status() === 401 || response.status() === 302) {
    throw new Error(
      `${role} auth failed: authenticated request to ${testApiEndpoint} failed with ${response.status()}`
    );
  }
}
