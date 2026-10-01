'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { Sun, X, MapPin, Clock3, Armchair, LoaderCircle } from 'lucide-react';
import Map from '@/components/Map';
import Controls, { type TransportMode } from '@/components/Controls';
import Header from '@/components/Header';
import { calculateOverallBestSide, findShadierTime, type RecommendationResult } from '@/utils/sunMath';
import { fetchWeather, type WeatherData } from '@/utils/weather';
import { computeRoutePlan, type RoutePlan } from '@/utils/routes';

const libraries: ('places')[] = ['places'];
export interface RecentRoute { origin: string; destination: string; mode: TransportMode }

export default function Home() {
  const [origin,setOrigin]=useState('');
  const [destination,setDestination]=useState('');
  const [departureDate,setDepartureDate]=useState(new Date());
  const [timezone,setTimezone]=useState('UTC');
  const [directions,setDirections]=useState<RoutePlan|null>(null);
  const [recommendationResult,setRecommendationResult]=useState<RecommendationResult|null>(null);
  const [shadierTime,setShadierTime]=useState<Date|null>(null);
  const [weather,setWeather]=useState<WeatherData|null>(null);
  const [transportMode,setTransportMode]=useState<TransportMode>('BUS');
  const [recentRoutes,setRecentRoutes]=useState<RecentRoute[]>([]);
  const [isLoading,setIsLoading]=useState(false);
  const [isMounted,setIsMounted]=useState(false);
  const [isEditing,setIsEditing]=useState(true);
  const [autoCalculatePending,setAutoCalculatePending]=useState(false);
  const [mapsAuthFailed,setMapsAuthFailed]=useState(false);
  const [routeError,setRouteError]=useState('');
  const [helpOpen,setHelpOpen]=useState(false);
  const [routeContext,setRouteContext]=useState<{date:Date;mode:TransportMode}|null>(null);
  const dialog=useRef<HTMLDialogElement>(null);
  const request=useRef(0);
  const apiKey=process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY||'';
  const {isLoaded,loadError}=useJsApiLoader({id:'google-map-script',googleMapsApiKey:apiKey,libraries});

  useEffect(()=>{
    const mapsWindow=window as Window & {gm_authFailure?:()=>void};
    const previous=mapsWindow.gm_authFailure;
    const handler=()=>{setMapsAuthFailed(true);previous?.();};
    mapsWindow.gm_authFailure=handler;
    return()=>{if(mapsWindow.gm_authFailure===handler)mapsWindow.gm_authFailure=previous;};
  },[]);
  useEffect(()=>{
    const frame=requestAnimationFrame(()=>{
      setIsMounted(true);
      const params=new URLSearchParams(window.location.search);
      let zone=Intl.DateTimeFormat().resolvedOptions().timeZone;
      try { if(params.get('tz')){new Intl.DateTimeFormat('en',{timeZone:params.get('tz')!});zone=params.get('tz')!;} } catch {}
      setTimezone(zone);
      if(params.get('origin'))setOrigin(params.get('origin')!);
      if(params.get('dest'))setDestination(params.get('dest')!);
      if(params.get('mode')==='TRAIN')setTransportMode('TRAIN');
      const parsed=params.get('time')?new Date(Number(params.get('time'))):new Date();
      setDepartureDate(Number.isNaN(parsed.getTime())?new Date():parsed);
      if(params.get('origin')&&params.get('dest'))setAutoCalculatePending(true);
      try {
        const stored:unknown=JSON.parse(localStorage.getItem('sun-direction-recents')||'[]');
        if(Array.isArray(stored))setRecentRoutes(stored.filter((route):route is RecentRoute=>typeof route?.origin==='string'&&typeof route?.destination==='string'&&(route.mode==='BUS'||route.mode==='TRAIN')).slice(0,5));
      } catch {}
    });
    return()=>cancelAnimationFrame(frame);
  },[]);
  useEffect(()=>{
    if(helpOpen)dialog.current?.showModal();else dialog.current?.close();
  },[helpOpen]);

  const handleCalculate=useCallback(async()=>{
    if(!origin.trim()||!destination.trim()||!window.google)return;
    const id=++request.current;
    setIsLoading(true);setIsEditing(false);setRouteError('');setDirections(null);setRecommendationResult(null);setShadierTime(null);setWeather(null);
    const params=new URLSearchParams({origin,dest:destination,mode:transportMode,time:String(departureDate.getTime()),tz:timezone});
    window.history.replaceState(null,'',`?${params}`);
    try {
      const result=await computeRoutePlan(origin,destination,departureDate,transportMode);
      if(id!==request.current)return;
      const recommendation=calculateOverallBestSide(result.legs,departureDate);
      setDirections(result);setRouteContext({date:departureDate,mode:transportMode});setRecommendationResult(recommendation);
      setShadierTime(findShadierTime(result.legs,departureDate,recommendation.leftCount,recommendation.rightCount));
      setRecentRoutes(previous=>{
        const updated=[{origin,destination,mode:transportMode},...previous.filter(route=>route.origin!==origin||route.destination!==destination)].slice(0,5);
        try{localStorage.setItem('sun-direction-recents',JSON.stringify(updated));}catch{}
        return updated;
      });
      const mid=result.path[Math.floor(result.path.length/2)];
      const duration=result.legs.reduce((total,leg)=>total+leg.duration.value,0);
      const forecast=await fetchWeather(mid.lat(),mid.lng(),new Date(departureDate.getTime()+duration*500));
      if(id===request.current)setWeather(forecast);
    } catch(error) {
      if(id!==request.current)return;
      setIsEditing(true);
      const message=error instanceof Error?error.message:'Please try again.';
      const hint=/denied|authoriz|not enabled|blocked|API key/i.test(message)?' Check that Routes API is enabled and allowed by your API key.':'';
      setRouteError(`Could not load this journey. ${message}${hint}`);
    } finally {if(id===request.current)setIsLoading(false);}
  },[origin,destination,departureDate,transportMode,timezone]);
  useEffect(()=>{
    if(!isLoaded||!autoCalculatePending||!origin||!destination)return;
    const timer=setTimeout(()=>{setAutoCalculatePending(false);void handleCalculate();},0);
    return()=>clearTimeout(timer);
  },[isLoaded,autoCalculatePending,origin,destination,handleCalculate]);

  if(!isMounted||!isLoaded&&!loadError&&!mapsAuthFailed&&apiKey)return <main className="state-screen" role="status"><span className="brand-mark"><Sun size={28}/></span><h1>Finding a little shade.</h1><p>Loading your map and place search…</p><LoaderCircle className="spin" size={20}/></main>;
  if(!apiKey||loadError||mapsAuthFailed)return <main className="state-screen" role="alert"><Sun size={32}/><h1>{!apiKey?'Add your map key':'Your map could not load'}</h1><p>{!apiKey?'Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment file and restart the app.':'Check the API key, active billing, website restrictions, and Maps JavaScript API in your Google Cloud project.'}</p><a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer">Open Google Cloud Console</a></main>;

  return <div className="app-shell">
    <Header timezone={timezone} setTimezone={setTimezone} onStartTour={()=>setHelpOpen(true)}/>
    <main className="workspace">
      <Controls origin={origin} setOrigin={setOrigin} destination={destination} setDestination={setDestination} departureDate={departureDate} setDepartureDate={setDepartureDate} timezone={timezone} onCalculate={handleCalculate} recommendationResult={recommendationResult} shadierTime={shadierTime} steps={directions?.legs.flatMap(leg=>leg.steps)||[]} isDrivingFallback={directions?.isDrivingFallback} routeWarnings={directions?.route.warnings} weather={weather} isLoading={isLoading} transportMode={transportMode} setTransportMode={setTransportMode} recentRoutes={recentRoutes} isEditing={isEditing} setIsEditing={setIsEditing} routeError={routeError}/>
      <Map directions={directions} departureDate={directions&&routeContext?routeContext.date:departureDate} transportMode={directions&&routeContext?routeContext.mode:transportMode} timezone={timezone} weather={weather} recommendationResult={recommendationResult}/>
    </main>
    <div id="datepicker-portal"/>
    <dialog ref={dialog} className="help-dialog" aria-labelledby="help-title" onCancel={()=>setHelpOpen(false)} onClick={event=>{if(event.target===event.currentTarget)setHelpOpen(false);}}><div className="help-content"><button className="icon-button close-help" aria-label="Close help" onClick={()=>setHelpOpen(false)}><X size={20}/></button><span className="brand-mark"><Sun size={23}/></span><h2 id="help-title">A cooler ride starts here.</h2><p>Choose a seat with less direct sunlight, based on where and when you travel.</p><ol><li><MapPin size={20}/><div><strong>Choose your journey</strong><p>Enter your starting point and destination, then choose bus or train.</p></div></li><li><Clock3 size={20}/><div><strong>Set your departure</strong><p>The sun moves throughout the day. Use the timezone shown in the header.</p></div></li><li><Armchair size={20}/><div><strong>Find your side</strong><p>Left and right mean facing the front of the vehicle. Move the map slider to explore the sun at each point.</p></div></li></ol><p className="help-note">The sun compass illustrates bearing and elevation; its size and distance are not to scale. Buildings, trees, window tint, and changing weather can affect the shade you experience.</p><button className="primary-button" onClick={()=>setHelpOpen(false)}>Let’s plan a journey</button></div></dialog>
  </div>;
}
