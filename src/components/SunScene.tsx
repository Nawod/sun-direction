'use client';
import { useId, useRef, useState } from 'react';
import { RotateCcw, RotateCw, Sun, Moon } from 'lucide-react';
import { getSunSide } from '@/utils/sunMath';

type Point = [number, number, number];
interface SunSceneProps { bearing: number; heading: number; altitude: number; isPreview: boolean; mode: 'BUS' | 'TRAIN'; timeLabel: string }

export default function SunScene({ bearing, heading, altitude, isPreview, mode, timeLabel }: SunSceneProps) {
  const [rotation, setRotation] = useState(-32);
  const drag = useRef<number | null>(null);
  const id = useId().replaceAll(':', '');
  const angle = rotation * Math.PI / 180;
  const relative = (bearing - heading) * Math.PI / 180;
  const night = altitude < 0;
  const side = getSunSide(heading, bearing);
  const project = ([x, y, z]: Point) => ({ x: 190 + (x * Math.cos(angle) - y * Math.sin(angle)) * 35, y: 158 + (x * Math.sin(angle) + y * Math.cos(angle)) * 17 - z * 35 });
  const polygon = (points: Point[]) => points.map(point => { const p = project(point); return `${p.x},${p.y}`; }).join(' ');
  const radius = 3.2 * Math.cos(Math.max(0, altitude));
  const sphere = project([Math.sin(relative) * radius, -Math.cos(relative) * radius, Math.max(0.2, Math.sin(Math.max(0, altitude)) * 3.2)]);
  const ground = project([Math.sin(relative) * radius, -Math.cos(relative) * radius, 0]);
  const top: Point[] = [[-.65, -1.55, 1.05], [.65, -1.55, 1.05], [.65, 1.55, 1.05], [-.65, 1.55, 1.05]];
  const faces = [
    { points: [[-.65, -1.55, 0], [-.65, 1.55, 0], [-.65, 1.55, 1.05], [-.65, -1.55, 1.05]] as Point[], fill: !night && side === 'left' ? '#f9c57a' : '#7fa4c0', type: 'left' },
    { points: [[.65, 1.55, 0], [.65, -1.55, 0], [.65, -1.55, 1.05], [.65, 1.55, 1.05]] as Point[], fill: !night && side === 'right' ? '#f9c57a' : '#87adc5', type: 'right' },
    { points: [[-.65, -1.55, 0], [.65, -1.55, 0], [.65, -1.55, 1.05], [-.65, -1.55, 1.05]] as Point[], fill: '#35566f', type: 'front' },
    { points: [[.65, 1.55, 0], [-.65, 1.55, 0], [-.65, 1.55, 1.05], [.65, 1.55, 1.05]] as Point[], fill: '#557a94', type: 'back' },
  ].sort((a, b) => project(a.points.reduce<Point>((sum, point) => [sum[0] + point[0] / 4, sum[1] + point[1] / 4, 0], [0, 0, 0])).y - project(b.points.reduce<Point>((sum, point) => [sum[0] + point[0] / 4, sum[1] + point[1] / 4, 0], [0, 0, 0])).y);
  const front = project([0, -2.6, 0]);
  const left = project([-1.45, 0, 0]); const right = project([1.45, 0, 0]);

  return <section className={`sun-scene ${night ? 'scene-night' : ''}`} aria-label="Sun position in a three-dimensional vehicle view">
    <div className="scene-heading"><div><span className="scene-icon">{night ? <Moon size={15} /> : <Sun size={15} />}</span><h3>Your window on the sun</h3></div><span className="scene-badge">3D view</span></div>
    <svg viewBox="0 0 380 250" role="img" aria-label={isPreview ? 'Illustration of sunlight hitting a bus. Plan a route to see your actual sun position.' : night ? 'The sun is below the horizon at this route point.' : `Sun ${Math.round(altitude * 180 / Math.PI)} degrees above the horizon, on the ${side} of the vehicle.`} onPointerDown={event => { drag.current = event.clientX; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={event => { if (drag.current !== null) { setRotation(value => value + (event.clientX - drag.current!) * .5); drag.current = event.clientX; } }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      <defs><radialGradient id={`${id}-sun`} cx="35%" cy="30%"><stop offset="0" stopColor="#fff5bb" /><stop offset=".55" stopColor="#ffc85e" /><stop offset="1" stopColor="#ed922b" /></radialGradient><linearGradient id={`${id}-roof`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f8fcff" /><stop offset="1" stopColor="#cadbe7" /></linearGradient><filter id={`${id}-shadow`}><feGaussianBlur stdDeviation="3" /></filter></defs>
      <ellipse cx="190" cy="165" rx="139" ry="61" fill={night ? '#dfe6ef' : '#e3edf2'} />
      <ellipse cx="190" cy="165" rx="126" ry="53" fill="none" stroke="#c4d4df" strokeDasharray="3 6" />
      <polygon points={polygon([[-1.08, -3.7, -.03], [1.08, -3.7, -.03], [1.08, 3.7, -.03], [-1.08, 3.7, -.03]])} fill="#d0dce5" />
      {[-3, -2.1, 2.1, 3].map(y => <polygon key={y} points={polygon([[-.035, y-.18, 0], [.035, y-.18, 0], [.035, y+.18, 0], [-.035, y+.18, 0]])} fill="#f8fbfd" />)}
      {!night && <><line x1={ground.x} y1={ground.y} x2={sphere.x} y2={sphere.y} stroke="#e2ac58" strokeDasharray="3 4" /><line x1={sphere.x} y1={sphere.y} x2="190" y2="142" stroke="#f0bf73" strokeWidth="20" opacity=".12" /><line x1={sphere.x} y1={sphere.y} x2="190" y2="142" stroke="#e5ad59" strokeDasharray="4 5" opacity=".6" /></>}
      <polygon points={polygon([[-.8 - Math.sin(relative)*.5, -1.55 + Math.cos(relative)*.5, -.01], [.8 - Math.sin(relative)*.5, -1.55 + Math.cos(relative)*.5, -.01], [.8 - Math.sin(relative)*.5, 1.55 + Math.cos(relative)*.5, -.01], [-.8 - Math.sin(relative)*.5, 1.55 + Math.cos(relative)*.5, -.01]])} fill="#41647b" opacity=".2" filter={`url(#${id}-shadow)`} />
      {faces.map(face => <g key={face.type}><polygon points={polygon(face.points)} fill={face.fill} stroke="#60829a" strokeWidth=".7" />{(face.type === 'left' || face.type === 'right') && [-1.05, -.35, .35, 1.05].map(y => { const x = face.type === 'left' ? -.66 : .66; return <polygon key={y} points={polygon([[x, y-.22, .45], [x, y+.22, .45], [x, y+.22, .85], [x, y-.22, .85]])} fill="#25475f" />; })}{face.type === 'front' && <polygon points={polygon([[-.5, -1.56, .46], [.5, -1.56, .46], [.5, -1.56, .87], [-.5, -1.56, .87]])} fill="#a9ccde" />}</g>)}
      <polygon points={polygon(top)} fill={`url(#${id}-roof)`} stroke="#97b1c4" strokeWidth=".8" />
      <polygon points={polygon([[-.35, -.45, 1.07], [.35, -.45, 1.07], [.35, .6, 1.07], [-.35, .6, 1.07]])} fill="#b6cbd9" />
      <text x="190" y="234" textAnchor="middle" fill="#7d909f" fontSize="10">{mode === 'BUS' ? 'Bus' : 'Train'} · facing forward</text>
      <text x={front.x} y={front.y-8} textAnchor="middle" fill="#688598" fontSize="10">Forward</text>
      <text x={left.x-9} y={left.y+4} textAnchor="end" fill="#42637a" fontSize="11">Left</text><text x={right.x+9} y={right.y+4} fill="#42637a" fontSize="11">Right</text>
      {!night && <g><circle cx={sphere.x} cy={sphere.y} r="25" fill="#f9c766" opacity=".13" /><circle cx={sphere.x} cy={sphere.y} r="17" fill={`url(#${id}-sun)`} /><text x={sphere.x} y={sphere.y-27} textAnchor="middle" fill="#9e672d" fontSize="11">{isPreview ? 'Sunlight' : `${Math.round(altitude*180/Math.PI)}° elevation`}</text></g>}
      {night && <g><circle cx="286" cy="57" r="16" fill="#899cb9" /><circle cx="294" cy="51" r="13" fill="#f4f7fa" /><text x="286" y="90" textAnchor="middle" fill="#68809d" fontSize="11">Sun below horizon</text></g>}
    </svg>
    <div className="scene-bottom"><p>{isPreview ? 'Illustration. Your route brings it to life.' : `${timeLabel} · ${night ? 'No direct sunlight' : side === 'front' || side === 'back' ? `Sun ${side === 'front' ? 'ahead' : 'behind'}` : `Sun on your ${side}`}`}</p><div><button className="icon-button" aria-label="Rotate 3D view left" onClick={() => setRotation(value => value-20)}><RotateCcw size={14} /></button><button className="icon-button" aria-label="Rotate 3D view right" onClick={() => setRotation(value => value+20)}><RotateCw size={14} /></button></div></div>
  </section>;
}
