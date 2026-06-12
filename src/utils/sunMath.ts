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
export function getMoonBearing(time: Date, lat: number, lng: number): number {
  const position = SunCalc.getMoonPosition(time, lat, lng);
  let bearing = (position.azimuth * 180) / Math.PI + 180;
  if (bearing >= 360) bearing -= 360;
  return bearing;
}

export function isNightTime(time: Date, lat: number, lng: number): boolean {
  const position = SunCalc.getPosition(time, lat, lng);
  // Altitude < 0 means sun is below horizon. We use 0 as a strict cutoff.
  return position.altitude < 0;
}

export interface TimelineSegment {
  timeMs: number;
  durationMs: number;
  status: 'left' | 'right' | 'night' | 'neutral';
}

export interface RecommendationResult {
  recommendation: string;
  leftCount: number;
  rightCount: number;
  timeline: TimelineSegment[];
}

export function calculateOverallBestSide(legs: any[], departureTime: Date): RecommendationResult {
  if (legs.length === 0) return { recommendation: 'Either', leftCount: 0, rightCount: 0, timeline: [] };
  const steps = legs[0].steps;
  if (!steps || steps.length === 0) return { recommendation: 'Either', leftCount: 0, rightCount: 0, timeline: [] };

  let leftExposure = 0;
  let rightExposure = 0;
  let currentTimeMs = departureTime.getTime();
  let anyNight = false;
  let anyDay = false;
  
  const rawTimeline: TimelineSegment[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const path = step.path; 
    const stepDurationMs = (step.duration?.value || 0) * 1000;
    
    if (!path || path.length < 2) {
      currentTimeMs += stepDurationMs;
      continue;
    }
    
    const durationPerSegment = stepDurationMs / (path.length - 1);

    for (let j = 0; j < path.length - 1; j++) {
      const pt1 = { lat: path[j].lat(), lng: path[j].lng() };
      const pt2 = { lat: path[j+1].lat(), lng: path[j+1].lng() };
      
      const segmentTime = new Date(currentTimeMs);
      const position = SunCalc.getPosition(segmentTime, pt1.lat, pt1.lng);
      
      let currentStatus: 'left' | 'right' | 'night' | 'neutral' = 'neutral';
      
      if (position.altitude < 0) {
        anyNight = true;
        currentStatus = 'night';
      } else {
        anyDay = true;
        const routeBearing = getBearing(pt1, pt2);
        
        let sunBearing = (position.azimuth * 180) / Math.PI + 180;
        if (sunBearing >= 360) sunBearing -= 360;
        
        const side = getSunSide(routeBearing, sunBearing);
        const harshness = Math.max(0, Math.cos(position.altitude));
        const exposure = (durationPerSegment / 1000) * harshness;

        if (side === 'left') {
          leftExposure += exposure;
          currentStatus = 'left';
        } else if (side === 'right') {
          rightExposure += exposure;
          currentStatus = 'right';
        }
      }
      
      rawTimeline.push({
        timeMs: segmentTime.getTime(),
        durationMs: durationPerSegment,
        status: currentStatus
      });
      
      currentTimeMs += durationPerSegment;
    }
  }

  // Condense consecutive segments with the same status
  const timeline: TimelineSegment[] = [];
  for (const seg of rawTimeline) {
    if (timeline.length === 0) {
      timeline.push({ ...seg });
    } else {
      const last = timeline[timeline.length - 1];
      if (last.status === seg.status) {
        last.durationMs += seg.durationMs;
      } else {
        timeline.push({ ...seg });
      }
    }
  }

  if (!anyDay && anyNight) {
    return { recommendation: 'Night', leftCount: 0, rightCount: 0, timeline };
  }

  let recommendation = 'Either';
  
  if (leftExposure > rightExposure * 1.1) {
    recommendation = 'Right';
  } else if (rightExposure > leftExposure * 1.1) {
    recommendation = 'Left';
  }

  return { 
    recommendation, 
    leftCount: Math.round(leftExposure), 
    rightCount: Math.round(rightExposure),
    timeline
  };
}

export function findShadierTime(legs: any[], currentDepartureDate: Date, originalLeft: number, originalRight: number): Date | null {
  const originalExposure = originalLeft + originalRight;
  if (originalExposure === 0) return null; // Already no sun

  let bestTime: Date | null = null;
  let lowestExposure = originalExposure;

  // Search +/- 4 hours in 30 minute increments (-8 to +8)
  for (let offset = -8; offset <= 8; offset++) {
    if (offset === 0) continue;
    const testDate = new Date(currentDepartureDate.getTime() + offset * 30 * 60000);
    
    // Don't suggest times in the past
    if (testDate.getTime() < Date.now()) continue;

    const res = calculateOverallBestSide(legs, testDate);
    const testExposure = res.leftCount + res.rightCount;

    // Look for at least a 30% reduction in total sun exposure
    if (testExposure < lowestExposure && testExposure <= originalExposure * 0.7) {
      lowestExposure = testExposure;
      bestTime = testDate;
    }
  }

  return bestTime;
}

