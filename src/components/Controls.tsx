'use client';

import { useState, useEffect } from 'react';
import { Navigation, MapPin, Bus, Train, Map as MapIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { Autocomplete } from '@react-google-maps/api';
import { formatInTimeZone, toDate } from 'date-fns-tz';

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
  recommendation: string | null;
  isLoading: boolean;
  transportMode: TransportMode;
  setTransportMode: (mode: TransportMode) => void;
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
  recommendation,
  isLoading,
  transportMode,
  setTransportMode
}: ControlsProps) {
  
  const [autocompleteOrigin, setAutocompleteOrigin] = useState<google.maps.places.Autocomplete | null>(null);
  const [autocompleteDestination, setAutocompleteDestination] = useState<google.maps.places.Autocomplete | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Sync input string with actual Date when Date or timezone changes
  useEffect(() => {
    try {
      const formatted = formatInTimeZone(departureDate, timezone, "yyyy-MM-dd'T'HH:mm");
      setInputValue(formatted);
    } catch (e) {
      // Ignore initial render format errors
    }
  }, [departureDate, timezone]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!e.target.value) return;
    try {
      // Ensure we parse the datetime string EXACTLY within the selected timezone
      const parsed = toDate(e.target.value + ':00', { timeZone: timezone });
      if (!isNaN(parsed.getTime())) {
        setDepartureDate(parsed);
      }
    } catch(err) { console.error(err) }
  };

  const onOriginLoad = (autocomplete: google.maps.places.Autocomplete) => {
    setAutocompleteOrigin(autocomplete);
  };

  const onDestinationLoad = (autocomplete: google.maps.places.Autocomplete) => {
    setAutocompleteDestination(autocomplete);
  };

  const onOriginPlaceChanged = () => {
    if (autocompleteOrigin !== null) {
      const place = autocompleteOrigin.getPlace();
      if (place && place.formatted_address) {
        setOrigin(place.formatted_address);
      } else if (place && place.name) {
        setOrigin(place.name);
      }
    }
  };

  const onDestinationPlaceChanged = () => {
    if (autocompleteDestination !== null) {
      const place = autocompleteDestination.getPlace();
      if (place && place.formatted_address) {
        setDestination(place.formatted_address);
      } else if (place && place.name) {
        setDestination(place.name);
      }
    }
  };

  return (
    <div className="glass-panel controls-panel" style={isMinimized ? { paddingBottom: '24px', gap: 0 } : {}}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMinimized ? 0 : '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapIcon size={20} color="#eab308" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Route Planner</h2>
        </div>
        <button 
          onClick={() => setIsMinimized(!isMinimized)}
          style={{ padding: '4px', background: 'transparent', color: '#fff', width: 'auto', boxShadow: 'none' }}
        >
          {isMinimized ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'rgba(255,255,255,0.4)', zIndex: 2 }} />
              <Autocomplete onLoad={onOriginLoad} onPlaceChanged={onOriginPlaceChanged}>
                <input 
                  type="text" 
                  placeholder="Origin (e.g. Colombo Fort)" 
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </Autocomplete>
            </div>
            <div style={{ position: 'relative' }}>
              <Navigation size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'rgba(255,255,255,0.4)', zIndex: 2 }} />
              <Autocomplete onLoad={onDestinationLoad} onPlaceChanged={onDestinationPlaceChanged}>
                <input 
                  type="text" 
                  placeholder="Destination (e.g. Maharagama)" 
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  style={{ paddingLeft: '40px' }}
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

          <button onClick={() => {
            onCalculate();
          }} disabled={isLoading || !origin || !destination}>
            {isLoading ? 'Calculating...' : 'Find Best Side'}
          </button>

          {recommendation && (
            <div style={{
              marginTop: '8px',
              padding: '16px',
              borderRadius: '12px',
              background: recommendation === 'Right' ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.1))' :
                recommendation === 'Left' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))' :
                recommendation === 'Night' ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(109, 40, 217, 0.1))' :
                  'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                {recommendation === 'Night' ? 'No Sun Glare' : 'Recommended Seat Side'}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
                {recommendation === 'Night' ? 'Night Time 🌙' : recommendation}
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
