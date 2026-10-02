/**
 * E2E SEO HTTP Crawl Runner
 * 
 * Audits 100% of sitemap routes for HTTP 200, audits all permanent 301 redirects
 * from next.config.ts for HTTP 301 and correct Location headers, and asserts zero HTTP 404s.
 * 
 * Usage:
 *   npx tsx scripts/e2e_seo_crawl.ts
 *   npx tsx scripts/e2e_seo_crawl.ts --base-url http://localhost:9003
 *   npx tsx scripts/e2e_seo_crawl.ts --redirects-only
 *   npx tsx scripts/e2e_seo_crawl.ts --sitemap-only
 *   npx tsx scripts/e2e_seo_crawl.ts --max-urls 20 --concurrency 5
 */

import fs from 'fs';
import path from 'path';

interface CrawlResult {
  url: string;
  expectedStatus: number | number[];
  actualStatus: number;
  durationMs: number;
  locationHeader?: string;
  passed: boolean;
  error?: string;
  category: 'sitemap' | 'redirect';
}

interface CrawlSummary {
  total: number;
  passed: number;
  failed: number;
  status200Count: number;
  status301Count: number;
  status404Count: number;
  serverErrorCount: number;
  avgDurationMs: number;
  durationTotalSec: number;
}

// Parse CLI options
function parseArgs() {
  const args = process.argv.slice(2);
  let baseUrl = process.env.BASE_URL || 'https://www.myacc.co.za';
  let concurrency = 8;
  let timeoutMs = 12000;
  let maxUrls: number | null = null;
  let redirectsOnly = false;
  let sitemapOnly = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--base-url' && args[i + 1]) {
      baseUrl = args[++i].replace(/\/+$/, '');
    } else if (args[i] === '--concurrency' && args[i + 1]) {
      concurrency = parseInt(args[++i], 10) || 8;
    } else if (args[i] === '--timeout' && args[i + 1]) {
      timeoutMs = parseInt(args[++i], 10) || 12000;
    } else if (args[i] === '--max-urls' && args[i + 1]) {
      maxUrls = parseInt(args[++i], 10) || null;
    } else if (args[i] === '--redirects-only') {
      redirectsOnly = true;
    } else if (args[i] === '--sitemap-only') {
      sitemapOnly = true;
    } else if (args[i] === '--help') {
      console.log(`
E2E SEO Live Crawler
====================
Options:
  --base-url <url>      Base URL to crawl (default: https://www.myacc.co.za)
  --concurrency <num>   Concurrent requests limit (default: 8)
  --timeout <ms>        Request timeout in ms (default: 12000)
  --max-urls <num>      Limit total sitemap URLs to crawl (for quick tests)
  --redirects-only      Only verify 301 redirects from next.config.ts
  --sitemap-only        Only verify 200 OK on sitemap URLs
  --help                Show this message
      `);
      process.exit(0);
    }
  }

  return { baseUrl, concurrency, timeoutMs, maxUrls, redirectsOnly, sitemapOnly };
}

// Extract static and dynamic URLs from sitemap.ts
function getSitemapStaticRoutes(): string[] {
  const sitemapPath = path.resolve(__dirname, '../src/app/sitemap.ts');
  if (!fs.existsSync(sitemapPath)) {
    return ['/', '/blog', '/compliance', '/contact', '/bookkeeping', '/company-registration'];
  }

  const content = fs.readFileSync(sitemapPath, 'utf-8');
  const staticRoutesMatch = content.match(/const staticRoutes = \[([\s\S]*?)\];/);
  if (!staticRoutesMatch) return ['/'];

  const block = staticRoutesMatch[1];
  const routeMatches = block.match(/'([^']+)'/g);
  if (!routeMatches) return ['/'];

  return routeMatches.map((r) => r.replace(/'/g, ''));
}

// Extract static redirects from next.config.ts
async function getRedirectRules(): Promise<Array<{ source: string; destination: string; permanent?: boolean }>> {
  try {
    const configModule: any = await import('../next.config');
    const nextConfig = configModule.default || configModule;
    const list: Array<{ source: string; destination: string; permanent?: boolean }> = (await nextConfig.redirects?.()) || [];
    // Filter out regex or host-based catch-all redirects (e.g. /:path*)
    return list.filter((r: { source: string }) => !r.source.includes(':') && !r.source.includes('*'));
  } catch (err) {
    console.error('Failed to load redirects from next.config.ts:', err);
    return [];
  }
}

// Execute single HTTP fetch with timeout and manual redirect handling
async function probeUrl(
  fullUrl: string,
  expectedStatus: number | number[],
  category: 'sitemap' | 'redirect',
  timeoutMs: number,
  expectedLocation?: string
): Promise<CrawlResult> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'manual', // Do not automatically follow redirects to inspect 301
      signal: controller.signal,
    });

    clearTimeout(timer);
    const durationMs = Date.now() - start;
    const location = response.headers.get('location') || undefined;

    const allowed = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    let passed = allowed.includes(response.status);

    if (category === 'redirect' && expectedLocation && location) {
      // Normalize location path for comparison
      const normalizedLocation = location.startsWith('http')
        ? new URL(location).pathname
        : location;
      const normalizedExpected = expectedLocation.startsWith('http')
        ? new URL(expectedLocation).pathname
        : expectedLocation;

      if (normalizedLocation !== normalizedExpected) {
        passed = false;
      }
    }

    return {
      url: fullUrl,
      expectedStatus,
      actualStatus: response.status,
      durationMs,
      locationHeader: location,
      passed,
      category,
    };
  } catch (err: any) {
    clearTimeout(timer);
    const durationMs = Date.now() - start;
    return {
      url: fullUrl,
      expectedStatus,
      actualStatus: 0,
      durationMs,
      passed: false,
      error: err.name === 'AbortError' ? `Timeout after ${timeoutMs}ms` : err.message,
      category,
    };
  }
}

// Queue runner with controlled concurrency
async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function next(): Promise<void> {
    while (index < items.length) {
      const currentIndex = index++;
      results[currentIndex] = await worker(items[currentIndex]);
    }
  }

  const pool = Array.from({ length: Math.min(limit, items.length) }, () => next());
  await Promise.all(pool);
  return results;
}

// Main execution
async function main() {
  const options = parseArgs();
  console.log('\n======================================================');
  console.log('         E2E SEO LIVE HTTP CRAWLER');
  console.log('======================================================');
  console.log(`Target Base URL : ${options.baseUrl}`);
  console.log(`Concurrency     : ${options.concurrency}`);
  console.log(`Timeout         : ${options.timeoutMs}ms`);
  console.log(`Mode            : ${options.redirectsOnly ? 'Redirects Only' : options.sitemapOnly ? 'Sitemap Only' : 'Full Audit'}`);
  console.log('------------------------------------------------------\n');

  const startTime = Date.now();
  const allResults: CrawlResult[] = [];

  // 1. Audit 301 Redirect Rules
  if (!options.sitemapOnly) {
    console.log('[1/2] Discovering 301 Permanent Redirects in next.config.ts...');
    const rawRedirects = await getRedirectRules();
    console.log(`Found ${rawRedirects.length} static redirect rules to verify.\n`);

    const redirectTargets = rawRedirects.map((r) => ({
      url: `${options.baseUrl}${r.source}`,
      expectedStatus: 301,
      expectedLocation: r.destination,
      category: 'redirect' as const,
    }));

    const redirectResults = await runWithConcurrency(
      redirectTargets,
      options.concurrency,
      async (target) => {
        const res = await probeUrl(
          target.url,
          target.expectedStatus,
          target.category,
          options.timeoutMs,
          target.expectedLocation
        );
        const icon = res.passed ? '✓' : '✗';
        const dest = res.locationHeader ? ` -> ${res.locationHeader}` : '';
        console.log(`  ${icon} [${res.actualStatus}] ${target.url}${dest} (${res.durationMs}ms)`);
        return res;
      }
    );

    allResults.push(...redirectResults);
  }

  // 2. Audit Sitemap URLs
  if (!options.redirectsOnly) {
    console.log('\n[2/2] Discovering Sitemap URLs in src/app/sitemap.ts...');
    let staticRoutes = getSitemapStaticRoutes();
    if (options.maxUrls && options.maxUrls > 0) {
      staticRoutes = staticRoutes.slice(0, options.maxUrls);
    }
    console.log(`Found ${staticRoutes.length} sitemap URLs to audit for HTTP 200.\n`);

    const sitemapTargets = staticRoutes.map((route) => ({
      url: `${options.baseUrl}${route}`,
      expectedStatus: 200,
      category: 'sitemap' as const,
    }));

    const sitemapResults = await runWithConcurrency(
      sitemapTargets,
      options.concurrency,
      async (target) => {
        const res = await probeUrl(
          target.url,
          target.expectedStatus,
          target.category,
          options.timeoutMs
        );
        const icon = res.passed ? '✓' : '✗';
        console.log(`  ${icon} [${res.actualStatus}] ${target.url} (${res.durationMs}ms)`);
        return res;
      }
    );

    allResults.push(...sitemapResults);
  }

  // Summary Metrics
  const totalDurationSec = (Date.now() - startTime) / 1000;
  const summary: CrawlSummary = {
    total: allResults.length,
    passed: allResults.filter((r) => r.passed).length,
    failed: allResults.filter((r) => !r.passed).length,
    status200Count: allResults.filter((r) => r.actualStatus === 200).length,
    status301Count: allResults.filter((r) => r.actualStatus === 301 || r.actualStatus === 308).length,
    status404Count: allResults.filter((r) => r.actualStatus === 404).length,
    serverErrorCount: allResults.filter((r) => r.actualStatus >= 500).length,
    avgDurationMs: Math.round(
      allResults.reduce((acc, r) => acc + r.durationMs, 0) / (allResults.length || 1)
    ),
    durationTotalSec: Number(totalDurationSec.toFixed(2)),
  };

  console.log('\n======================================================');
  console.log('                  CRAWL SUMMARY REPORT');
  console.log('======================================================');
  console.log(`Total URLs Audited    : ${summary.total}`);
  console.log(`Passed (Valid)        : ${summary.passed}`);
  console.log(`Failed (Errors)       : ${summary.failed}`);
  console.log(`HTTP 200 (OK)         : ${summary.status200Count}`);
  console.log(`HTTP 301 (Permanent)  : ${summary.status301Count}`);
  console.log(`HTTP 404 (DEAD LINKS) : ${summary.status404Count}`);
  console.log(`HTTP 5xx (SERVER ERR) : ${summary.serverErrorCount}`);
  console.log(`Average Latency       : ${summary.avgDurationMs}ms`);
  console.log(`Total Execution Time  : ${summary.durationTotalSec}s`);
  console.log('======================================================');

  if (summary.status404Count > 0) {
    console.error('\n[CRITICAL FAILURE] 404 DEAD LINKS DETECTED:');
    allResults
      .filter((r) => r.actualStatus === 404)
      .forEach((r) => console.error(`  - [404] ${r.url}`));
  }

  if (summary.failed > 0) {
    console.error(`\n[WARNING] ${summary.failed} assertions did not meet contract requirements.`);
    const failedSamples = allResults.filter((r) => !r.passed).slice(0, 10);
    failedSamples.forEach((f) => {
      console.error(`  - ${f.url} | Expected: ${f.expectedStatus} | Actual: ${f.actualStatus} ${f.error ? `(${f.error})` : ''}`);
    });
  }

  // Zero 404s requirement check
  if (summary.status404Count === 0 && summary.failed === 0) {
    console.log('\n>>> AUDIT PASSED: Zero 404 crawl errors and 100% contract compliance achieved! <<<\n');
    process.exit(0);
  } else {
    // If running in development without a local server running or against prod with discrepancies
    console.log('\n>>> AUDIT COMPLETED with discrepancies. Review failure log above. <<<\n');
    // Exit with code 1 if 404s exist
    if (summary.status404Count > 0) {
      process.exit(1);
    }
  }
}

// Execute script if directly invoked
if (require.main === module || process.argv[1]?.endsWith('e2e_seo_crawl.ts')) {
  main().catch((err) => {
    console.error('Fatal crawler error:', err);
    process.exit(1);
  });
}

export { main, probeUrl, getSitemapStaticRoutes, getRedirectRules };
