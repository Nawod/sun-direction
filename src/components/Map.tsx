'use client';

import { useEffect, useMemo, useState } from 'react';
import { GoogleMap, OverlayView, Polyline } from '@react-google-maps/api';
import { Sun, Moon, LocateFixed, Layers2, Compass, MapPin, Route, CloudSun, ChevronLeft, ChevronRight } from 'lucide-react';
import SunCalc from 'suncalc';
import { formatInTimeZone } from 'date-fns-tz';
import { getBearing, getSunBearing, getSunSide, type RecommendationResult } from '@/utils/sunMath';
import type { RoutePlan } from '@/utils/routes';
import type { WeatherData } from '@/utils/weather';
import SunCompass from './SunCompass';

const center = { lat:6.9271, lng:79.8612 };
const styles: google.maps.MapTypeStyle[] = [
  { featureType:'poi', stylers:[{visibility:'off'}] },
  { featureType:'landscape', stylers:[{color:'#edf0e8'}] },
  { featureType:'water', stylers:[{color:'#bdd5cc'}] },
  { featureType:'road', elementType:'geometry', stylers:[{color:'#ffffff'}] },
  { featureType:'road.highway', elementType:'geometry', stylers:[{color:'#e6dab0'}] },
  { elementType:'labels.text.fill', stylers:[{color:'#667c72'}] },
  { elementType:'labels.text.stroke', stylers:[{color:'#f6f8f2'}] },
];
interface MapProps { directions: RoutePlan | null; departureDate: Date; timezone: string; weather: WeatherData | null; transportMode: 'BUS' | 'TRAIN'; recommendationResult: RecommendationResult | null }

export default function Map({ directions, departureDate, timezone, weather, transportMode, recommendationResult }: MapProps) {
  const [map,setMap] = useState<google.maps.Map | null>(null);
  const [selection,setSelection] = useState({ route:directions, index:0 });
  const [showSun,setShowSun] = useState(true);
  const [satellite,setSatellite] = useState(false);
  const samples = useMemo(() => {
    const steps=directions?.legs.flatMap(leg=>leg.steps)||[];
    return steps.flatMap((step,stepIndex)=>{
      const elapsed=steps.slice(0,stepIndex).reduce((total,item)=>total+item.duration.value*1000,0);
      const duration=step.duration.value*1000;
      const points=step.path.map((point,i)=>({ point, time:new Date(departureDate.getTime()+elapsed+duration*i/Math.max(1,step.path.length-1)) }));
      return points;
    });
  },[directions,departureDate]);
  const index=selection.route===directions ? Math.min(selection.index,Math.max(0,samples.length-1)) : 0;
  const current=samples[index];
  const next=samples.slice(index+1).find(sample=>current && !sample.point.equals(current.point));
  const previous=samples.slice(0,index).reverse().find(sample=>current && !sample.point.equals(current.point));
  const heading=current && next ? getBearing(current.point.toJSON(),next.point.toJSON()) : current && previous ? getBearing(previous.point.toJSON(),current.point.toJSON()) : 25;
  const time=current?.time || departureDate;
  const azimuth=current ? getSunBearing(time,current.point.lat(),current.point.lng()) : 120;
  const altitude=current ? SunCalc.getPosition(time,current.point.lat(),current.point.lng()).altitude : .65;
  const night=altitude<0;
  const sunSide=getSunSide(heading,azimuth);
  const duration=directions?.legs.reduce((total,leg)=>total+leg.duration.value,0)||0;
  const distance=directions?.legs.flatMap(leg=>leg.steps).reduce((total,step)=>total+step.distance.value,0)||0;
  const fit=()=>{
    if(!map)return;
    if(!directions){map.panTo(center);map.setZoom(11);return;}
    const bounds=new google.maps.LatLngBounds();directions.path.forEach(point=>bounds.extend(point));
    map.fitBounds(bounds,{top:175,right:65,bottom:300,left:65});
  };
  useEffect(()=>{
    if(!map||!directions)return;
    const polylines=directions.route.createPolylines({polylineOptions:{strokeColor:'#286550',strokeWeight:5}});
    polylines.forEach(line=>line.setMap(map));
    const bounds=new google.maps.LatLngBounds();directions.path.forEach(point=>bounds.extend(point));
    map.fitBounds(bounds,{top:175,right:65,bottom:300,left:65});
    return()=>polylines.forEach(line=>line.setMap(null));
  },[map,directions]);
  const select=(i:number,pan=false)=>{
    const selected=Math.max(0,Math.min(i,samples.length-1));
    setSelection(old=>old.route===directions&&old.index===selected?old:{route:directions,index:selected});
    if(pan&&samples[selected])map?.panTo(samples[selected].point);
  };
  const nearest=(point:google.maps.LatLng|null)=>{
    if(!point)return;let best=0;let distance=Infinity;
    samples.forEach((sample,i)=>{const d=(sample.point.lat()-point.lat())**2+(sample.point.lng()-point.lng())**2;if(d<distance){distance=d;best=i;}});select(best);
  };
  return <section id="journey-map" className="map-stage" aria-label="Journey map and sun explorer" tabIndex={-1}>
    <GoogleMap mapContainerClassName="map-canvas" center={center} zoom={11} onLoad={setMap} onUnmount={()=>setMap(null)} options={{styles,disableDefaultUI:true,zoomControl:true,zoomControlOptions:{position:google.maps.ControlPosition.INLINE_END_BLOCK_CENTER},gestureHandling:'cooperative',clickableIcons:false,mapTypeId:satellite?'satellite':'roadmap'}}>
      {directions && <><Polyline path={directions.path} options={{strokeOpacity:.01,strokeWeight:35,zIndex:20}} onMouseMove={event=>nearest(event.latLng)} onClick={event=>nearest(event.latLng)} />{[directions.path[0],directions.path.at(-1)].map((point,i)=>point&&<OverlayView key={i} position={point} mapPaneName="overlayMouseTarget"><span className="map-waypoint">{i?'B':'A'}</span></OverlayView>)}</>}
      {showSun && <OverlayView position={current?.point||center} mapPaneName="overlayLayer"><SunCompass azimuth={azimuth} altitude={altitude} heading={heading} preview={!current} mode={transportMode} /></OverlayView>}
      {current && <OverlayView position={current.point} mapPaneName="overlayLayer"><span className="route-position-dot" /></OverlayView>}
    </GoogleMap>
    <div className="map-heading"><div className="map-heading-icon"><Route size={19} /></div><div><strong>{directions?'A little foresight. A cooler ride.':'Where will the sun find you?'}</strong><span>{directions?`${(distance/1000).toFixed(1)} km · ${Math.round(duration/60)} min journey`:'Plan a journey to see sunlight along the way.'}</span></div></div>
    <div className="map-tools"><button aria-pressed={showSun} className="sun-toggle" onClick={()=>setShowSun(value=>!value)}><Sun size={17} /><span>Sun view</span></button><button className="icon-button" title="Fit map to journey" aria-label="Fit map to journey" onClick={fit}><LocateFixed size={18} /></button><button className="icon-button" title="Toggle satellite map" aria-label="Toggle satellite map" aria-pressed={satellite} onClick={()=>setSatellite(value=>!value)}><Layers2 size={18} /></button></div>
    <div className="map-location"><Compass size={14} />North up{!directions&&<span>Colombo preview</span>}</div>
    {!directions && <div className="preview-label"><span className="preview-dot" />Sun compass preview<span>Illustrative position</span></div>}
    <section className={`sun-explorer ${directions?'has-route':''}`} aria-label="Sunlight along the journey">
      <div className="explorer-header"><div><span className="sun-badge">{night?<Moon size={20}/>:<Sun size={20}/>}</span><div><h2>{directions?'Follow the light':'Meet your sun compass'}</h2><p>{directions?night?'The sun is below the horizon.':`Sun ${sunSide==='front'?'ahead':sunSide==='back'?'behind':`on the ${sunSide}`} at this point`:'See which windows catch the sunlight.'}</p></div></div><span className="view-tag">3D sun view</span></div>
      {directions ? <><div className="sun-measurements"><div><span>Journey time</span><strong>{formatInTimeZone(time,timezone,'h:mm a')}</strong></div><div><span>Sun elevation</span><strong>{Math.round(altitude*180/Math.PI)}<small>°</small></strong></div><div><span>Compass bearing</span><strong>{Math.round(azimuth)}<small>°</small></strong></div></div><div className="journey-slider"><button className="icon-button" aria-label="Previous point on route" disabled={index===0} onClick={()=>select(index-1,true)}><ChevronLeft size={16}/></button><input id="journey-position" aria-label="Position along journey" type="range" min="0" max={Math.max(0,samples.length-1)} value={index} onChange={event=>select(Number(event.target.value),true)}/><button className="icon-button" aria-label="Next point on route" disabled={index===samples.length-1} onClick={()=>select(index+1,true)}><ChevronRight size={16}/></button></div><div className="timeline-labels"><span>Departure</span><span>Move along your route</span><span>Arrival</span></div>{recommendationResult&&<div className="exposure-strip" aria-label="Sun exposure over the journey">{recommendationResult.timeline.map((segment,i)=><span key={i} className={`exposure-${segment.status}`} style={{flex:Math.max(segment.durationMs,1)}} title={`${formatInTimeZone(segment.timeMs,timezone,'h:mm a')}: ${segment.status}`}/>)}</div>}<div className="explorer-footnote"><span><i className="legend-dot"/>Sun on left<i className="legend-dot right"/>Sun on right</span><span>{weather?.isRainy?'Rain forecast':weather?.isCloudy?'Cloudy forecast':'Estimated sunlight'}</span></div></> : <div className="explorer-empty"><div><MapPin size={16}/><span>Choose your route</span></div><div><Clock3Icon/><span>Set your departure</span></div><div><CloudSun size={17}/><span>Find your shady side</span></div></div>}
    </section>
  </section>;
}
function Clock3Icon(){return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;}
