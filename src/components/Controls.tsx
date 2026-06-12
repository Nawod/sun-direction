'use client';

import { useState } from 'react';
import { Navigation, MapPin, Bus, Train } from 'lucide-react';
import { Autocomplete } from '@react-google-maps/api';

export type TransportMode = 'BUS' | 'TRAIN';

interface ControlsProps {
  origin: string;
  setOrigin: (val: string) => void;
  destination: string;
  setDestination: (val: string) => void;
  onCalculate: () => void;
  timeOffset: number; // 0 to 6
  setTimeOffset: (val: number) => void;
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
  timeOffset,
  setTimeOffset,
  recommendation,
  isLoading,
  transportMode,
  setTransportMode
}: ControlsProps) {
  
  const [autocompleteOrigin, setAutocompleteOrigin] = useState<google.maps.places.Autocomplete | null>(null);
  const [autocompleteDestination, setAutocompleteDestination] = useState<google.maps.places.Autocomplete | null>(null);

  const formatTime = (offsetHours: number) => {
    const d = new Date();
    d.setHours(d.getHours() + offsetHours);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    <div className="glass-panel" style={{
      position: 'absolute',
      top: '80px', // Adjusted to accommodate the new header
      left: '24px',
      width: '340px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      zIndex: 10
    }}>

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
          <span>Departure Time</span>
          <span style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{formatTime(timeOffset)}</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="6" 
          step="0.5" 
          value={timeOffset} 
          onChange={(e) => setTimeOffset(parseFloat(e.target.value))} 
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
          <span>Now</span>
          <span>+6 Hours</span>
        </div>
      </div>

      <button onClick={onCalculate} disabled={isLoading || !origin || !destination}>
        {isLoading ? 'Calculating...' : 'Find Best Side'}
      </button>

      {recommendation && (
        <div style={{
          marginTop: '8px',
          padding: '16px',
          borderRadius: '12px',
          background: recommendation === 'Right' ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.1))' : 
                      recommendation === 'Left' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))' :
                      'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
            Recommended Seat Side
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
            {recommendation}
          </div>
        </div>
      )}

    </div>
  );
}
