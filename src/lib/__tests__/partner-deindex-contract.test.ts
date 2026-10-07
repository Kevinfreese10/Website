import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import robots from '@/app/robots';
import nextConfig from '../../../next.config';

const ROOT_DIR = path.resolve(__dirname, '../../..');

describe('Partner Route De-indexing & Crawl Budget Contract (Milestone 1)', () => {
  describe('robots.txt Crawl Allowance', () => {
    const robotsOutput = robots();

    it('returns a valid robots configuration object with rules', () => {
      expect(robotsOutput).toBeDefined();
      expect(Array.isArray(robotsOutput.rules)).toBe(true);
      if (Array.isArray(robotsOutput.rules)) {
        expect(robotsOutput.rules.length).toBeGreaterThan(0);
      }
    });

    it('allows crawling of partner routes (/p/) for general crawlers (*)', () => {
      const generalRule = Array.isArray(robotsOutput.rules)
        ? robotsOutput.rules.find((r) => r.userAgent === '*')
        : robotsOutput.rules;

      expect(generalRule).toBeDefined();
      const disallows = Array.isArray(generalRule?.disallow)
        ? generalRule.disallow
        : [generalRule?.disallow];

      // /p/ must NOT be disallowed so search engines can crawl it and read noindex/canonical directives
      expect(disallows).not.toContain('/p/');
      expect(disallows).not.toContain('/p');
    });

    it('retains protection for authenticated partner portal (/partner/) and admin routes', () => {
      const generalRule = Array.isArray(robotsOutput.rules)
        ? robotsOutput.rules.find((r) => r.userAgent === '*')
        : robotsOutput.rules;

      const disallows = Array.isArray(generalRule?.disallow)
        ? generalRule.disallow
        : [generalRule?.disallow];

      expect(disallows).toContain('/partner/');
      expect(disallows).toContain('/admin');
      expect(disallows).toContain('/dashboard');
      expect(disallows).toContain('/login');
      expect(disallows).toContain('/signup');
      expect(disallows).toContain('/cart');
      expect(disallows).toContain('/checkout');
      expect(disallows).toContain('/reseller/');
    });

    it('allows AI crawlers to crawl /p/ to discover authoritative canonical signals', () => {
      const rules = Array.isArray(robotsOutput.rules) ? robotsOutput.rules : [robotsOutput.rules];
      const aiBotNames = [
        'ClaudeBot',
        'GPTBot',
        'OAI-SearchBot',
        'PerplexityBot',
        'Google-Extended',
        'Applebot-Extended',
      ];

      for (const botName of aiBotNames) {
        const botRule = rules.find((r) => r.userAgent === botName);
        expect(botRule, `Missing rule for AI bot ${botName}`).toBeDefined();
        const disallows = Array.isArray(botRule?.disallow)
          ? botRule.disallow
          : [botRule?.disallow];
        expect(disallows).not.toContain('/p/');
        expect(disallows).toContain('/partner/');
      }
    });

    it('verifies source file src/app/robots.ts does not include /p/ in privateDisallows', () => {
      const robotsSource = fs.readFileSync(path.join(ROOT_DIR, 'src/app/robots.ts'), 'utf-8');
      expect(robotsSource).not.toMatch(/'\/p\/'/);
      expect(robotsSource).toContain("'/partner/'");
    });
  });

  describe('next.config.ts HTTP Response Headers', () => {
    it('defines an async headers function in next.config.ts', async () => {
      expect(nextConfig.headers).toBeDefined();
      expect(typeof nextConfig.headers).toBe('function');
    });

    it('emits X-Robots-Tag: noindex, follow on /p/:path*', async () => {
      if (!nextConfig.headers) {
        throw new Error('nextConfig.headers is undefined');
      }
      const headersConfig = await nextConfig.headers();
      expect(Array.isArray(headersConfig)).toBe(true);

      const pHeaderRule = headersConfig.find((rule) => rule.source === '/p/:path*');
      expect(pHeaderRule, 'Missing header rule for /p/:path*').toBeDefined();
      expect(pHeaderRule?.headers).toBeDefined();

      const robotsHeader = pHeaderRule?.headers.find(
        (h) => h.key.toLowerCase() === 'x-robots-tag'.toLowerCase()
      );
      expect(robotsHeader, 'Missing X-Robots-Tag header in /p/:path* rule').toBeDefined();
      expect(robotsHeader?.value).toBe('noindex, follow');
    });

    it('preserves existing security and noCache headers for sensitive routes', async () => {
      if (!nextConfig.headers) {
        throw new Error('nextConfig.headers is undefined');
      }
      const headersConfig = await nextConfig.headers();

      const sensitiveRoutes = [
        '/admin/:path*',
        '/dashboard/:path*',
        '/partner/:path*',
        '/login',
        '/signup',
        '/cart',
        '/checkout',
      ];

      for (const route of sensitiveRoutes) {
        const rule = headersConfig.find((r) => r.source === route);
        expect(rule, `Missing header rule for ${route}`).toBeDefined();
        const cacheControl = rule?.headers.find((h) => h.key === 'Cache-Control');
        expect(cacheControl?.value).toContain('no-store');
      }
    });
  });

  describe('Partner Layout Metadata Alignment (Defense-in-Depth)', () => {
    it('verifies src/app/p/[slug]/layout.tsx defines robots: { index: false, follow: true }', () => {
      const layoutSource = fs.readFileSync(
        path.join(ROOT_DIR, 'src/app/p/[slug]/layout.tsx'),
        'utf-8'
      );
      expect(layoutSource).toContain('index: false');
      expect(layoutSource).toContain('follow: true');
      // Must not declare index: true
      expect(layoutSource).not.toMatch(/robots:\s*\{\s*index:\s*true/);
    });

    it('verifies src/app/p/[slug]/products/[serviceSlug]/page.tsx defines robots: { index: false, follow: true }', () => {
      const pageSource = fs.readFileSync(
        path.join(ROOT_DIR, 'src/app/p/[slug]/products/[serviceSlug]/page.tsx'),
        'utf-8'
      );
      expect(pageSource).toContain('index: false');
      expect(pageSource).toContain('follow: true');
    });
  });
});
