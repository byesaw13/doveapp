import { test, APIRequestContext } from '@playwright/test';
import { routes } from './routes';
import { config } from './config';
import { waitForAppReady, loginAsAdmin } from './auth';
import {
  preflightPolicyCheck,
  preflightAuthCheck,
  classifyUrl,
  calculateSeverity,
} from './utils';
import fs from 'fs';
import path from 'path';

interface BrokenLink {
  source: string;
  target: string;
  error: string;
  reproduction?: string;
  accepted?: boolean;
  depth?: number;
}

interface PageError {
  page: string;
  message: string;
  type: 'console' | 'network';
  count: number;
  isWarning?: boolean;
}

interface DiscoveredRoute {
  url: string;
  depth: number;
  discoveredFrom: string;
  discoveredViaText: string;
}

interface QASummary {
  totalPagesVisited: number;
  totalLinksChecked: number;
  brokenLinks: BrokenLink[];
  pagesWithErrors: { [url: string]: number };
  consoleErrors: PageError[];
  networkErrors: PageError[];
  topBrokenTargets: { target: string; count: number }[];
  topNoisyPages: { page: string; errorCount: number }[];
  discoveredRoutes: DiscoveredRoute[];
  qualityGatePassed: boolean;
  qualityGateReasons: string[];
}

test.describe('Link Audit', () => {
  let qaSummary: QASummary = {
    totalPagesVisited: 0,
    totalLinksChecked: 0,
    brokenLinks: [],
    pagesWithErrors: {},
    consoleErrors: [],
    networkErrors: [],
    topBrokenTargets: [],
    topNoisyPages: [],
    discoveredRoutes: [],
    qualityGatePassed: true,
    qualityGateReasons: [],
  };

  const consoleErrorMap = new Map<string, { message: string; count: number }>();
  const networkErrorMap = new Map<
    string,
    { message: string; count: number; isWarning?: boolean }
  >();

  test.beforeEach(async ({ page }) => {
    // Collect console errors (with filtering)
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const message = msg.text();
        const ignored = config.console.ignoredPatterns.some((pattern) =>
          pattern.test(message)
        );
        if (!ignored) {
          const key = `${page.url()}|${message}`;
          if (!consoleErrorMap.has(key)) {
            consoleErrorMap.set(key, { message, count: 0 });
          }
          consoleErrorMap.get(key)!.count++;
        }
      }
    });

    // Collect network errors (with filtering)
    page.on('response', (response) => {
      if (!response.ok() && response.status() >= 400) {
        const url = response.url();
        const ignored =
          config.network.ignoredHosts.some((host) => host.test(url)) ||
          config.network.ignoredEndpoints.some((endpoint) =>
            endpoint.test(url)
          );
        if (!ignored) {
          const status = response.status();
          const isWarning = config.network.warnStatusCodes.includes(status);
          const key = `${page.url()}|HTTP ${status}: ${url}`;
          if (!networkErrorMap.has(key)) {
            networkErrorMap.set(key, {
              message: `HTTP ${status}: ${url}`,
              count: 0,
              isWarning,
            });
          }
          networkErrorMap.get(key)!.count++;
        }
      }
    });
  });

  test.skip('audit all routes', async ({ page, request }) => {
    test.setTimeout(120000); // Set timeout to 2 minutes for comprehensive audit
    // Preflight policy check
    preflightPolicyCheck();

    // Setup auth by logging in first
    await loginAsAdmin(page);

    // Verify auth is working
    await preflightAuthCheck(page, request, 'admin');

    const visited = new Set<string>();
    const queue: Array<{
      url: string;
      depth: number;
      discoveredFrom: string;
      discoveredViaText: string;
    }> = routes.map((route) => ({
      url: route,
      depth: 0,
      discoveredFrom: 'seed',
      discoveredViaText: 'initial route',
    }));
    const brokenTargets = new Map<string, number>();
    const pageErrorCounts = new Map<string, number>();
    const targetCounts = new Map<string, Map<string, number>>();
    const redirectChains = new Map<string, string[]>(); // Track redirect chains for loop detection

    // URL normalization
    const normalizeUrl = (url: string): string => {
      try {
        const parsed = new URL(url, 'http://localhost:3000');
        if (config.url.removeHash) {
          parsed.hash = '';
        }
        if (
          config.url.removeTrailingSlash &&
          parsed.pathname !== '/' &&
          parsed.pathname.endsWith('/')
        ) {
          parsed.pathname = parsed.pathname.slice(0, -1);
        }
        // Strip query params
        const searchParams = new URLSearchParams(parsed.search);
        for (const param of config.url.stripQueryParams) {
          searchParams.delete(param.source);
        }
        parsed.search = searchParams.toString();
        return parsed.pathname + parsed.search + parsed.hash;
      } catch {
        return url;
      }
    };

    // Check if URL should be blocked
    const isBlocked = (url: string): boolean => {
      return config.blockedRoutePatterns.some((pattern) => pattern.test(url));
    };

    // Check if URL is ignored
    const isIgnored = (url: string): boolean => {
      return config.ignoredRoutes.some((pattern) => pattern.test(url));
    };

    // Check same origin
    const isSameOrigin = (url: string): boolean => {
      if (!config.sameOriginOnly) return true;
      try {
        const parsed = new URL(url, 'http://localhost:3000');
        return parsed.origin === 'http://localhost:3000';
      } catch {
        return false;
      }
    };

    while (queue.length > 0 && visited.size < config.crawl.maxRoutes) {
      const {
        url: route,
        depth,
        discoveredFrom,
        discoveredViaText,
      } = queue.shift()!;
      const normalizedRoute = normalizeUrl(route);

      if (
        visited.has(normalizedRoute) ||
        isBlocked(normalizedRoute) ||
        isIgnored(normalizedRoute) ||
        !isSameOrigin(normalizedRoute)
      ) {
        continue;
      }

      visited.add(normalizedRoute);
      qaSummary.totalPagesVisited++;
      qaSummary.discoveredRoutes.push({
        url: normalizedRoute,
        depth,
        discoveredFrom,
        discoveredViaText,
      });

      try {
        await page.goto(normalizedRoute, {
          timeout: config.timeouts.pageLoadMs,
        });
        await waitForAppReady(page);

        // Check page status
        const status = await page.evaluate(() => ({
          status:
            document.title.includes('404') || document.title.includes('500')
              ? 404
              : 200,
          title: document.title,
        }));

        if (status.status !== 200) {
          qaSummary.pagesWithErrors[normalizedRoute] = status.status;
        }

        // Discover new links
        const links = await page.locator('a[href]').all();
        const linksToProcess = links.slice(0, config.crawl.maxLinksPerPage);
        const sourceCounts = targetCounts.get(normalizedRoute) || new Map();

        for (const link of linksToProcess) {
          const href = await link.getAttribute('href');
          if (!href || !href.startsWith('/') || href.startsWith('//')) continue;

          const normalizedHref = normalizeUrl(href);
          if (
            isBlocked(normalizedHref) ||
            isIgnored(normalizedHref) ||
            !isSameOrigin(normalizedHref)
          )
            continue;

          // Check max same target per source
          const count = sourceCounts.get(normalizedHref) || 0;
          if (count >= config.crawl.maxSameTargetPerSource) continue;
          sourceCounts.set(normalizedHref, count + 1);

          // Enqueue if not visited and within depth
          if (
            !visited.has(normalizedHref) &&
            !queue.find((q) => q.url === normalizedHref) &&
            depth < config.crawl.maxDepth
          ) {
            const linkText = (await link.textContent()) || '';
            queue.push({
              url: normalizedHref,
              depth: depth + 1,
              discoveredFrom: normalizedRoute,
              discoveredViaText: linkText.trim(),
            });
          }
        }

        targetCounts.set(normalizedRoute, sourceCounts);

        // Validate links based on classification
        for (const link of linksToProcess) {
          const href = await link.getAttribute('href');
          if (!href || !href.startsWith('/') || href.startsWith('//')) continue;

          const normalizedHref = normalizeUrl(href);
          if (
            isBlocked(normalizedHref) ||
            isIgnored(normalizedHref) ||
            !isSameOrigin(normalizedHref)
          )
            continue;

          qaSummary.totalLinksChecked++;

          const urlType = classifyUrl(normalizedHref);
          const accepted = config.acceptedFailures.some((af) =>
            af.targetPattern.test(normalizedHref)
          );

          try {
            let isBroken = false;
            let error = '';

            if (urlType === 'page') {
              // For pages, we already visited them via discovery, so check if they were added to pagesWithErrors
              if (qaSummary.pagesWithErrors[normalizedHref]) {
                isBroken = true;
                error = `Page error: ${qaSummary.pagesWithErrors[normalizedHref]}`;
              }
            } else if (urlType === 'api' || urlType === 'asset') {
              // For APIs and assets, check with HTTP request
              const response = await request.get(normalizedHref, {
                timeout: config.timeouts.requestMs,
              });
              if (!response.ok()) {
                const status = response.status();
                error = `HTTP ${status}`;

                // Check redirects with loop detection
                if (status >= 300 && status < 400) {
                  const location = response.headers()['location'];
                  if (location) {
                    const normalizedLocation = normalizeUrl(location);

                    // Check for redirect loop
                    const chain = redirectChains.get(normalizedHref) || [];
                    if (chain.includes(normalizedLocation)) {
                      error += ` (redirect loop detected)`;
                    } else if (
                      chain.length >= config.redirects.maxRedirectHops
                    ) {
                      error += ` (too many redirects: ${chain.length})`;
                    } else {
                      redirectChains.set(normalizedHref, [
                        ...chain,
                        normalizedLocation,
                      ]);
                      if (
                        !config.redirects.allowedFinalPaths.some((pattern) =>
                          pattern.test(normalizedLocation)
                        )
                      ) {
                        error += ` (redirect to ${normalizedLocation} not allowed)`;
                      }
                    }
                  }
                }

                isBroken = true;
              }
            } else if (urlType === 'external') {
              // For external links, basic reachability check (optional, can be skipped)
              try {
                await request.get(normalizedHref, {
                  timeout: config.timeouts.requestMs,
                });
              } catch (e) {
                isBroken = true;
                error = `External link unreachable: ${(e as Error).message}`;
              }
            }

            if (isBroken) {
              qaSummary.brokenLinks.push({
                source: normalizedRoute,
                target: normalizedHref,
                error,
                reproduction: `Visit ${normalizedRoute}, click link to ${normalizedHref}`,
                accepted,
                depth,
              });
              if (!accepted) {
                brokenTargets.set(
                  normalizedHref,
                  (brokenTargets.get(normalizedHref) || 0) + 1
                );
              }
            }
          } catch (error) {
            const accepted = config.acceptedFailures.some((af) =>
              af.targetPattern.test(normalizedHref)
            );
            qaSummary.brokenLinks.push({
              source: normalizedRoute,
              target: normalizedHref,
              error: error instanceof Error ? error.message : String(error),
              reproduction: `Visit ${normalizedRoute}, click link to ${normalizedHref}`,
              accepted,
              depth,
            });
            if (!accepted) {
              brokenTargets.set(
                normalizedHref,
                (brokenTargets.get(normalizedHref) || 0) + 1
              );
            }
          }
        }

        // Validate navigation buttons
        const navButtons = await page
          .locator(config.click.navButtonSelector)
          .all();
        for (const button of navButtons) {
          const text = (await button.textContent()) || '';
          const trimmedText = text.trim();

          if (!trimmedText) continue;

          // Check danger words
          const hasDangerWord = config.click.dangerWords.some((word) =>
            word.test(trimmedText)
          );
          if (hasDangerWord) continue;

          qaSummary.totalLinksChecked++;

          try {
            const beforeUrl = page.url();
            await button.click();
            await waitForAppReady(page);
            const afterUrl = page.url();

            if (beforeUrl === afterUrl) {
              qaSummary.brokenLinks.push({
                source: normalizedRoute,
                target: `nav-button: ${trimmedText}`,
                error: 'No URL change after click',
                reproduction: `Visit ${normalizedRoute}, click "${trimmedText}" button`,
                depth,
              });
            } else {
              // Go back
              await page.goBack();
              await waitForAppReady(page);
            }
          } catch (error) {
            qaSummary.brokenLinks.push({
              source: normalizedRoute,
              target: `nav-button: ${trimmedText}`,
              error: error instanceof Error ? error.message : String(error),
              reproduction: `Visit ${normalizedRoute}, click "${trimmedText}" button`,
              depth,
            });
          }
        }
      } catch (error) {
        qaSummary.pagesWithErrors[normalizedRoute] = 500;
      }
    }

    // Process errors
    for (const [key, data] of consoleErrorMap) {
      const [pageUrl] = key.split('|');
      qaSummary.consoleErrors.push({
        page: pageUrl,
        message: data.message,
        type: 'console',
        count: data.count,
      });
      pageErrorCounts.set(
        pageUrl,
        (pageErrorCounts.get(pageUrl) || 0) + data.count
      );
    }

    for (const [key, data] of networkErrorMap) {
      const [pageUrl] = key.split('|');
      qaSummary.networkErrors.push({
        page: pageUrl,
        message: data.message,
        type: 'network',
        count: data.count,
        isWarning: data.isWarning,
      });
      pageErrorCounts.set(
        pageUrl,
        (pageErrorCounts.get(pageUrl) || 0) + data.count
      );
    }

    // Top broken targets (only non-accepted)
    qaSummary.topBrokenTargets = Array.from(brokenTargets.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([target, count]) => ({ target, count }));

    // Top noisy pages
    qaSummary.topNoisyPages = Array.from(pageErrorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([page, errorCount]) => ({ page, errorCount }));

    // Quality gates
    const criticalBrokenLinks = qaSummary.brokenLinks.filter(
      (link) =>
        !link.accepted && (link.depth ?? 0) <= config.gates.criticalDepth
    );
    const unignoredConsoleErrors = qaSummary.consoleErrors.filter(
      () => config.gates.failOnConsoleErrors
    );
    const api5xxErrors = qaSummary.networkErrors.filter(
      (error) =>
        config.gates.failOnApi5xx &&
        error.message.includes('HTTP 5') &&
        !error.isWarning
    );

    if (
      config.gates.failOnCriticalBrokenLinks &&
      criticalBrokenLinks.length > 0
    ) {
      qaSummary.qualityGatePassed = false;
      qaSummary.qualityGateReasons.push(
        `${criticalBrokenLinks.length} critical broken links`
      );
    }
    if (config.gates.failOnConsoleErrors && unignoredConsoleErrors.length > 0) {
      qaSummary.qualityGatePassed = false;
      qaSummary.qualityGateReasons.push(
        `${unignoredConsoleErrors.length} console errors`
      );
    }
    if (config.gates.failOnApi5xx && api5xxErrors.length > 0) {
      qaSummary.qualityGatePassed = false;
      qaSummary.qualityGateReasons.push(
        `${api5xxErrors.length} API 5xx errors`
      );
    }
  });

  test.afterAll(async () => {
    // Generate timestamped output directory
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\..+/, '')
      .replace('T', '-');
    const baseOutputDir = path.join(process.cwd(), 'e2e/output');
    const timestampedDir = path.join(baseOutputDir, timestamp);
    const latestDir = path.join(baseOutputDir, 'latest');

    let md = '';

    try {
      // Create timestamped directory
      if (!fs.existsSync(timestampedDir)) {
        fs.mkdirSync(timestampedDir, { recursive: true });
      }

      // Generate improved Markdown
      md = '# QA Summary Report\n\n';
      md += `**Generated:** ${new Date().toISOString()}\n`;
      md += `**Total Pages Visited:** ${qaSummary.totalPagesVisited}\n`;
      md += `**Total Links Checked:** ${qaSummary.totalLinksChecked}\n\n`;

      // Quality gate result
      md += '## Quality Gate Result\n';
      md += `**Status:** ${qaSummary.qualityGatePassed ? '✅ PASSED' : '❌ FAILED'}\n`;
      if (!qaSummary.qualityGatePassed) {
        md += '**Reasons:**\n';
        qaSummary.qualityGateReasons.forEach((reason) => {
          md += `- ${reason}\n`;
        });
      }
      md += '\n';

      // Top broken targets
      if (qaSummary.topBrokenTargets.length > 0) {
        md += '## Top Broken Targets\n';
        qaSummary.topBrokenTargets.forEach((item) => {
          md += `- ${item.target}: ${item.count} broken references\n`;
        });
        md += '\n';
      }

      // Top noisy pages
      if (qaSummary.topNoisyPages.length > 0) {
        md += '## Top Noisy Pages\n';
        qaSummary.topNoisyPages.forEach((item) => {
          md += `- ${item.page}: ${item.errorCount} errors\n`;
        });
        md += '\n';
      }

      // Broken links with reproduction steps
      md += '## Broken Links\n';
      if (qaSummary.brokenLinks.length === 0) {
        md += 'None found\n\n';
      } else {
        qaSummary.brokenLinks.forEach((link) => {
          md += `### ${link.source} → ${link.target}\n`;
          md += `- **Error:** ${link.error}\n`;
          if (link.reproduction) {
            md += `- **Reproduction:** ${link.reproduction}\n`;
          }
          if (link.accepted) {
            md += `- **Status:** Accepted debt\n`;
          }
          md += '\n';
        });
      }

      md += '## Pages with Errors\n';
      const errorPages = Object.entries(qaSummary.pagesWithErrors);
      if (errorPages.length === 0) {
        md += 'None found\n\n';
      } else {
        errorPages.forEach(([url, status]) => {
          md += `- ${url}: HTTP ${status}\n`;
        });
        md += '\n';
      }

      // Group console errors by type
      md += '## Console Errors (Grouped)\n';
      if (qaSummary.consoleErrors.length === 0) {
        md += 'None found\n\n';
      } else {
        const grouped = qaSummary.consoleErrors.reduce(
          (acc, error) => {
            const key = error.message;
            if (!acc[key]) acc[key] = [];
            acc[key].push(error);
            return acc;
          },
          {} as Record<string, typeof qaSummary.consoleErrors>
        );

        Object.entries(grouped).forEach(([message, errors]) => {
          const totalCount = errors.reduce((sum, e) => sum + e.count, 0);
          md += `- **${message}** (${totalCount} total)\n`;
          errors.slice(0, 3).forEach((error) => {
            md += `  - ${error.page} (${error.count} times)\n`;
          });
          if (errors.length > 3) {
            md += `  - ... and ${errors.length - 3} more pages\n`;
          }
        });
        md += '\n';
      }

      // Group network errors by endpoint
      md += '## Network Errors (Grouped)\n';
      if (qaSummary.networkErrors.length === 0) {
        md += 'None found\n\n';
      } else {
        const grouped = qaSummary.networkErrors.reduce(
          (acc, error) => {
            const key = error.message;
            if (!acc[key]) acc[key] = [];
            acc[key].push(error);
            return acc;
          },
          {} as Record<string, typeof qaSummary.networkErrors>
        );

        Object.entries(grouped).forEach(([message, errors]) => {
          const totalCount = errors.reduce((sum, e) => sum + e.count, 0);
          const isWarning = errors[0].isWarning;
          md += `- **${message}** (${totalCount} total${isWarning ? ' - WARNING' : ''})\n`;
          errors.slice(0, 3).forEach((error) => {
            md += `  - ${error.page} (${error.count} times)\n`;
          });
          if (errors.length > 3) {
            md += `  - ... and ${errors.length - 3} more pages\n`;
          }
        });
        md += '\n';
      }

      // Discovered routes
      md += '## Discovered Routes\n';
      qaSummary.discoveredRoutes.slice(0, 20).forEach((route) => {
        md += `- ${route.url} (depth ${route.depth}, from ${route.discoveredFrom})\n`;
      });
      if (qaSummary.discoveredRoutes.length > 20) {
        md += `- ... and ${qaSummary.discoveredRoutes.length - 20} more routes\n`;
      }
      md += '\n';
    } catch (error) {
      console.error('❌ Audit failed:', error);
      // Ensure qaSummary has basic data even on failure
      qaSummary.qualityGatePassed = false;
      qaSummary.pagesWithErrors['audit-failure'] = 500;
      // Generate basic markdown even on failure
      if (!md) {
        md = '# QA Summary Report\n\n';
        md += `**Generated:** ${new Date().toISOString()}\n`;
        md += `**Status:** FAILED - Audit crashed\n`;
        md += `**Error:** ${error}\n\n`;
      }
    } finally {
      // Always write the summary, even on failure
      try {
        // Create timestamped directory if it doesn't exist
        if (!fs.existsSync(timestampedDir)) {
          fs.mkdirSync(timestampedDir, { recursive: true });
        }

        // Write to timestamped directory
        fs.writeFileSync(
          path.join(timestampedDir, 'qa-summary.json'),
          JSON.stringify(qaSummary, null, 2)
        );
        fs.writeFileSync(path.join(timestampedDir, 'qa-summary.md'), md);

        // Create/update latest directory (remove if exists, then recreate)
        if (fs.existsSync(latestDir)) {
          fs.rmSync(latestDir, { recursive: true, force: true });
        }
        fs.mkdirSync(latestDir, { recursive: true });

        // Write to latest directory
        fs.writeFileSync(
          path.join(latestDir, 'qa-summary.json'),
          JSON.stringify(qaSummary, null, 2)
        );
        fs.writeFileSync(path.join(latestDir, 'qa-summary.md'), md);

        console.log(
          `\n✅ QA Summary written to:\n   - ${timestampedDir}\n   - ${latestDir}\n`
        );
      } catch (writeError) {
        console.error('❌ Failed to write QA summary:', writeError);
      }

      // Set exit code based on quality gate
      if (!qaSummary.qualityGatePassed) {
        process.exit(1);
      }
    }
  });
});
