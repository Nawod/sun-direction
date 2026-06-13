'use client';

import { useState, useEffect } from 'react';
import { Navigation, MapPin, Bus, Train, Map as MapIcon, ChevronDown, ChevronUp, ArrowUpDown, LocateFixed, Share2, History, CloudRain, Cloud, Sun, Moon } from 'lucide-react';
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
  shadierTime?: Date | null;
  steps?: google.maps.DirectionsStep[];
  weather: WeatherData | null;
  isLoading: boolean;
  transportMode: TransportMode;
  setTransportMode: (mode: TransportMode) => void;
  recentRoutes: RecentRoute[];
  runTour?: boolean;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
}

const VehicleGraphic = ({ mode, recommendation }: { mode: TransportMode, recommendation: string }) => {
  const isLeft = recommendation === 'Left';
  const isRight = recommendation === 'Right';
  
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', marginBottom: '24px' }}>
      <div style={{ position: 'relative', width: '60px', height: '130px' }}>
        {isLeft && (
          <div style={{ position: 'absolute', right: '-40px', top: '50%', transform: 'translateY(-50%)' }}>
             <Sun size={24} color="#f97316" className="sun-pulse" />
          </div>
        )}
        {isRight && (
          <div style={{ position: 'absolute', left: '-40px', top: '50%', transform: 'translateY(-50%)' }}>
             <Sun size={24} color="#f97316" className="sun-pulse" />
          </div>
        )}

        <div style={{ 
          width: '100%', height: '100%', 
          backgroundColor: '#1e293b', 
          border: '2px solid rgba(255,255,255,0.2)',
          borderRadius: mode === 'BUS' ? '6px' : '16px 16px 4px 4px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: isLeft ? 'inset 14px 0 20px rgba(59, 130, 246, 0.4)' : isRight ? 'inset -14px 0 20px rgba(59, 130, 246, 0.4)' : 'none'
        }}>
           <div style={{ position: 'absolute', top: '6px', left: '10%', right: '10%', height: mode === 'BUS' ? '18px' : '26px', backgroundColor: '#334155', borderRadius: '4px' }} />
           <div style={{ position: 'absolute', top: '35px', left: '20%', right: '20%', bottom: '20px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2px' }} />
           
           {/* Highlight Side indicators */}
           {isLeft && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', backgroundColor: '#3b82f6', opacity: 0.8 }} />}
           {isRight && <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '6px', backgroundColor: '#3b82f6', opacity: 0.8 }} />}
        </div>
      </div>
    </div>
  );
};

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
  shadierTime,
  steps,
  weather,
  isLoading,
  transportMode,
  setTransportMode,
  recentRoutes,
  runTour,
  isEditing,
  setIsEditing
}: ControlsProps) {
  
  const [autocompleteOrigin, setAutocompleteOrigin] = useState<google.maps.places.Autocomplete | null>(null);
  const [autocompleteDestination, setAutocompleteDestination] = useState<google.maps.places.Autocomplete | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (runTour) {
      setIsMinimized(false);
    }
  }, [runTour]);

  useEffect(() => {
    if (recommendationResult && !isLoading) {
      setIsEditing(false);
    }
  }, [recommendationResult, isLoading]);

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

  const handleEdit = () => {
    setIsEditing(true);
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
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="tour-mode" style={{ display: 'flex', gap: '8px' }}>
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

              <div className="tour-route" style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
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

              <div className="tour-time">
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

              <button className="tour-button" onClick={() => { setIsEditing(false); onCalculate(); }} disabled={isLoading || !origin || !destination}>
                Find Best Side
              </button>

              {recentRoutes.length > 0 && !isLoading && (
                <div style={{ marginTop: '4px' }}>
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
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
               <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.95rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    {transportMode === 'BUS' ? <Bus size={14} color="#3b82f6" /> : <Train size={14} color="#3b82f6" />}
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{origin.split(',')[0] || 'Origin'}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>→</span>
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{destination.split(',')[0] || 'Destination'}</span>
                 </div>
                 <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                    {(() => {
                      try { return formatInTimeZone(departureDate, timezone, "MMM d, h:mm a"); }
                      catch(e) { return ''; }
                    })()}
                 </div>
               </div>
               <button onClick={handleEdit} style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', width: 'auto', boxShadow: 'none' }}>
                 Edit
               </button>
            </div>
          )}

          {isLoading && (
            <div className="skeleton-loader" style={{ height: '200px', borderRadius: '12px', marginTop: '12px' }} />
          )}

          {!isLoading && !isEditing && recommendationResult && (
            <div style={{
              marginTop: '12px',
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

              {weatherOverride && recommendationResult.recommendation !== 'Night' && recommendationResult.recommendation !== 'Either' && (
                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginBottom: '36px', marginTop: '-6px' }}>
                  Best Side (If Sunny): <strong style={{ color: '#eab308' }}>{recommendationResult.recommendation}</strong>
                </div>
              )}

              {finalRec !== 'Night' && recommendationResult.recommendation !== 'Night' && recommendationResult.recommendation !== 'Either' && (
                <VehicleGraphic mode={transportMode} recommendation={recommendationResult.recommendation} />
              )}

              {finalRec !== 'Night' && recommendationResult.recommendation !== 'Night' && (
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Trip Timeline</span>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }} />Night</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />Left Sun</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316' }} />Right Sun</span>
                  </div>
                </div>
                <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', marginTop: '6px' }}>
                  {recommendationResult.timeline.map((seg, i) => {
                    let bg = '#333';
                    let label = 'Neutral';
                    if (seg.status === 'night') { bg = '#8b5cf6'; label = 'Night'; }
                    if (seg.status === 'left') { bg = '#3b82f6'; label = 'Left Sun'; }
                    if (seg.status === 'right') { bg = '#f97316'; label = 'Right Sun'; }

                    const timeStr = formatInTimeZone(new Date(seg.timeMs), timezone, "h:mm a");
                    const mins = Math.round(seg.durationMs / 60000);

                    return (
                      <div
                        key={i}
                        style={{ flex: seg.durationMs, backgroundColor: bg, transition: 'opacity 0.2s', cursor: 'help' }}
                        title={`${timeStr} • ${mins} mins (${label})`}
                        onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                      />
                    );
                  })}
                </div>
              </div>
              
              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                Calculated using accurate seasonal sun paths for {(() => {
                  try { return formatInTimeZone(departureDate, timezone, 'MMMM yyyy'); }
                  catch(e) { return ''; }
                })()}
              </div>
            </div>
          )}

          {!isEditing && shadierTime && !isLoading && (
            <button 
              onClick={() => {
                setDepartureDate(shadierTime);
                setTimeout(() => onCalculate(), 0);
              }}
              style={{ width: '100%', padding: '12px', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.4)', borderRadius: '8px', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#eab308', boxShadow: 'none', transition: 'all 0.2s' }}>
              <Sun size={18} />
              <span>💡 Tip: Leave at <strong>{formatInTimeZone(shadierTime, timezone, "h:mm a")}</strong> for less sun glare! [Apply]</span>
            </button>
          )}

          {!isEditing && steps && steps.length > 0 && !isLoading && (
            <details style={{ marginTop: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <summary style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>View Journey Steps</summary>
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {steps.map((step, idx) => (
                  <div key={idx} style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', borderLeft: '2px solid rgba(255,255,255,0.2)', paddingLeft: '12px' }}>
                    <div dangerouslySetInnerHTML={{ __html: step.instructions }} className="step-instructions" />
                    <div style={{ marginTop: '4px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{step.distance?.text} • {step.duration?.text}</div>
                  </div>
                ))}
              </div>
            </details>
          )}

        </>
      )}
    </div>
  );
}
