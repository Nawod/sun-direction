'use client';

import { useState, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import Map from '@/components/Map';
import Controls, { TransportMode } from '@/components/Controls';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { calculateOverallBestSide, Coordinates } from '@/utils/sunMath';

const libraries: ("places")[] = ["places"];

export default function Home() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [timeOffset, setTimeOffset] = useState(0);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [transportMode, setTransportMode] = useState<TransportMode>('BUS');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries,
  });

  const handleCalculate = () => {
    if (!origin || !destination) return;
    if (!window.google) return;

    setIsLoading(true);
    setRecommendation(null);

    const directionsService = new window.google.maps.DirectionsService();

    const routeRequest: google.maps.DirectionsRequest = {
      origin: origin,
      destination: destination,
      travelMode: transportMode === 'TRAIN' 
        ? window.google.maps.TravelMode.TRANSIT 
        : window.google.maps.TravelMode.DRIVING,
    };

    if (transportMode === 'TRAIN') {
      routeRequest.transitOptions = {
        modes: [window.google.maps.TransitMode.TRAIN],
      };
    }

    directionsService.route(
      routeRequest,
      (result, status) => {
        setIsLoading(false);
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          
          const path = result.routes[0].overview_path;
          const steps: Coordinates[] = path.map(p => ({ lat: p.lat(), lng: p.lng() }));
          
          const targetTime = new Date();
          targetTime.setMinutes(targetTime.getMinutes() + (timeOffset * 60));
          
          const { recommendation: rec } = calculateOverallBestSide(steps, targetTime);
          setRecommendation(rec);
          
        } else {
          alert(`Could not find a ${transportMode.toLowerCase()} route. Please check your locations.`);
        }
      }
    );
  };

  if (!isMounted) return null;

  if (!apiKey) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: '#fff', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Missing Google Maps API Key</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file and restart the server.</p>
      </div>
    );
  }

  if (loadError) {
    return <div style={{ color: 'white', padding: '2rem' }}>Error loading Google Maps API</div>;
  }

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: '#fff' }}>
        Loading Map & Places...
      </div>
    );
  }

  return (
    <main style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Header />
      
      <Map directions={directions} />
      
      <Controls 
        origin={origin}
        setOrigin={setOrigin}
        destination={destination}
        setDestination={setDestination}
        timeOffset={timeOffset}
        setTimeOffset={setTimeOffset}
        onCalculate={handleCalculate}
        recommendation={recommendation}
        isLoading={isLoading}
        transportMode={transportMode}
        setTransportMode={setTransportMode}
      />

      <Footer />
    </main>
  );
}
