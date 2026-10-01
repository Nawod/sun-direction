const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  fs.mkdirSync('artifacts/ui', { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Asia/Colombo' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message.replace(/AIza[\w-]+/g, '[redacted]')));
    await page.route('https://api.open-meteo.com/**', route => route.fulfill({ json: { hourly: { time: [], cloud_cover: [], precipitation: [] } } }));
    await page.goto(`http://localhost:8001/?time=${new Date('2026-10-02T04:30:00.000Z').getTime()}`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: /A better seat/ }).waitFor({ timeout: 45000 });
    await page.locator('gmp-place-autocomplete').first().waitFor();
    await page.waitForTimeout(1800);
    await page.screenshot({ path: 'artifacts/ui/desktop.png' });
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `overflow at ${width}`);
      if (width === 390) await page.screenshot({ path: 'artifacts/ui/mobile.png', fullPage: true });
    }
    await page.getByRole('button', { name: 'How it works' }).click();
    await page.getByRole('dialog').waitFor({ state: 'visible' });
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: 'Sun view' }).click();
    assert.equal(await page.locator('.sun-compass').count(), 0);
    await page.getByRole('button', { name: 'Sun view' }).click();
    await page.getByRole('button', { name: 'Toggle satellite map' }).click();
    assert.equal(await page.getByRole('button', { name: 'Toggle satellite map' }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: 'Toggle satellite map' }).click();
    await page.evaluate(() => {
      const original = google.maps.importLibrary;
      google.maps.importLibrary = async name => {
        if (name !== 'routes') return original(name);
        return { Route: { computeRoutes: async request => {
          window.__routeRequest = request;
          if (window.__denyRoute) throw new Error('PERMISSION_DENIED: API key is not authorized');
          const path = [{lat:6.9271,lng:79.8612},{lat:6.915,lng:79.866},{lat:6.899,lng:79.858},{lat:6.883,lng:79.864},{lat:6.861,lng:79.873},{lat:6.84,lng:79.87}];
          return { routes: [{ path, warnings: [], legs: [{ durationMillis: 1500000, steps: [{ path, distanceMeters: 10400, staticDurationMillis: 1500000, instructions: 'Travel south toward Mount Lavinia', travelMode: 'TRANSIT' }] }], createPolylines: () => [new google.maps.Polyline({ path, strokeColor: '#286550', strokeWeight: 5 })] }] };
        } } };
      };
      document.querySelectorAll('gmp-place-autocomplete').forEach((el, i) => {
        el.value = i ? 'Mount Lavinia, Sri Lanka' : 'Colombo, Sri Lanka';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
    await page.getByRole('button', { name: 'Swap starting point and destination' }).click();
    assert.match(await page.locator('gmp-place-autocomplete').first().evaluate(el => el.value), /Mount Lavinia/);
    await page.getByRole('button', { name: 'Swap starting point and destination' }).click();
    await page.getByRole('button', { name: 'Find my shady side' }).click();
    await page.getByText('Your best seat', { exact: true }).waitFor();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: 'artifacts/ui/desktop-route.png' });
    await page.getByRole('slider', { name: 'Position along journey' }).fill('3');
    assert.equal(await page.getByRole('slider').inputValue(), '3');
    await page.getByRole('button', { name: 'Next point on route' }).click();
    assert.equal(await page.getByRole('slider').inputValue(), '4');
    await page.getByRole('button', { name: 'Previous point on route' }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'artifacts/ui/mobile-route.png', fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('.journey-steps summary').click();
    await page.locator('.journey-steps[open] li').first().waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Edit journey' }).click();
    await page.getByRole('button', { name: 'Train', exact: true }).click();
    await page.evaluate(() => { window.__denyRoute = true; });
    await page.getByRole('button', { name: 'Find my shady side' }).click();
    await page.locator('.inline-error[role="alert"]').waitFor();
    assert.equal(await page.getByRole('button', { name: 'Find my shady side' }).isEnabled(), true);
    assert.equal(await page.evaluate(() => window.__routeRequest.transitPreference.allowedTransitModes[0]), 'TRAIN');
    assert.deepEqual(errors, []);
    console.log('PASS: responsive widths, help, map tools, form/swap, route results, sun timeline, directions, and inline recovery. Route API fixture; live Google basemap.');
  } finally { await browser.close(); }
})().catch(e => { console.error(String(e).replace(/AIza[\w-]+/g, '[redacted]')); process.exitCode = 1; });
