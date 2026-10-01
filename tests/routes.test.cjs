const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');

function setup(responses) {
  const calls = [];
  class LatLng {
    constructor(lat, lng) { this.latitude = lat; this.longitude = lng; }
    lat() { return this.latitude; }
    lng() { return this.longitude; }
  }
  const exports = {};
  const google = { maps: {
    LatLng,
    importLibrary: async (name) => {
      assert.equal(name, 'routes');
      return { Route: { computeRoutes: async (request) => {
        calls.push(request);
        const response = responses.shift();
        if (response instanceof Error) throw response;
        return response;
      } } };
    },
  } };
  const source = ts.transpileModule(fs.readFileSync('src/utils/routes.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(source, { exports, google, Date, Error });
  return { ...exports, calls };
}

function fixture() {
  const path = [{ lat: 6.9, lng: 79.8 }, { lat: 7, lng: 79.9 }];
  return { path, legs: [{ durationMillis: 120000, steps: [{
    path, staticDurationMillis: 120000, distanceMeters: 800,
    instructions: 'Take the bus', travelMode: 'TRANSIT',
    localizedValues: { distance: '800 m', staticDuration: '2 min' },
  }] }] };
}

test('transit request includes departure time, train preference, and GPS coordinates', async () => {
  const api = setup([{ routes: [fixture()] }]);
  const departure = new Date('2026-10-02T08:00:00Z');
  const plan = await api.computeRoutePlan('6.9,79.8', 'Colombo Fort', departure, 'TRAIN');
  assert.equal(api.calls[0].origin.lat, 6.9);
  assert.equal(api.calls[0].departureTime, departure);
  assert.equal(api.calls[0].transitPreference.allowedTransitModes[0], 'TRAIN');
  assert.equal(plan.legs[0].steps[0].duration.value, 120);
  assert.equal(plan.legs[0].duration.value, 120);
  assert.equal(plan.path[0].lat(), 6.9);
  assert.equal(plan.isDrivingFallback, false);
});

test('empty bus result falls back to a labeled driving route without transit options', async () => {
  const api = setup([{ routes: [] }, { routes: [fixture()] }]);
  const plan = await api.computeRoutePlan('A', 'B', new Date(), 'BUS');
  assert.equal(api.calls[1].travelMode, 'DRIVING');
  assert.equal(api.calls[1].transitPreference, undefined);
  assert.equal(plan.isDrivingFallback, true);
});

test('authorization failures are propagated without a fallback request', async () => {
  const api = setup([new Error('PERMISSION_DENIED')]);
  await assert.rejects(api.computeRoutePlan('A', 'B', new Date(), 'BUS'), /PERMISSION_DENIED/);
  assert.equal(api.calls.length, 1);
});

test('empty train results do not become road routes', async () => {
  const api = setup([{ routes: [] }]);
  await assert.rejects(api.computeRoutePlan('A', 'B', new Date(), 'TRAIN'), /No train route/);
  assert.equal(api.calls.length, 1);
});

test('invalid GPS coordinates remain address strings; incomplete routes are rejected', () => {
  const api = setup([]);
  assert.equal(api.routeLocation('95,200'), '95,200');
  assert.throws(() => api.normalizeRoute({ path: [], legs: [] }), /missing path/);
});
