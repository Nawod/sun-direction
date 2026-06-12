'use client';

import { useState, useEffect } from 'react';
import { Navigation, MapPin, Bus, Train, Map as MapIcon, ChevronDown, ChevronUp, ArrowUpDown, LocateFixed, Share2, History, CloudRain, Cloud } from 'lucide-react';
import { Autocomplete } from '@react-google-maps/api';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { RecommendationResult } from '@/utils/sunMath';
import { WeatherData } from '@/utils/weather';
import { RecentRoute } from '@/app/page';

export type TransportMode = 'BUS' | 'TRAIN';

interface ControlsProps {
  origin: string;
  setOrigin: (val: string) => void;
  destination: string;
  setDestination: (val: string) => void;
  onCalculate: () => void;
  departureDate: Date;
  setDepartureDate: (val: Date) => void;
  timezone: string;
  recommendationResult: RecommendationResult | null;
  weather: WeatherData | null;
  isLoading: boolean;
  transportMode: TransportMode;
  setTransportMode: (mode: TransportMode) => void;
  recentRoutes: RecentRoute[];
}

export default function Controls({
  origin,
  setOrigin,
  destination,
  setDestination,
  onCalculate,
  departureDate,
  setDepartureDate,
  timezone,
  recommendationResult,
  weather,
  isLoading,
  transportMode,
  setTransportMode,
  recentRoutes
}: ControlsProps) {

  const [autocompleteOrigin, setAutocompleteOrigin] = useState<google.maps.places.Autocomplete | null>(null);
  const [autocompleteDestination, setAutocompleteDestination] = useState<google.maps.places.Autocomplete | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    try {
      const formatted = formatInTimeZone(departureDate, timezone, "yyyy-MM-dd'T'HH:mm");
      setInputValue(formatted);
    } catch (e) { }
  }, [departureDate, timezone]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!e.target.value) return;
    try {
      const parsed = toDate(e.target.value + ':00', { timeZone: timezone });
      if (!isNaN(parsed.getTime())) {
        setDepartureDate(parsed);
      }
    } catch (err) { console.error(err) }
  };

  // Limit date picker to current date (min) and 3 days from now (max)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 3);
  let maxInputValue = '';
  let minInputValue = '';
  try {
    maxInputValue = formatInTimeZone(maxDate, timezone, "yyyy-MM-dd'T'HH:mm");
    minInputValue = formatInTimeZone(new Date(), timezone, "yyyy-MM-dd'T'HH:mm");
  } catch (e) { }

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setOrigin(`${latitude},${longitude}`);
      }, () => {
        alert("Could not access your location. Please enable GPS permissions.");
      });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Route link copied to clipboard!");
  };

  const onOriginLoad = (autocomplete: google.maps.places.Autocomplete) => setAutocompleteOrigin(autocomplete);
  const onDestinationLoad = (autocomplete: google.maps.places.Autocomplete) => setAutocompleteDestination(autocomplete);

  const onOriginPlaceChanged = () => {
    if (autocompleteOrigin !== null) {
      const place = autocompleteOrigin.getPlace();
      setOrigin(place?.formatted_address || place?.name || origin);
    }
  };

  const onDestinationPlaceChanged = () => {
    if (autocompleteDestination !== null) {
      const place = autocompleteDestination.getPlace();
      setDestination(place?.formatted_address || place?.name || destination);
    }
  };

  // Determine actual recommendation considering weather
  let finalRec = recommendationResult?.recommendation;
  let weatherOverride = false;

  if (recommendationResult) {
    if (weather?.isRainy) {
      finalRec = "Rainy 🌧️";
      weatherOverride = true;
    } else if (weather?.isCloudy) {
      finalRec = "Cloudy ☁️";
      weatherOverride = true;
    }
  }

  return (
    <div className="glass-panel controls-panel" style={isMinimized ? { paddingBottom: '24px', gap: 0 } : {}}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMinimized ? 0 : '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapIcon size={20} color="#eab308" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Route Planner</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleShare} style={{ padding: '6px', background: 'rgba(255,255,255,0.1)', width: 'auto', boxShadow: 'none' }} title="Share Route">
            <Share2 size={18} />
          </button>
          <button onClick={() => setIsMinimized(!isMinimized)} style={{ padding: '6px', background: 'transparent', color: '#fff', width: 'auto', boxShadow: 'none' }}>
            {isMinimized ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setTransportMode('BUS')}
              style={{
                flex: 1,
                background: transportMode === 'BUS' ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                color: transportMode === 'BUS' ? '#fff' : 'rgba(255,255,255,0.6)',
                boxShadow: 'none'
              }}
            >
              <Bus size={18} /> Bus
            </button>
            <button
              onClick={() => setTransportMode('TRAIN')}
              style={{
                flex: 1,
                background: transportMode === 'TRAIN' ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                color: transportMode === 'TRAIN' ? '#fff' : 'rgba(255,255,255,0.6)',
                boxShadow: 'none'
              }}
            >
              <Train size={18} /> Train
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'rgba(255,255,255,0.4)', zIndex: 2 }} />
              <Autocomplete onLoad={onOriginLoad} onPlaceChanged={onOriginPlaceChanged}>
                <input
                  type="text"
                  placeholder="Origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  style={{ paddingLeft: '40px', paddingRight: '40px' }}
                />
              </Autocomplete>
              <button
                onClick={handleGPS}
                style={{ position: 'absolute', right: '4px', top: '4px', padding: '6px', width: 'auto', background: 'transparent', boxShadow: 'none' }}
                title="Use Current Location"
              >
                <LocateFixed size={18} color="#3b82f6" />
              </button>
            </div>

            <button onClick={handleSwap} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, padding: '4px', width: 'auto', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%' }}>
              <ArrowUpDown size={14} color="#eab308" />
            </button>

            <div style={{ position: 'relative' }}>
              <Navigation size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'rgba(255,255,255,0.4)', zIndex: 2 }} />
              <Autocomplete onLoad={onDestinationLoad} onPlaceChanged={onDestinationPlaceChanged}>
                <input
                  type="text"
                  placeholder="Destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  style={{ paddingLeft: '40px', paddingRight: '40px' }}
                />
              </Autocomplete>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
              <span>Departure Time ({timezone.split('/')[1] || timezone})</span>
            </div>
            <input
              type="datetime-local"
              value={inputValue}
              min={minInputValue}
              max={maxInputValue}
              onChange={handleDateChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#fff',
                fontFamily: 'Outfit, sans-serif'
              }}
            />
          </div>

          <button onClick={onCalculate} disabled={isLoading || !origin || !destination}>
            {isLoading ? 'Calculating...' : 'Find Best Side'}
          </button>

          {recommendationResult && (
            <div style={{
              marginTop: '8px',
              padding: '16px',
              borderRadius: '12px',
              background: weatherOverride ? 'linear-gradient(135deg, rgba(100, 116, 139, 0.2), rgba(71, 85, 105, 0.1))' :
                finalRec === 'Right' ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.1))' :
                  finalRec === 'Left' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))' :
                    finalRec === 'Night' ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(109, 40, 217, 0.1))' :
                      'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                {weatherOverride ? 'No Sun Glare' : finalRec === 'Night' ? 'No Sun Glare' : 'Recommended Seat Side'}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
                {finalRec === 'Night' ? 'Night Time 🌙' : weatherOverride ? `${finalRec} - Sit Anywhere` : finalRec}
              </div>

              {!weatherOverride && finalRec !== 'Night' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                    <span>Left Sun Exposure</span>
                    <span>Right Sun Exposure</span>
                  </div>
                  <div style={{ display: 'flex', height: '6px', borderRadius: '4px', overflow: 'hidden', background: 'rgba(255,255,255,0.1)' }}>
                    {(() => {
                      const total = recommendationResult.leftCount + recommendationResult.rightCount || 1;
                      const leftPct = (recommendationResult.leftCount / total) * 100;
                      return (
                        <>
                          <div style={{ width: `${leftPct}%`, background: '#3b82f6' }} />
                          <div style={{ width: `${100 - leftPct}%`, background: '#f97316' }} />
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '16px', textAlign: 'left' }}>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Trip Timeline</span>
                <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
                  {recommendationResult.timeline.map((seg, i) => {
                    let bg = '#333';
                    if (seg.status === 'night') bg = '#8b5cf6'; // Purple
                    if (seg.status === 'left') bg = '#3b82f6'; // Blue
                    if (seg.status === 'right') bg = '#f97316'; // Orange
                    return <div key={i} style={{ flex: seg.durationMs, backgroundColor: bg }} title={`${seg.status}`} />
                  })}
                </div>
              </div>
            </div>
          )}

          {recentRoutes.length > 0 && !recommendationResult && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '8px' }}>
                <History size={14} /> Recent Routes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {recentRoutes.map((route, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setOrigin(route.origin);
                      setDestination(route.destination);
                      setTransportMode(route.mode);
                    }}
                    style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left', padding: '8px 12px', fontSize: '0.85rem', boxShadow: 'none' }}
                  >
                    <div style={{ color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{route.origin.split(',')[0]} → {route.destination.split(',')[0]}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>{route.mode}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
