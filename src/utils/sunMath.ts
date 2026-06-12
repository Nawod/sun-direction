import SunCalc from 'suncalc';

export interface Coordinates {
  lat: number;
  lng: number;
}

// Convert degrees to radians
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// Convert radians to degrees
function toDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculates the standard bearing (0-360 degrees, clockwise from North)
 * between two coordinates.
 */
export function getBearing(start: Coordinates, end: Coordinates): number {
  const startLat = toRad(start.lat);
  const startLng = toRad(start.lng);
  const endLat = toRad(end.lat);
  const endLng = toRad(end.lng);

  const dLng = endLng - startLng;

  const y = Math.sin(dLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

  let brng = Math.atan2(y, x);
  brng = toDeg(brng);
  return (brng + 360) % 360;
}

/**
 * Calculates the sun's azimuth (bearing) in standard degrees
 * (0-360, clockwise from North) for a given time and location.
 */
export function getSunBearing(time: Date, lat: number, lng: number): number {
  const sunPos = SunCalc.getPosition(time, lat, lng);
  
  // SunCalc azimuth is in radians, measured from south to west.
  // 0 is South, Math.PI/2 is West.
  // We need to convert this to standard bearing (0 is North, 90 is East).
  // South = 0 rad -> 180 deg. West = PI/2 rad -> 270 deg.
  const azimuthDeg = toDeg(sunPos.azimuth);
  const standardBearing = (azimuthDeg + 180) % 360;
  
  return standardBearing;
}

/**
 * Determines which side the sun is hitting relative to the vehicle's heading.
 * Returns 'left', 'right', 'front', or 'back'.
 */
export function getSunSide(routeBearing: number, sunBearing: number): 'left' | 'right' | 'front' | 'back' {
  const relativeAngle = (sunBearing - routeBearing + 360) % 360;

  // Define thresholds for front and back to account for sun directly in eyes or behind
  if (relativeAngle < 30 || relativeAngle > 330) {
    return 'front';
  } else if (relativeAngle > 150 && relativeAngle < 210) {
    return 'back';
  } else if (relativeAngle >= 30 && relativeAngle <= 150) {
    return 'right'; // Sun is on the right
  } else {
    return 'left'; // Sun is on the left
  }
}

/**
 * Recommends the best side to sit on to AVOID the sun.
 */
export function getRecommendation(sunSide: 'left' | 'right' | 'front' | 'back'): string {
  switch (sunSide) {
    case 'left':
      return 'Right'; // If sun is left, sit right
    case 'right':
      return 'Left'; // If sun is right, sit left
    case 'front':
      return 'Either (Sun is ahead)';
    case 'back':
      return 'Either (Sun is behind)';
  }
}

/**
 * Aggregates the best side over multiple route steps.
 */
export function calculateOverallBestSide(
  steps: Coordinates[],
  time: Date
): {
  recommendation: string;
  leftCount: number;
  rightCount: number;
} {
  if (steps.length < 2) return { recommendation: 'Unknown', leftCount: 0, rightCount: 0 };

  let leftCount = 0;
  let rightCount = 0;

  for (let i = 0; i < steps.length - 1; i++) {
    const start = steps[i];
    const end = steps[i + 1];
    
    const routeBearing = getBearing(start, end);
    // Use the midpoint or just the start point for sun position
    const sunBearing = getSunBearing(time, start.lat, start.lng);
    
    const side = getSunSide(routeBearing, sunBearing);
    if (side === 'left') leftCount++;
    if (side === 'right') rightCount++;
  }

  let recommendation = 'Either';
  if (leftCount > rightCount) recommendation = 'Right'; // Avoid left
  if (rightCount > leftCount) recommendation = 'Left';  // Avoid right

  return { recommendation, leftCount, rightCount };
}
