// tests/e2e/config.ts

// URL Classification Types
export type UrlType = 'page' | 'api' | 'asset' | 'external';

// Severity Levels
export type Severity = 'critical' | 'high' | 'medium' | 'low';

export const config = {
  sameOriginOnly: true,

  crawl: {
    maxRoutes: 200,
    maxDepth: 6,
    maxLinksPerPage: 75,
    maxSameTargetPerSource: 5,
  },

  url: {
    removeHash: true,
    removeTrailingSlash: true,
    stripQueryParams: [
      /^utm_/i,
      /^fbclid$/i,
      /^gclid$/i,
      /^yclid$/i,
      /^_ga$/i,
      /^_gid$/i,
      /^cache$/i,
      /^t$/i,
      /^ts$/i,
      /^timestamp$/i,
    ],
    allowQueryParams: [],
  },

  ignoredRoutes: [
    /^\/auth\/login$/i,
    /^\/auth\/forgot-password$/i,
    /^\/auth\/reset-password$/i,
  ],

  blockedRoutePatterns: [
    /^\/logout/i,
    /^\/auth\/callback/i,
    /^\/api\//i,
    /^\/webhook/i,
    /^\/payments?/i,
  ],

  redirects: {
    allowedFinalPaths: [
      /^\/$/i,
      /^\/auth\/login/i,
      /^\/admin/i,
      /^\/tech/i,
      /^\/customer/i,
      /^\/settings/i,
    ],
    allowedIntermediatePaths: [/^\/auth\/login/i],
    maxRedirectHops: 5,
  },

  console: {
    ignoredPatterns: [
      /Failed to load resource: net::ERR_BLOCKED_BY_CLIENT/i,
      /Warning: ReactDOM\.render is no longer supported/i,
    ],
  },

  network: {
    ignoredHosts: [
      /googletagmanager\.com/i,
      /google-analytics\.com/i,
      /hotjar\.com/i,
      /segment\.com/i,
    ],
    ignoredEndpoints: [/^\/api\/health$/i, /^\/favicon\.ico$/i],
    warnStatusCodes: [401, 403],
  },

  click: {
    navButtonSelector: '[data-e2e-click="nav"]',
    dangerWords: [
      /delete/i,
      /remove/i,
      /archive/i,
      /cancel/i,
      /submit/i,
      /pay/i,
      /charge/i,
      /refund/i,
    ],
  },

  acceptedFailures: [] as Array<{
    targetPattern: RegExp;
    reason: string;
    expiresOn: string; // YYYY-MM-DD
  }>,

  gates: {
    failOnCriticalBrokenLinks: true,
    criticalDepth: 2,
    failOnConsoleErrors: true,
    failOnApi5xx: true,
  },

  timeouts: {
    pageLoadMs: 30_000,
    requestMs: 15_000,
  },
};
