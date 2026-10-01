'use client';
import { useState, useMemo, useEffect } from 'react';
import { GoogleMap, Polyline, OverlayView } from '@react-google-maps/api';
import { Compass, MapPin, Route, Sun, Moon, LocateFixed } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import SunCalc from 'suncalc';
import { getBearing, getSunBearing } from '@/utils/sunMath';
import type { RoutePlan } from '@/utils/routes';
import type { WeatherData } from '@/utils/weather';
import SunScene from './SunScene';

const center = { lat: 6.9271, lng: 79.8612 };
const mapStyle: google.maps.MapTypeStyle[] = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape', stylers: [{ color: '#edf1ee' }] },
  { featureType: 'water', stylers: [{ color: '#b9d7e7' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e5d9b9' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#637b84' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f8faf8' }] },
];
interface MapProps { directions: RoutePlan | null; departureDate: Date; timezone: string; weather?: WeatherData | null; transportMode: 'BUS' | 'TRAIN' }
export default function Map({ directions, departureDate, timezone, weather, transportMode }: MapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selection, setSelection] = useState({ route: directions, index: 0 });
  const points = useMemo(() => {
    if (!directions) return [];
    let elapsed = 0;
    return directions.legs.flatMap(leg => leg.steps).flatMap(step => {
      const duration = step.duration.value * 1000;
      const samples = step.path.map((point, index) => ({ point, time: new Date(departureDate.getTime() + elapsed + duration * index / Math.max(1, step.path.length-1)) }));
      elapsed += duration;
      return samples;
    });
  }, [directions, departureDate]);
  const index = selection.route === directions ? Math.min(selection.index, Math.max(0, points.length-1)) : 0;
  const current = points[index];
  const next = points.slice(index+1).find(sample => current && !sample.point.equals(current.point));
  const previous = points.slice(0,index).reverse().find(sample => current && !sample.point.equals(current.point));
  const heading = current && next ? getBearing(current.point.toJSON(), next.point.toJSON()) : current && previous ? getBearing(previous.point.toJSON(), current.point.toJSON()) : 0;
  const time = current?.time || departureDate;
  const bearing = current ? getSunBearing(time, current.point.lat(), current.point.lng()) : 115;
  const altitude = current ? SunCalc.getPosition(time, current.point.lat(), current.point.lng()).altitude : .65;
  useEffect(() => {
    if (!map || !directions) return;
    const lines = directions.route.createPolylines({ polylineOptions: { strokeWeight: 5 } });
    lines.forEach(line => line.setMap(map));
    const bounds = new google.maps.LatLngBounds(); directions.path.forEach(point => bounds.extend(point));
    map.fitBounds(bounds, { top: 60, left: 60, right: 60, bottom: 100 });
    return () => lines.forEach(line => line.setMap(null));
  }, [map, directions]);
  const selectNearest = (point: google.maps.LatLng | null) => {
    if (!point || !directions) return;
    let nearest = 0; let distance = Infinity;
    points.forEach((sample, i) => { const d = (sample.point.lat()-point.lat())**2 + (sample.point.lng()-point.lng())**2; if (d < distance) { nearest = i; distance = d; } });
    setSelection(previous => previous.route === directions && previous.index === nearest ? previous : { route: directions, index: nearest });
  };
  const fitRoute = () => {
    if (!map) return;
    if (!directions) { map.panTo(center); map.setZoom(11); return; }
    const bounds = new google.maps.LatLngBounds(); directions.path.forEach(point => bounds.extend(point)); map.fitBounds(bounds, 60);
  };
  return <section id="journey-map" className="map-stage" aria-label="Journey map and sun view" tabIndex={-1}>
    <div className="map-topbar"><div><MapPin size={17} /><span>{directions ? 'Your journey, mapped out' : 'Every good seat starts with a route'}</span></div><span className="map-live"><i />{directions ? 'Route ready' : 'Ready to explore'}</span></div>
    <div className="map-canvas"><GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={center} zoom={11} onLoad={setMap} onUnmount={() => setMap(null)} options={{ styles: mapStyle, disableDefaultUI: true, zoomControl: true, clickableIcons: false, gestureHandling: 'cooperative', zoomControlOptions: { position: google.maps.ControlPosition.INLINE_END_BLOCK_CENTER } }}>
      {directions && <><Polyline path={directions.path} options={{ strokeOpacity: .01, strokeWeight: 35, zIndex: 20 }} onMouseMove={event => selectNearest(event.latLng)} onClick={event => selectNearest(event.latLng)} />{[directions.path[0], directions.path.at(-1)].map((point, i) => point && <OverlayView key={i} position={point} mapPaneName="overlayMouseTarget"><span className="map-waypoint">{i === 0 ? 'A' : 'B'}</span></OverlayView>)}{current && <OverlayView position={current.point} mapPaneName="overlayMouseTarget"><span className={`map-sun-marker ${altitude < 0 ? 'night-marker' : ''}`}>{altitude < 0 ? <Moon size={18} /> : <Sun size={18} />}</span></OverlayView>}</>}
    </GoogleMap><button className="map-fit icon-button" aria-label="Fit map to route" onClick={fitRoute}><LocateFixed size={19} /></button>
    {!directions && <div className="map-empty"><span><Route size={19} /></span><div><strong>Your next window seat is waiting.</strong><p>Add a starting point and destination to see your route.</p></div></div>}
    <span className="map-compass"><Compass size={17} />North up</span></div>
    <div className="map-lower"><div className="journey-explorer"><div className="explorer-heading"><span className="explorer-symbol"><Sun size={23} strokeWidth={1.5} /></span><h2>See the sun{' '}<br />before you set off.</h2></div><p>{directions ? 'Move along your journey to see where the sunlight falls. Drag the vehicle view to look around.' : 'Sunlight changes as the road turns. We follow its position, so you can choose a better seat.'}</p>
      {directions ? <div className="route-scrubber"><label htmlFor="journey-position">Explore your journey<strong>{formatInTimeZone(time, timezone, 'h:mm a')}</strong></label><input id="journey-position" type="range" min="0" max={Math.max(0, points.length-1)} value={index} onChange={event => setSelection({ route: directions, index: Number(event.target.value) })} /><div><span>Start</span><span>{Math.round((directions.legs.reduce((sum, leg) => sum+leg.duration.value,0))/60)} min journey</span><span>Arrival</span></div>{weather && <p className="weather-note">{weather.isRainy ? 'Rain forecast' : weather.isCloudy ? 'Cloudy skies forecast' : 'No heavy cloud forecast'} near the route midpoint.</p>}</div> : <div className="explorer-key"><span><i className="sun-key" />Sun-facing windows</span><span><i className="shade-key" />The shadier side</span></div>}
    </div><SunScene bearing={bearing} heading={heading} altitude={altitude} isPreview={!current} mode={transportMode} timeLabel={formatInTimeZone(time, timezone, 'h:mm a')} /></div>
  </section>;
}
