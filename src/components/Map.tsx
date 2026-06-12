'use client';

import { useCallback, useState, useMemo, useEffect } from 'react';
import { GoogleMap, DirectionsRenderer, Polyline, OverlayView } from '@react-google-maps/api';
import { getSunBearing, getMoonBearing, isNightTime } from '@/utils/sunMath';
import { Sun, Moon } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: 6.9271, // Colombo default
  lng: 79.8612
};

// Sleek Dark Mode Map Styles
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

interface MapProps {
  directions: google.maps.DirectionsResult | null;
  targetTime: Date;
}

export default function Map({ directions, targetTime }: MapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activePoint, setActivePoint] = useState<google.maps.LatLng | null>(null);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null);
  }, []);

  // Reset point if the route itself changes entirely
  useEffect(() => {
    setActivePoint(null);
  }, [directions]);

  const path = useMemo(() => {
    if (!directions) return [];
    return directions.routes[0].overview_path;
  }, [directions]);

  const currentPoint = activePoint || (path.length > 0 ? path[0] : null);
  const isDefault = !activePoint;

  const isNight = useMemo(() => {
    if (!currentPoint) return false;
    return isNightTime(targetTime, currentPoint.lat(), currentPoint.lng());
  }, [currentPoint, targetTime]);

  // Calculate sun/moon translation offset based on active point and time
  const sunTransform = useMemo(() => {
    if (!currentPoint) return '';
    const lat = currentPoint.lat();
    const lng = currentPoint.lng();
    const bearing = isNight ? getMoonBearing(targetTime, lat, lng) : getSunBearing(targetTime, lat, lng);
    
    // Convert standard bearing (0 is North) to radians
    // Screen math: North = -Y, East = +X
    const rad = (bearing * Math.PI) / 180;
    const distancePixels = 80; // Distance of sun from cursor
    
    const x = Math.sin(rad) * distancePixels;
    const y = -Math.cos(rad) * distancePixels;
    
    return `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  }, [currentPoint, targetTime, isNight]);

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={11}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        styles: darkMapStyle,
        disableDefaultUI: true,
        zoomControl: true,
      }}
    >
      {directions && (
        <>
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: {
                strokeOpacity: 0, // Hide default polyline so we can draw our interactive one
              },
              suppressMarkers: false,
            }}
          />
          
          {/* Visible Line (No events attached so it doesn't block the invisible wide line) */}
          <Polyline
            path={path}
            options={{
              strokeColor: '#3b82f6',
              strokeOpacity: 0.8,
              strokeWeight: 6,
              zIndex: 10,
              clickable: false,
            }}
          />

          {/* Invisible Wide Hit Area for easier hovering and touching */}
          <Polyline
            path={path}
            options={{
              strokeColor: '#000000',
              strokeOpacity: 0.01, // Almost invisible
              strokeWeight: 40,    // Very wide hit area
              zIndex: 20,
            }}
            onMouseMove={(e) => {
              if (e.latLng) setActivePoint(e.latLng);
            }}
            onClick={(e) => {
              if (e.latLng) setActivePoint(e.latLng);
            }}
          />

          {currentPoint && (
            <OverlayView
              position={currentPoint}
              mapPaneName="overlayMouseTarget"
            >
              <div style={{
                position: 'absolute',
                transform: sunTransform,
                pointerEvents: 'none', // Crucial to allow mouse events to pass through to polyline
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.1s linear' // Smooth movement during time slider scrubbing
              }}>
                <div style={{
                  background: isNight ? 'rgba(139, 92, 246, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                  backdropFilter: 'blur(4px)',
                  padding: isDefault ? '8px 16px' : '8px',
                  borderRadius: '50px',
                  border: isNight ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(234, 179, 8, 0.4)',
                  boxShadow: isNight ? '0 0 20px rgba(139, 92, 246, 0.3)' : '0 0 20px rgba(234, 179, 8, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.3s ease'
                }}>
                  {isNight ? (
                    <Moon size={24} color="#a78bfa" style={{ minWidth: '24px' }} />
                  ) : (
                    <Sun size={24} color="#eab308" style={{ minWidth: '24px' }} />
                  )}
                  {isDefault && (
                    <span style={{ 
                      color: isNight ? '#a78bfa' : '#eab308', 
                      fontSize: '0.8rem', 
                      fontWeight: 600,
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                      Touch the route to track {isNight ? 'moon' : 'sun'}
                    </span>
                  )}
                </div>
              </div>
            </OverlayView>
          )}
        </>
      )}
    </GoogleMap>
  );
}
