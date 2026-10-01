const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  fs.mkdirSync('artifacts/ui', { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Asia/Colombo' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message.replace(/AIza[\w-]+/g, '[redacted]')));
  try {
    const departure = new Date(); departure.setUTCDate(departure.getUTCDate()+1); departure.setUTCHours(6,30,0,0);
    await page.goto(`http://localhost:8001?time=${departure.getTime()}`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: /Find your/ }).waitFor({ timeout: 30000 });
    await page.locator('gmp-place-autocomplete').first().waitFor();
    await page.locator('.gm-style').waitFor();
    await page.waitForTimeout(1800);
    await page.screenshot({ path: 'artifacts/ui/desktop.png', fullPage: true });
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `overflow at ${width}px`);
      if (width === 390) await page.screenshot({ path: 'artifacts/ui/mobile.png', fullPage: true });
    }
    assert.equal(await page.getByRole('button', { name: 'Find the best seat' }).isDisabled(), true);
    await page.getByRole('combobox', { name: 'Journey timezone' }).selectOption('Europe/London');
    assert.equal(await page.getByText('Times in London', { exact: true }).isVisible(), true);
    await page.getByRole('combobox', { name: 'Journey timezone' }).selectOption('Asia/Colombo');
    await page.locator('#departure-time').click();
    await page.locator('.react-datepicker').waitFor();
    await page.getByRole('heading', { name: /Find your/ }).click();
    await page.getByRole('button', { name: 'Train', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Train', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: 'Bus', exact: true }).click();

    // Deterministic routing fixture: no paid route requests are made by this test.
    await page.evaluate(() => {
      const original = google.maps.importLibrary.bind(google.maps);
      window.__routeRequests = [];
      google.maps.importLibrary = async name => name !== 'routes' ? original(name) : { Route: { computeRoutes: async request => {
        window.__routeRequests.push(request);
        if (window.__denyRoute) throw new Error('PERMISSION_DENIED');
        const path = [{ lat: 6.9271, lng: 79.8612 }, { lat: 6.9325, lng: 79.8700 }, { lat: 6.9400, lng: 79.8790 }, { lat: 6.9520, lng: 79.8900 }];
        return { routes: [{ path, warnings: [], createPolylines: () => [new google.maps.Polyline({ path, strokeColor: '#416b89', strokeWeight: 5 })], legs: [{ durationMillis: 1200000, steps: [{ path, distanceMeters: 4200, staticDurationMillis: 1200000, instructions: 'Take the bus toward the city centre', travelMode: 'TRANSIT', localizedValues: { distance: '4.2 km', staticDuration: '20 min' } }] }] }] };
      } } };
      document.querySelectorAll('gmp-place-autocomplete').forEach((element, index) => { element.value = index === 0 ? 'Colombo Fort' : 'Borella'; element.dispatchEvent(new Event('input', { bubbles: true, composed: true })); });
    });
    await page.getByRole('button', { name: 'Swap starting point and destination' }).click();
    assert.equal(await page.locator('gmp-place-autocomplete').first().evaluate(element => element.value), 'Borella');
    await page.getByRole('button', { name: 'Find the best seat' }).click();
    await page.getByText('Your seat recommendation', { exact: true }).waitFor({ timeout: 15000 });
    await page.locator('#journey-position').fill('3');
    assert.match(await page.locator('.scene-bottom p').textContent(), /Sun|sun/);
    const previousScene = await page.locator('.sun-scene > svg').innerHTML();
    await page.getByRole('button', { name: 'Rotate 3D view right' }).click();
    assert.notEqual(await page.locator('.sun-scene > svg').innerHTML(), previousScene);
    await page.locator('.journey-steps summary').click();
    await page.screenshot({ path: 'artifacts/ui/results-desktop.png', fullPage: true });
    await page.locator('.journey-steps[open] li').first().waitFor();
    assert.match(await page.locator('.journey-steps li').first().textContent(), /Take the bus toward the city centre/);
    await page.screenshot({ path: 'artifacts/ui/results-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    await page.screenshot({ path: 'artifacts/ui/results-mobile.png', fullPage: true });
    await page.getByRole('button', { name: 'Edit journey' }).click();
    assert.equal(await page.locator('gmp-place-autocomplete').first().evaluate(element => element.value), 'Borella');
    assert.equal(await page.getByRole('heading', { name: 'Pick up where you left off' }).isVisible(), true);
    await page.getByRole('button', { name: 'Train', exact: true }).click();
    await page.evaluate(() => { window.__denyRoute = true; });
    await page.getByRole('button', { name: 'Find the best seat' }).click();
    await page.getByRole('alert').filter({ hasText: 'PERMISSION_DENIED' }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Find the best seat' }).isEnabled(), true);
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('UI checks passed: five viewport sizes, timezone selection, calendar, travel mode, swap, route results, sun scrubber, 3D rotation, journey steps, edit, recent routes and inline errors. Routing responses were mocked.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error.stack.replace(/AIza[\w-]+/g, '[redacted]')); process.exit(1); });
