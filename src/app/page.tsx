'use client';

import { useState, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import Map from '@/components/Map';
import Controls, { TransportMode } from '@/components/Controls';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { calculateOverallBestSide } from '@/utils/sunMath';

const libraries: ("places")[] = ["places"];

export default function Home() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState<Date>(new Date());
  const [timezone, setTimezone] = useState<string>('UTC');
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [transportMode, setTransportMode] = useState<TransportMode>('BUS');

  useEffect(() => {
    setIsMounted(true);
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setDepartureDate(new Date());
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
          
          const legs = result.routes[0].legs;
          const { recommendation: rec } = calculateOverallBestSide(legs, departureDate);
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
      <Header timezone={timezone} setTimezone={setTimezone} />
      
      <Map directions={directions} departureDate={departureDate} timezone={timezone} />
      
      <Controls 
        origin={origin}
        setOrigin={setOrigin}
        destination={destination}
        setDestination={setDestination}
        departureDate={departureDate}
        setDepartureDate={setDepartureDate}
        timezone={timezone}
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
