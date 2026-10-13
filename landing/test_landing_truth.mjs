import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.xml': 'application/xml'
};

function createStaticServer(root) {
  return http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(root, reqPath);

    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end('Not Found');
      }
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
}

async function run() {
  console.log('=== NetMax Landing Page Truthfulness & Accessibility Test Suite ===\n');

  const server = createStaticServer(__dirname);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Local test server listening at ${baseUrl}`);

  const browser = await chromium.launch({
    headless: true
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  const unexpectedRequests = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message || String(err));
  });

  // Block external requests, allow only local origin; fulfill font requests offline
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith(baseUrl)) {
      route.continue();
    } else if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
      route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    } else {
      unexpectedRequests.push(url);
      route.abort();
    }
  });

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    console.log('\n--- 1. Navigation and Load ---');
    await page.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    assert(consoleErrors.length === 0, `Zero console errors during load (found: ${consoleErrors.length})`);
    assert(pageErrors.length === 0, `Zero unhandled page errors (found: ${pageErrors.length})`);

    console.log('\n--- 2. Truthfulness: Removed Misleading Sections & Claims ---');
    const testimonials = await page.$('#testimonials');
    assert(testimonials === null, 'Testimonials section (#testimonials) is removed');

    const subscription = await page.$('#subscription');
    assert(subscription === null, 'Subscription tiers section (#subscription) is removed');

    const analytics = await page.$('#analytics');
    assert(analytics === null, 'Fabricated analytics section (#analytics) is removed');

    const backupRecovery = await page.$('#backupRecovery');
    assert(backupRecovery === null, 'Fake backup/recovery section (#backupRecovery) is removed');

    const cookieBanner = await page.$('#cookieBanner');
    assert(cookieBanner === null, 'Fake cookie banner (#cookieBanner) is removed');

    const consentPanel = await page.$('#consentPanel');
    assert(consentPanel === null, 'Fake consent modal (#consentPanel) is removed');

    const pageContent = await page.content();
    assert(!pageContent.includes('Alex K.'), 'Fabricated persona "Alex K." is removed');
    assert(!pageContent.includes('Sarah M.'), 'Fabricated persona "Sarah M." is removed');
    assert(!pageContent.includes('James R.'), 'Fabricated persona "James R." is removed');
    assert(!pageContent.includes('Start Free Trial'), '"Start Free Trial" button/text is removed');
    assert(!pageContent.includes('Contact Sales'), '"Contact Sales" button/text is removed');
    assert(!pageContent.includes('All systems operational'), 'Fake operational status claim is removed');
    assert(!pageContent.includes('99.2%'), 'Synthetic 99.2% uptime claim is removed');

    console.log('\n--- 3. Dashboard Preview: Illustrative Sample Data & Frozen Numbers ---');
    const dashboardPreview = await page.$('#dashboard-preview');
    assert(dashboardPreview !== null, 'Dashboard preview section exists');

    const previewText = await page.locator('#dashboard-preview').innerText();
    assert(
      previewText.includes('sample') || previewText.includes('Illustrative'),
      'Dashboard preview visibly discloses sample/illustrative data'
    );

    const throughputBefore = await page.locator('#throughputValue').innerText();
    const latencyBefore = await page.locator('#latencyValue').innerText();
    console.log(`  Initial preview metrics: throughput=${throughputBefore}, latency=${latencyBefore}`);

    await page.waitForTimeout(3500); // Wait longer than previous 3000ms timer
    const throughputAfter = await page.locator('#throughputValue').innerText();
    const latencyAfter = await page.locator('#latencyValue').innerText();

    assert(
      throughputBefore === throughputAfter && latencyBefore === latencyAfter,
      `Preview metrics remain frozen after load (${throughputBefore} -> ${throughputAfter}, ${latencyBefore} -> ${latencyAfter})`
    );

    const installLink = await page.$('#dashboard-preview a[href="#install"]');
    assert(installLink !== null, 'Dashboard preview provides working install link (#install)');

    console.log('\n--- 4. Navigation & Link Verification ---');
    // Check all fragment links on the page
    const fragmentLinks = await page.$$eval('a[href^="#"]', (links) =>
      links.map((a) => a.getAttribute('href'))
    );
    console.log(`  Found ${fragmentLinks.length} in-page fragment links: ${fragmentLinks.join(', ')}`);

    for (const href of fragmentLinks) {
      if (href === '#') continue;
      const target = await page.$(href);
      assert(target !== null, `In-page anchor ${href} resolves to an existing DOM element`);
    }

    // Verify verified external destinations
    const buyHref = await page.$eval('a[href*="gumroad.com"]', (a) => a.href);
    assert(
      buyHref === 'https://mubasharali03.gumroad.com/l/yzkuez',
      'Gumroad Founding License CTA links to exact verified URL'
    );

    const releaseLinks = await page.$$eval('a[href*="github.com"][href*="releases"]', (links) =>
      links.map((a) => a.href)
    );
    assert(
      releaseLinks.length > 0 &&
        releaseLinks.every((url) => url.startsWith('https://github.com/mubasharali24428-crypto/drift-workbench/releases')),
      'Release download links point to official releases origin'
    );

    const licenseLinks = await page.$$eval('a[href*="LICENSE"]', (links) => links.map((a) => a.href));
    assert(
      licenseLinks.length > 0 &&
        licenseLinks.every((url) =>
          url.startsWith('https://github.com/mubasharali24428-crypto/drift-workbench/blob/main/LICENSE')
        ),
      'License link points to repository LICENSE file'
    );

    console.log('\n--- 5. UI Controls: Onboarding Dismissal & Theme Toggle ---');
    const onboarding = await page.$('#onboardingModal.active');
    if (onboarding) {
      console.log('  Testing onboarding modal dismissal...');
      await page.click('#onboardingSkip');
      await page.waitForTimeout(200);
      const stillActive = await page.$('#onboardingModal.active');
      assert(stillActive === null, 'Onboarding modal successfully dismisses on Skip click');
    }

    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'light');
    console.log(`  Initial theme: ${initialTheme}`);
    await page.click('#themeToggle');
    await page.waitForTimeout(500); // Wait for CSS theme transition to settle
    const toggledTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'light');
    console.log(`  Theme after toggle click: ${toggledTheme}`);
    assert(initialTheme !== toggledTheme, 'Theme toggle changes document data-theme attribute');

    console.log('\n--- 6. Accessibility Audit (Axe Core WCAG AA) ---');
    const axeBuilder = new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']);

    const axeResults = await axeBuilder.analyze();
    const criticalOrSerious = axeResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (criticalOrSerious.length > 0) {
      console.error(`  Axe found ${criticalOrSerious.length} critical/serious violations:`);
      for (const v of criticalOrSerious) {
        console.error(`    - [${v.impact.toUpperCase()}] ${v.id}: ${v.help} (${v.nodes.length} nodes): ${v.nodes.map(n => n.html).join(", ")}`);
      }
    }
    assert(
      criticalOrSerious.length === 0,
      `Zero critical/serious WCAG AA violations found (actual: ${criticalOrSerious.length})`
    );

  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\n==================================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
