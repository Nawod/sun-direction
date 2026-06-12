'use client';

import { useState, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import Map from '@/components/Map';
import Controls, { TransportMode } from '@/components/Controls';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { calculateOverallBestSide, RecommendationResult } from '@/utils/sunMath';
import { fetchWeather, WeatherData } from '@/utils/weather';

const libraries: ("places")[] = ["places"];

export interface RecentRoute {
  origin: string;
  destination: string;
  mode: TransportMode;
}

export default function Home() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState<Date>(new Date());
  const [timezone, setTimezone] = useState<string>('UTC');
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [recommendationResult, setRecommendationResult] = useState<RecommendationResult | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [transportMode, setTransportMode] = useState<TransportMode>('BUS');
  const [recentRoutes, setRecentRoutes] = useState<RecentRoute[]>([]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries,
  });

  useEffect(() => {
    setIsMounted(true);
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    
    const params = new URLSearchParams(window.location.search);
    if (params.get('origin')) setOrigin(params.get('origin')!);
    if (params.get('dest')) setDestination(params.get('dest')!);
    if (params.get('mode') === 'TRAIN' || params.get('mode') === 'BUS') setTransportMode(params.get('mode') as TransportMode);
    if (params.get('time')) {
      const parsed = new Date(Number(params.get('time')));
      if (!isNaN(parsed.getTime())) setDepartureDate(parsed);
    } else {
      setDepartureDate(new Date());
    }

    try {
      const recents = JSON.parse(localStorage.getItem('sun-direction-recents') || '[]');
      setRecentRoutes(recents);
    } catch(e){}
  }, []);

  const saveRecent = (orig: string, dest: string, mode: TransportMode) => {
    const newRoute = { origin: orig, destination: dest, mode };
    setRecentRoutes(prev => {
      const filtered = prev.filter(r => !(r.origin === orig && r.destination === dest));
      const updated = [newRoute, ...filtered].slice(0, 5);
      localStorage.setItem('sun-direction-recents', JSON.stringify(updated));
      return updated;
    });
  };

  const updateUrl = () => {
    const params = new URLSearchParams();
    params.set('origin', origin);
    params.set('dest', destination);
    params.set('mode', transportMode);
    params.set('time', departureDate.getTime().toString());
    window.history.replaceState(null, '', `?${params.toString()}`);
  };

  const handleCalculate = () => {
    if (!origin || !destination) return;
    if (!window.google) return;

    setIsLoading(true);
    setRecommendationResult(null);
    setWeather(null);
    updateUrl();

    const directionsService = new window.google.maps.DirectionsService();

    const routeRequest: google.maps.DirectionsRequest = {
      origin: origin,
      destination: destination,
      travelMode: window.google.maps.TravelMode.TRANSIT, 
    };

    if (transportMode === 'TRAIN') {
      routeRequest.transitOptions = { modes: [window.google.maps.TransitMode.TRAIN] };
    } else if (transportMode === 'BUS') {
      routeRequest.transitOptions = { modes: [window.google.maps.TransitMode.BUS] };
    }

    const processResult = async (result: google.maps.DirectionsResult) => {
      setDirections(result);
      saveRecent(origin, destination, transportMode);
      
      const legs = result.routes[0].legs;
      const recResult = calculateOverallBestSide(legs, departureDate);
      setRecommendationResult(recResult);
      
      const path = result.routes[0].overview_path;
      if (path.length > 0) {
        const midPoint = path[Math.floor(path.length / 2)];
        const durationSecs = legs[0].duration?.value || 0;
        const midTime = new Date(departureDate.getTime() + (durationSecs / 2) * 1000);
        const wData = await fetchWeather(midPoint.lat(), midPoint.lng(), midTime);
        setWeather(wData);
      }
      setIsLoading(false);
    };

    directionsService.route(routeRequest, (result, status) => {
      if (status === window.google.maps.DirectionsStatus.OK && result) {
        processResult(result);
      } else if (transportMode === 'BUS' && status === window.google.maps.DirectionsStatus.ZERO_RESULTS) {
        routeRequest.travelMode = window.google.maps.TravelMode.DRIVING;
        delete routeRequest.transitOptions;
        
        directionsService.route(routeRequest, (fallbackResult, fallbackStatus) => {
          if (fallbackStatus === window.google.maps.DirectionsStatus.OK && fallbackResult) {
            processResult(fallbackResult);
          } else {
            setIsLoading(false);
            alert(`Could not find a route. Please check your locations.`);
          }
        });
      } else {
        setIsLoading(false);
        alert(`Could not find a ${transportMode.toLowerCase()} route. Please check your locations.`);
      }
    });
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
      
      <Map directions={directions} departureDate={departureDate} timezone={timezone} weather={weather} />
      
      <Controls 
        origin={origin}
        setOrigin={setOrigin}
        destination={destination}
        setDestination={setDestination}
        departureDate={departureDate}
        setDepartureDate={setDepartureDate}
        timezone={timezone}
        onCalculate={handleCalculate}
        recommendationResult={recommendationResult}
        weather={weather}
        isLoading={isLoading}
        transportMode={transportMode}
        setTransportMode={setTransportMode}
        recentRoutes={recentRoutes}
      />

      <Footer />
    </main>
  );
}
