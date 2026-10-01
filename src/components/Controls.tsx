'use client';

import { useState } from 'react';
import { ArrowDownUp, ArrowUpRight, BusFront, TrainFront, LocateFixed, CalendarDays, Clock3, History, Share2, Check, ChevronRight, Cloud, CloudRain, Moon, Sun, Pencil, LoaderCircle, Armchair } from 'lucide-react';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import PlaceInput from './PlaceInput';
import type { JourneyStep } from '@/utils/routes';
import type { RecommendationResult } from '@/utils/sunMath';
import type { WeatherData } from '@/utils/weather';
import type { RecentRoute } from '@/app/page';

export type TransportMode = 'BUS' | 'TRAIN';
interface ControlsProps {
  origin: string; setOrigin: (value: string) => void;
  destination: string; setDestination: (value: string) => void;
  onCalculate: () => void;
  departureDate: Date; setDepartureDate: (value: Date) => void;
  timezone: string; recommendationResult: RecommendationResult | null;
  shadierTime?: Date | null; steps?: JourneyStep[];
  isDrivingFallback?: boolean; routeWarnings?: string[];
  weather: WeatherData | null; isLoading: boolean;
  transportMode: TransportMode; setTransportMode: (mode: TransportMode) => void;
  recentRoutes: RecentRoute[];
  isEditing: boolean; setIsEditing: (value: boolean) => void;
  routeError: string;
}

export default function Controls({ origin, setOrigin, destination, setDestination, onCalculate, departureDate, setDepartureDate, timezone, recommendationResult: result, shadierTime, steps = [], isDrivingFallback, routeWarnings = [], weather, isLoading, transportMode, setTransportMode, recentRoutes, isEditing, setIsEditing, routeError }: ControlsProps) {
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const [locating, setLocating] = useState(false);
  const displayDate = new Date(formatInTimeZone(departureDate, timezone, "yyyy-MM-dd'T'HH:mm:ss"));
  const today = new Date(formatInTimeZone(new Date(), timezone, "yyyy-MM-dd'T'HH:mm:ss"));
  const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 3);
  const handleDate = (date: Date | null) => {
    if (!date) return;
    const pad = (n: number) => String(n).padStart(2, '0');
    const parsed = toDate(`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`, { timeZone: timezone });
    if (!Number.isNaN(parsed.getTime())) setDepartureDate(parsed);
  };
  const locate = () => {
    setNotice('');
    if (!navigator.geolocation) { setNotice('Location is unavailable. Enter your starting point instead.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(position => { setOrigin(`${position.coords.latitude},${position.coords.longitude}`); setLocating(false); }, () => { setLocating(false); setNotice('Allow location access in your browser, or enter your starting point.'); }, { timeout: 10000 });
  };
  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2500); }
    catch { setNotice('Copy the page address from your browser to share this journey.'); }
  };
  const night = result?.recommendation === 'Night';
  const cloudy = weather?.isRainy || weather?.isCloudy;
  const either = night || cloudy || result?.recommendation === 'Either';
  const side = either ? 'Either side' : `${result?.recommendation} side`;
  const Icon = night ? Moon : weather?.isRainy ? CloudRain : weather?.isCloudy ? Cloud : Sun;
  const high = Math.max(result?.leftCount || 0, result?.rightCount || 0);
  const low = Math.min(result?.leftCount || 0, result?.rightCount || 0);
  const reduction = high ? Math.round((1 - low / high) * 100) : 0;

  return <aside id="planner" className="planner" aria-label="Route planner">
    <div className="planner-body">
      <div className="planner-title"><span className="section-dot" />Plan your trip</div>
      <h1>A better seat,{' '}<br />all the way.</h1>
      <p className="planner-intro">Find the shadier side of your bus or train before you go.</p>
      {isEditing ? <form className="route-form" onSubmit={event => { event.preventDefault(); if (origin.trim() && destination.trim()) onCalculate(); }}>
        <div className="mode-switch" aria-label="Travel mode"><button type="button" aria-pressed={transportMode === 'BUS'} onClick={() => setTransportMode('BUS')}><BusFront size={18} />Bus</button><button type="button" aria-pressed={transportMode === 'TRAIN'} onClick={() => setTransportMode('TRAIN')}><TrainFront size={18} />Train</button></div>
        <div className="route-fields">
          <div className="route-field"><i className="route-dot" /><label>From<PlaceInput value={origin} onChange={setOrigin} placeholder="Your starting point" /></label><button className="icon-button locate-button" type="button" onClick={locate} disabled={locating} aria-label="Use my current location">{locating ? <LoaderCircle className="spin" size={17} /> : <LocateFixed size={17} />}</button></div>
          <button type="button" className="swap-button" aria-label="Swap starting point and destination" onClick={() => { setOrigin(destination); setDestination(origin); }}><ArrowDownUp size={15} /></button>
          <div className="route-field"><i className="route-dot destination-dot" /><label>To<PlaceInput value={destination} onChange={setDestination} placeholder="Where are you headed?" /></label></div>
        </div>
        <div className="departure-field"><CalendarDays size={18} /><label htmlFor="departure-time">Leaving at<DatePicker id="departure-time" selected={displayDate} onChange={handleDate} showTimeSelect timeIntervals={15} timeFormat="h:mm aa" dateFormat="EEE, MMM d · h:mm aa" minDate={today} maxDate={maxDate} wrapperClassName="datepicker-wrapper" calendarClassName="journey-calendar" className="departure-input" portalId="datepicker-portal" /></label></div>
        <p className="timezone-note"><Clock3 size={12} />Times in {timezone.split('/').pop()?.replaceAll('_', ' ')}</p>
        <button className="primary-button" disabled={isLoading || !origin.trim() || !destination.trim()}>{isLoading ? <><LoaderCircle className="spin" size={17} />Finding your seat…</> : <>Find my shady side<ArrowUpRight size={19} /></>}</button>
      </form> : <div className="trip-summary"><div><span>{transportMode === 'BUS' ? <BusFront size={15} /> : <TrainFront size={15} />}{transportMode === 'BUS' ? 'Bus journey' : 'Train journey'}</span><strong>{origin.split(',')[0]}<ChevronRight size={13} />{destination.split(',')[0]}</strong><small>{formatInTimeZone(departureDate, timezone, 'EEE, MMM d · h:mm a')}</small></div><button className="icon-button" aria-label="Edit journey" onClick={() => setIsEditing(true)}><Pencil size={16} /></button></div>}
      {(notice || routeError) && <p className="inline-error" role="alert">{routeError || notice}</p>}
      {isLoading && <div className="route-progress" role="status"><LoaderCircle className="spin" size={24} /><span>Following the sun along your route…</span></div>}
      {!isEditing && !isLoading && result && <section className="journey-result" aria-label="Seat recommendation">
        <div className="recommendation-label"><Check size={14} />Your best seat</div>
        <div className="seat-result"><h2>{side}</h2><Icon size={29} strokeWidth={1.5} /></div>
        <p>{night ? 'The sun is below the horizon. Sit wherever you like.' : cloudy ? 'Cloud cover or rain is forecast. Either side should be comfortable.' : either ? 'Sun exposure is similar on both sides.' : 'Facing forward, choose this side for less direct sunlight.'}</p>
        <div className="seat-diagram" aria-label={`Recommended seat: ${side}, facing forward`}><span>↑ Front of {transportMode === 'BUS' ? 'bus' : 'train'}</span><div className="vehicle-seats">{['Left','Right'].map(seatSide => <div key={seatSide} className={either || result.recommendation === seatSide ? 'recommended-seats' : ''}>{[0,1,2].map(i => <Armchair size={20} key={i} />)}<small>{seatSide}</small></div>)}</div></div>
        {!either && reduction > 0 && <p className="exposure-saving"><strong>{reduction}%</strong> less estimated sun than the other side</p>}
        {cloudy && !night && result.recommendation !== 'Either' && <small>If the sky clears, choose the {result.recommendation.toLowerCase()} side.</small>}
        <a className="map-link" href="#journey-map">Explore sunlight on the map<ArrowUpRight size={15} /></a>
        {shadierTime && <button className="time-suggestion" onClick={() => { setDepartureDate(shadierTime); setIsEditing(true); }}><Clock3 size={18} /><span>Another time with less sun<strong>Try {formatInTimeZone(shadierTime, timezone, 'h:mm a')}</strong></span><ChevronRight size={15} /></button>}
        {isDrivingFallback && <p className="route-warning">No bus schedule was found. Showing an estimated road route, not a confirmed bus service.</p>}
        {routeWarnings.map((warning, i) => <p key={i} className="route-warning">{warning}</p>)}
        <details className="journey-steps"><summary>Journey directions<span>{steps.length} {steps.length === 1 ? 'step' : 'steps'}</span></summary><ol>{steps.map((step,i) => <li key={i}><span>{i+1}</span><div>{step.instructions}<small>{step.distance.text} · {step.duration.text}</small></div></li>)}</ol></details>
        <button className="secondary-button" onClick={share}>{copied ? <Check size={16} /> : <Share2 size={16} />}{copied ? 'Link copied' : 'Share this journey'}</button>
      </section>}
      {isEditing && recentRoutes.length > 0 && <section className="recent-routes"><h2><History size={15} />Recent journeys</h2>{recentRoutes.slice(0,3).map((route,i) => <button key={i} onClick={() => { setOrigin(route.origin); setDestination(route.destination); setTransportMode(route.mode); }}><span>{route.mode === 'BUS' ? <BusFront size={17} /> : <TrainFront size={17} />}</span><div><strong>{route.origin.split(',')[0]}</strong><small>to {route.destination.split(',')[0]}</small></div><ChevronRight size={14} /></button>)}</section>}
      {isEditing && <div className="planning-note"><span className="window-illustration"><i /><i /><i /></span><div><strong>Window seat, better chosen.</strong><p>We check the sun’s position as your route changes direction.</p></div></div>}
    </div>
    <footer className="planner-footer"><span>Made for the journey.</span><a href="https://www.nawodmadhuwantha.com/" target="_blank" rel="noreferrer">by devNawod</a></footer>
  </aside>;
}
