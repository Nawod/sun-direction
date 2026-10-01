export interface JourneyStep {
  path: google.maps.LatLng[];
  instructions: string;
  distance: { value: number; text: string };
  duration: { value: number; text: string };
}

export interface JourneyLeg {
  steps: JourneyStep[];
  duration: { value: number };
}

export interface RoutePlan {
  route: google.maps.routes.Route;
  path: google.maps.LatLng[];
  legs: JourneyLeg[];
  isDrivingFallback: boolean;
}

// GPS values come from the route form as strings; Routes expects coordinates
// as an object rather than an address that happens to contain two numbers.
export function routeLocation(value: string): string | google.maps.LatLngLiteral {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return value;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : value;
}

export function normalizeRoute(route: google.maps.routes.Route, isDrivingFallback = false): RoutePlan {
  const toLatLng = (point: google.maps.LatLngAltitude) => new google.maps.LatLng(point.lat, point.lng);
  const legs = (route.legs || []).map((leg): JourneyLeg => ({
    duration: { value: (leg.durationMillis ?? leg.staticDurationMillis ?? 0) / 1000 },
    steps: leg.steps.map((step): JourneyStep => {
      const durationSeconds = (step.staticDurationMillis ?? 0) / 1000;
      return {
        path: step.path.map(toLatLng),
        instructions: step.instructions || (step.travelMode === 'TRANSIT' ? 'Take public transport' : 'Continue'),
        distance: {
          value: step.distanceMeters,
          text: step.localizedValues?.distance || `${Math.round(step.distanceMeters)} m`,
        },
        duration: {
          value: durationSeconds,
          text: step.localizedValues?.staticDuration || `${Math.round(durationSeconds / 60)} min`,
        },
      };
    }),
  }));
  const path = (route.path || []).map(toLatLng);
  if (!path.length || !legs.length || !legs[0].steps.length) {
    throw new Error('The route response is missing path or journey details. Please try again.');
  }
  return { route, path, legs, isDrivingFallback };
}

export async function computeRoutePlan(
  origin: string,
  destination: string,
  departureTime: Date,
  mode: 'BUS' | 'TRAIN',
): Promise<RoutePlan> {
  const { Route } = await google.maps.importLibrary('routes') as google.maps.RoutesLibrary;
  const request: google.maps.routes.ComputeRoutesRequest = {
    origin: routeLocation(origin),
    destination: routeLocation(destination),
    travelMode: 'TRANSIT',
    departureTime,
    transitPreference: { allowedTransitModes: [mode] },
    fields: ['path', 'legs', 'viewport', 'warnings'],
    polylineQuality: 'HIGH_QUALITY',
  };
  const { routes } = await Route.computeRoutes(request);
  if (routes?.length) return normalizeRoute(routes[0]);
  // Preserve the existing road-route fallback only for absent bus routes.
  // Authorization and network errors propagate without a second API request.
  if (mode === 'BUS') {
    const drivingRequest = { ...request, travelMode: 'DRIVING' as const };
    delete drivingRequest.transitPreference;
    drivingRequest.departureTime = new Date(Math.max(departureTime.getTime(), Date.now()));
    const fallback = await Route.computeRoutes(drivingRequest);
    if (fallback.routes?.length) return normalizeRoute(fallback.routes[0], true);
  }
  throw new Error(`No ${mode.toLowerCase()} route is available for these locations and departure time.`);
}
