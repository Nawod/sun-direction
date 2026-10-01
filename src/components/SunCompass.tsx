'use client';

import { useId } from 'react';

interface SunCompassProps { azimuth: number; altitude: number; heading: number; preview: boolean; mode: 'BUS' | 'TRAIN' }
type Point = [number, number, number];

export default function SunCompass({ azimuth, altitude, heading, preview, mode }: SunCompassProps) {
  const id = useId().replaceAll(':', '');
  const radians = azimuth * Math.PI / 180;
  const night = altitude < 0;
  const radius = 106 * Math.cos(Math.max(0, altitude));
  const ground = { x: 170 + Math.sin(radians) * radius, y: 176 - Math.cos(radians) * radius * .58 };
  const orb = { x: ground.x, y: ground.y - Math.sin(Math.max(0, altitude)) * 112 };
  const rotation = heading * Math.PI / 180;
  const project = ([x,y,z]: Point) => ({ x:170+x*Math.cos(rotation)-y*Math.sin(rotation), y:176+(x*Math.sin(rotation)+y*Math.cos(rotation))*.58-z });
  const points = (vertices: Point[]) => vertices.map(v => { const p=project(v); return `${p.x},${p.y}`; }).join(' ');
  const length = mode === 'TRAIN' ? 32 : 25;
  const top: Point[] = [[-12,-length,23],[12,-length,23],[12,length,23],[-12,length,23]];
  const faces = top.map((p,i) => ({ top: [p,top[(i+1)%4]], depth:(project(p).y+project(top[(i+1)%4]).y)/2 })).sort((a,b)=>a.depth-b.depth);
  return <div className={`sun-compass ${night ? 'compass-night' : ''}`}>
    <svg viewBox="0 0 340 270" role="img" aria-label={preview ? 'Illustrative 3D sun compass. Plan a journey for actual sun positions.' : night ? 'Sun below the horizon at this point in the journey.' : `Sun bearing ${Math.round(azimuth)} degrees, elevation ${Math.round(altitude*180/Math.PI)} degrees.`}>
      <defs><radialGradient id={`${id}-orb`} cx="32%" cy="26%"><stop stopColor="#fffbe5" /><stop offset=".45" stopColor="#ffd96a" /><stop offset="1" stopColor="#e9a027" /></radialGradient><radialGradient id={`${id}-ground`}><stop stopColor="#ffffff" stopOpacity=".97" /><stop offset="1" stopColor="#f4f8ee" stopOpacity=".65" /></radialGradient><filter id={`${id}-blur`}><feGaussianBlur stdDeviation="5" /></filter></defs>
      <ellipse cx="170" cy="186" rx="116" ry="63" fill="#153f37" opacity=".16" filter={`url(#${id}-blur)`} />
      <ellipse cx="170" cy="176" rx="118" ry="69" fill={`url(#${id}-ground)`} stroke="#ffffff" strokeWidth="2" />
      <ellipse cx="170" cy="176" rx="102" ry="58" fill="none" stroke="#607e72" strokeOpacity=".35" strokeDasharray="2 5" />
      <path d="M 68 176 H 272 M 170 118 V 234" fill="none" stroke="#8fa59b" strokeOpacity=".3" />
      <path d="M 68 176 Q 170 -20 272 176" fill="none" stroke="#e0b345" strokeWidth="1.4" strokeDasharray="4 5" opacity={night ? .2 : .65} />
      <text x="170" y="109" textAnchor="middle" className="compass-north">N</text><text x="299" y="180" textAnchor="middle">E</text><text x="170" y="255" textAnchor="middle">S</text><text x="41" y="180" textAnchor="middle">W</text>
      {!night && <><path d={`M ${orb.x} ${orb.y} L ${ground.x} ${ground.y} L 170 176 Z`} fill="#f6c34b" fillOpacity=".18" /><line x1={orb.x} y1={orb.y} x2={ground.x} y2={ground.y} stroke="#c89627" strokeDasharray="3 4" /><line x1={orb.x} y1={orb.y} x2="170" y2="159" stroke="#d5a644" strokeWidth="1.5" strokeDasharray="4 4" /><ellipse cx={ground.x} cy={ground.y} rx="7" ry="4" fill="#e3b047" opacity=".6" /></>}
      <ellipse cx="170" cy="185" rx="21" ry="18" fill="#315448" opacity=".22" />
      {faces.map((face,i) => <polygon key={i} points={points([face.top[0],face.top[1],[face.top[1][0],face.top[1][1],5],[face.top[0][0],face.top[0][1],5]])} fill={i%2 ? '#477c6d' : '#285a4d'} stroke="#1b4c3f" strokeWidth=".6" />)}
      <polygon points={points(top)} fill="#e6eee4" stroke="#779589" strokeWidth="1" />
      <polygon points={points([[-9,-length+4,23.5],[9,-length+4,23.5],[9,-length+13,23.5],[-9,-length+13,23.5]])} fill="#588a7b" />
      <polygon points={points([[-7,-2,23.5],[7,-2,23.5],[7,14,23.5],[-7,14,23.5]])} fill="#b2c5b8" />
      <polygon points={points([[0,-length-17,0],[-5,-length-7,0],[5,-length-7,0]])} fill="#285a4d" />
      {!night && <g><circle cx={orb.x} cy={orb.y} r="30" fill="#ffce54" opacity=".12" /><circle cx={orb.x} cy={orb.y} r="21" fill={`url(#${id}-orb)`} /><circle cx={orb.x-6} cy={orb.y-7} r="4" fill="#fff9d7" opacity=".65" /><text className="sun-elevation" x={orb.x} y={orb.y-32} textAnchor="middle">{preview ? 'Sun' : `${Math.round(altitude*180/Math.PI)}°`}</text></g>}
      {night && <g><circle cx="170" cy="52" r="19" fill="#a3b4c2" /><circle cx="179" cy="46" r="16" fill="#e8eff0" /><text x="170" y="89" textAnchor="middle">Below the horizon</text></g>}
    </svg>
  </div>;
}
