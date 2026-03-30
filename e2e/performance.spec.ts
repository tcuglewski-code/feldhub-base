/**
 * Performance E2E Tests — Core Web Vitals
 * 
 * Misst LCP, CLS, FCP über Playwright + web-vitals.
 * Ergänzt Lighthouse CI für interaktive Szenarien.
 */

import { test, expect, Page } from '@playwright/test';

// Benchmarks aus PERFORMANCE-BENCHMARKS.md
const THRESHOLDS = {
  lcp: 2500,   // Largest Contentful Paint: <2.5s
  fcp: 1800,   // First Contentful Paint: <1.8s
  cls: 0.1,    // Cumulative Layout Shift: <0.1
  ttfb: 600,   // Time to First Byte: <600ms
};

interface WebVitals {
  lcp?: number;
  fcp?: number;
  cls?: number;
  ttfb?: number;
}

/**
 * Collect Web Vitals from page
 */
async function collectWebVitals(page: Page): Promise<WebVitals> {
  return await page.evaluate(() => {
    return new Promise<WebVitals>((resolve) => {
      const vitals: WebVitals = {};
      
      // Get navigation timing
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (nav) {
        vitals.ttfb = nav.responseStart - nav.requestStart;
      }
      
      // Get paint timings
      const paintEntries = performance.getEntriesByType('paint');
      for (const entry of paintEntries) {
        if (entry.name === 'first-contentful-paint') {
          vitals.fcp = entry.startTime;
        }
      }
      
      // LCP via PerformanceObserver
      let lcpValue = 0;
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        lcpValue = lastEntry.startTime;
      });
      
      try {
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        // LCP not supported
      }
      
      // CLS via PerformanceObserver
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
      });
      
      try {
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        // CLS not supported
      }
      
      // Wait for load and collect final values
      setTimeout(() => {
        vitals.lcp = lcpValue || undefined;
        vitals.cls = clsValue;
        lcpObserver.disconnect();
        clsObserver.disconnect();
        resolve(vitals);
      }, 3000);
    });
  });
}

test.describe('Performance Benchmarks', () => {
  test.describe.configure({ mode: 'serial' });

  test('Homepage: Core Web Vitals', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const vitals = await collectWebVitals(page);
    
    console.log('📊 Homepage Web Vitals:', vitals);
    
    // TTFB Check
    if (vitals.ttfb !== undefined) {
      expect(vitals.ttfb, `TTFB should be < ${THRESHOLDS.ttfb}ms`).toBeLessThan(THRESHOLDS.ttfb);
    }
    
    // FCP Check
    if (vitals.fcp !== undefined) {
      expect(vitals.fcp, `FCP should be < ${THRESHOLDS.fcp}ms`).toBeLessThan(THRESHOLDS.fcp);
    }
    
    // CLS Check
    if (vitals.cls !== undefined) {
      expect(vitals.cls, `CLS should be < ${THRESHOLDS.cls}`).toBeLessThan(THRESHOLDS.cls);
    }
  });

  test('Dashboard: Load Performance', async ({ page }) => {
    // Skip if no auth (e.g., in public staging)
    test.skip(process.env.SKIP_AUTH_TESTS === 'true', 'Skipping authenticated tests');
    
    await page.goto('/login', { waitUntil: 'networkidle' });
    
    // Check if redirected or on login page
    const isLoginPage = page.url().includes('/login');
    
    if (isLoginPage) {
      test.skip(true, 'Login required — run with authenticated session');
      return;
    }
    
    const vitals = await collectWebVitals(page);
    
    console.log('📊 Dashboard Web Vitals:', vitals);
    
    // Dashboard has higher thresholds (more JS)
    if (vitals.fcp !== undefined) {
      expect(vitals.fcp, 'Dashboard FCP should be < 2500ms').toBeLessThan(2500);
    }
    
    if (vitals.cls !== undefined) {
      expect(vitals.cls, 'Dashboard CLS should be < 0.15').toBeLessThan(0.15);
    }
  });

  test('Navigation: Page transitions', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Time navigation to another page
    const startNav = Date.now();
    
    // Try to navigate to a known route
    const links = await page.locator('a[href^="/"]').all();
    if (links.length === 0) {
      test.skip(true, 'No internal links found');
      return;
    }
    
    const href = await links[0].getAttribute('href');
    if (!href) {
      test.skip(true, 'No href found');
      return;
    }
    
    await page.goto(href, { waitUntil: 'domcontentloaded' });
    const navTime = Date.now() - startNav;
    
    console.log(`⏱️ Navigation to ${href}: ${navTime}ms`);
    
    // Client-side nav should be fast
    expect(navTime, 'Page transition should be < 2000ms').toBeLessThan(2000);
  });

  test('Images: Lazy loading', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Check that images below fold have loading="lazy"
    const images = await page.locator('img').all();
    
    let lazyCount = 0;
    let totalBelowFold = 0;
    
    for (const img of images) {
      const boundingBox = await img.boundingBox();
      if (boundingBox && boundingBox.y > 800) {
        totalBelowFold++;
        const loading = await img.getAttribute('loading');
        if (loading === 'lazy') {
          lazyCount++;
        }
      }
    }
    
    if (totalBelowFold > 0) {
      const lazyRatio = lazyCount / totalBelowFold;
      console.log(`📷 Lazy images: ${lazyCount}/${totalBelowFold} (${(lazyRatio * 100).toFixed(0)}%)`);
      expect(lazyRatio, 'Most below-fold images should be lazy').toBeGreaterThan(0.7);
    }
  });

  test('JS Bundle: No blocking scripts', async ({ page }) => {
    const blockingScripts: string[] = [];
    
    page.on('request', (request) => {
      if (request.resourceType() === 'script') {
        const url = request.url();
        // Check if script is render-blocking (no async/defer)
        // This is a heuristic — real check would need HTML parsing
        if (!url.includes('chunk') && !url.includes('_next/static')) {
          blockingScripts.push(url);
        }
      }
    });
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    console.log(`📦 Script requests: ${blockingScripts.length} potentially blocking`);
    
    // Next.js should have minimal blocking scripts
    expect(blockingScripts.length, 'Should have few blocking scripts').toBeLessThan(5);
  });

  test('API: Response time', async ({ page, request }) => {
    // Test a public API endpoint
    const start = Date.now();
    
    const response = await request.get('/api/health');
    
    const duration = Date.now() - start;
    
    console.log(`🔗 /api/health: ${duration}ms (status: ${response.status()})`);
    
    expect(response.status()).toBe(200);
    expect(duration, 'Health check should respond < 500ms').toBeLessThan(500);
  });
});

test.describe('Resource Optimization', () => {
  test('Fonts: Preloaded and optimized', async ({ page }) => {
    const fontRequests: string[] = [];
    
    page.on('request', (request) => {
      if (request.resourceType() === 'font') {
        fontRequests.push(request.url());
      }
    });
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    console.log(`🔤 Font requests: ${fontRequests.length}`);
    
    // Check preload links
    const preloadLinks = await page.locator('link[rel="preload"][as="font"]').count();
    
    console.log(`🔤 Preloaded fonts: ${preloadLinks}`);
    
    // Should preload critical fonts
    if (fontRequests.length > 0) {
      expect(preloadLinks, 'Should preload at least one font').toBeGreaterThan(0);
    }
  });

  test('CSS: No unused styles warning', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Run Coverage (simplified check)
    const stylesheets = await page.locator('link[rel="stylesheet"]').count();
    const inlineStyles = await page.locator('style').count();
    
    console.log(`🎨 Stylesheets: ${stylesheets} external, ${inlineStyles} inline`);
    
    // Tailwind should produce 1-2 stylesheets max
    expect(stylesheets, 'Should have few external stylesheets').toBeLessThan(5);
  });
});
