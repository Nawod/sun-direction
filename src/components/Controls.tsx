'use client';
import { useState } from 'react';
import { ArrowDownUp, ArrowRight, BusFront, TrainFront, LocateFixed, CalendarDays, Clock3, History, Share2, Check, ChevronRight, Cloud, CloudRain, Moon, Sun, Pencil, LoaderCircle } from 'lucide-react';
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
  timezone: string;
  recommendationResult: RecommendationResult | null;
  shadierTime?: Date | null;
  steps?: JourneyStep[];
  isDrivingFallback?: boolean;
  routeWarnings?: string[];
  weather: WeatherData | null;
  isLoading: boolean;
  transportMode: TransportMode; setTransportMode: (mode: TransportMode) => void;
  recentRoutes: RecentRoute[];
  runTour?: boolean;
  isEditing: boolean; setIsEditing: (value: boolean) => void;
  routeError?: string;
}

export default function Controls({ origin, setOrigin, destination, setDestination, onCalculate, departureDate, setDepartureDate, timezone, recommendationResult, shadierTime, steps = [], isDrivingFallback, routeWarnings = [], weather, isLoading, transportMode, setTransportMode, recentRoutes, isEditing, setIsEditing, routeError }: ControlsProps) {
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const [locating, setLocating] = useState(false);
  const wallTime = formatInTimeZone(departureDate, timezone, 'yyyy-MM-dd HH:mm:ss');
  const displayDate = new Date(wallTime.replace(' ', 'T'));
  const maxDate = new Date(); maxDate.setDate(maxDate.getDate() + 3);
  const handleDate = (date: Date | null) => {
    if (!date) return;
    const pad = (n: number) => String(n).padStart(2, '0');
    const time = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
    setDepartureDate(toDate(time, { timeZone: timezone }));
  };
  const handleGPS = () => {
    setNotice('');
    if (!navigator.geolocation) { setNotice('Location access is unavailable. Enter your starting point instead.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(position => {
      setOrigin(`${position.coords.latitude},${position.coords.longitude}`); setLocating(false);
    }, () => { setLocating(false); setNotice('Allow location permission or enter your starting point.'); }, { timeout: 10000 });
  };
  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2500); }
    catch { setNotice('Could not copy the link. Copy the address from your browser instead.'); }
  };
  const result = recommendationResult;
  const night = result?.recommendation === 'Night';
  const weatherOverride = weather?.isRainy || weather?.isCloudy;
  const seat = night || weatherOverride || result?.recommendation === 'Either' ? 'Either side' : `${result?.recommendation} side`;
  const higherExposure = Math.max(result?.leftCount || 0, result?.rightCount || 0);
  const lowerExposure = Math.min(result?.leftCount || 0, result?.rightCount || 0);
  const shadePercent = higherExposure ? Math.round(100 * (1 - lowerExposure / higherExposure)) : 0;
  const StatusIcon = night ? Moon : weather?.isRainy ? CloudRain : weather?.isCloudy ? Cloud : Sun;
  return (
    <aside className="planner" aria-label="Route planner">
      <div className="planner-heading"><span className="small-sun"><Sun size={18} /></span><span>A little planning. A cooler ride.</span></div>
      <h1>Find your{' '}<br />shady side.</h1>
      <p className="planner-intro">Pick your journey. We’ll find the side with less sun along the way.</p>
      {isEditing ? (
        <form onSubmit={event => { event.preventDefault(); if (origin.trim() && destination.trim()) onCalculate(); }} className="route-form">
          <div className="mode-switch tour-mode" aria-label="Travel mode">
            <button type="button" aria-pressed={transportMode === 'BUS'} onClick={() => setTransportMode('BUS')}><BusFront size={19} />Bus</button>
            <button type="button" aria-pressed={transportMode === 'TRAIN'} onClick={() => setTransportMode('TRAIN')}><TrainFront size={19} />Train</button>
          </div>
          <div className="route-fields tour-route">
            <div className="route-field"><span className="route-dot start" aria-hidden="true" /><label>From<PlaceInput value={origin} onChange={setOrigin} placeholder="Starting point" /></label><button type="button" className="icon-button locate-button" onClick={handleGPS} disabled={locating} aria-label="Use my current location" title="Use my current location">{locating ? <LoaderCircle size={18} className="spin" /> : <LocateFixed size={18} />}</button></div>
            <div className="route-field"><span className="route-dot end" aria-hidden="true" /><label>To<PlaceInput value={destination} onChange={setDestination} placeholder="Where are you going?" /></label></div>
            <button type="button" className="swap-button icon-button" aria-label="Swap starting point and destination" onClick={() => { setOrigin(destination); setDestination(origin); }}><ArrowDownUp size={16} /></button>
          </div>
          <div className="departure-field tour-time"><CalendarDays size={19} /><label htmlFor="departure-time">Departure<DatePicker id="departure-time" selected={displayDate} onChange={handleDate} showTimeSelect timeIntervals={15} timeFormat="h:mm aa" dateFormat="EEE, MMM d · h:mm aa" minDate={new Date()} maxDate={maxDate} className="departure-input" calendarClassName="journey-calendar" wrapperClassName="datepicker-wrapper" portalId="datepicker-portal" /></label></div>
          <p className="timezone-note"><Clock3 size={12} /> Times in {timezone.replaceAll('_', ' ').split('/').pop()}</p>
          <button type="submit" className="primary-button tour-button" disabled={isLoading || !origin.trim() || !destination.trim()}>{isLoading ? <><LoaderCircle size={18} className="spin" />Finding your shady side…</> : <>Find the best seat<ArrowRight size={19} /></>}</button>
        </form>
      ) : (
        <div className="trip-summary"><div><span className="summary-mode">{transportMode === 'BUS' ? <BusFront size={16} /> : <TrainFront size={16} />}{transportMode === 'BUS' ? 'Bus journey' : 'Train journey'}</span><strong>{origin.split(',')[0]}<ChevronRight size={14} />{destination.split(',')[0]}</strong><small>{formatInTimeZone(departureDate, timezone, 'EEE, MMM d · h:mm a')}</small></div><button className="icon-button" aria-label="Edit journey" onClick={() => setIsEditing(true)}><Pencil size={17} /></button></div>
      )}
      {(notice || routeError) && <p className="inline-error" role="alert">{routeError || notice}</p>}
      {isLoading && !isEditing && <div className="route-progress" role="status"><LoaderCircle className="spin" size={24} /><span>Following the sun along your route…</span></div>}
      {!isEditing && !isLoading && result && <div className="journey-result">
        <div className="result-heading"><span className="result-check"><Check size={16} /></span>Your seat recommendation</div>
        <div className="seat-result"><h2>{seat}</h2><StatusIcon size={32} strokeWidth={1.5} /></div>
        <p>{night ? 'The sun is below the horizon. Settle in wherever you like.' : weather?.isRainy ? 'Rain is forecast along your journey. Sun glare should be less of a concern.' : weather?.isCloudy ? 'Cloudy skies are forecast. Either side should be comfortable.' : seat === 'Either side' ? 'Sun exposure is fairly balanced on this journey.' : 'Facing forward, choose this side for less direct sunlight.'}</p>
        {!night && !weatherOverride && shadePercent > 0 && seat !== 'Either side' && <div className="shade-stat"><strong>{shadePercent}%</strong><span>less estimated sun than the other side</span></div>}
        {weatherOverride && !night && result.recommendation !== 'Either' && <small>If the sky clears, choose the {result.recommendation.toLowerCase()} side.</small>}
        <a className="explore-link" href="#journey-map"><Sun size={15} />Explore the sun along your route<ArrowRight size={15} /></a>
        {result.timeline.length > 0 && <div className="exposure-section"><div className="section-title">Sun along the journey<span>{Math.round(result.timeline.reduce((sum, segment) => sum + segment.durationMs, 0) / 60000)} min</span></div><div className="exposure-strip" aria-label="Sun exposure over time">{result.timeline.map((segment, index) => <span key={index} style={{ flex: Math.max(segment.durationMs, 1) }} className={`exposure-${segment.status}`} title={`${formatInTimeZone(segment.timeMs, timezone, 'h:mm a')}: ${segment.status === 'neutral' ? 'Sun ahead or behind' : segment.status === 'night' ? 'Night' : `Sun on the ${segment.status}`} (${Math.round(segment.durationMs / 60000)} min)`} />)}</div><div className="exposure-legend"><span><i className="exposure-left" />Sun on left</span><span><i className="exposure-right" />Sun on right</span><span><i className="exposure-night" />Night</span></div></div>}
        {shadierTime && <button className="time-suggestion" onClick={() => { setDepartureDate(shadierTime); setIsEditing(true); }}><Clock3 size={20} /><span>A shadier time to leave<strong>{formatInTimeZone(shadierTime, timezone, 'h:mm a')} · review your departure</strong></span><ChevronRight size={17} /></button>}
        {isDrivingFallback && <p className="route-warning">No bus schedule was found. This is an estimated road route, not a confirmed bus service.</p>}
        {routeWarnings.map((warning, index) => <p key={index} className="route-warning">{warning}</p>)}
        {steps.length > 0 && <details className="journey-steps"><summary>Journey directions<span>{steps.length} steps</span></summary><ol>{steps.map((step, index) => <li key={index}><span className="step-number">{index + 1}</span><div>{step.instructions}<small>{step.distance.text} · {step.duration.text}</small></div></li>)}</ol></details>}
        <button className="secondary-button" onClick={share}>{copied ? <Check size={16} /> : <Share2 size={16} />}{copied ? 'Link copied' : 'Share this journey'}</button>
      </div>}
      {isEditing && recentRoutes.length > 0 && <section className="recent-routes"><h2><History size={16} />Pick up where you left off</h2>{recentRoutes.slice(0, 3).map((route, index) => <button key={index} onClick={() => { setOrigin(route.origin); setDestination(route.destination); setTransportMode(route.mode); }}><span>{route.mode === 'BUS' ? <BusFront size={17} /> : <TrainFront size={17} />}</span><div><strong>{route.origin.split(',')[0]}</strong><small>to {route.destination.split(',')[0]}</small></div><ChevronRight size={16} /></button>)}</section>}
      <div className="planner-footnote"><span className="window-sketch"><i /><i /><i /></span><p>Same journey.<br /><strong>A more comfortable window seat.</strong></p></div>
    </aside>
  );
}
