'use client';
import { Sun, Download, CircleHelp, Globe2, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getAllCountries } from 'countries-and-timezones';
import Link from 'next/link';
interface InstallEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
interface HeaderProps { timezone: string; setTimezone: (value: string) => void; onStartTour?: () => void }
export default function Header({ timezone, setTimezone, onStartTour }: HeaderProps) {
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const zones = useMemo<string[]>(() => [...new Set(Object.values(getAllCountries()).flatMap(country => country.timezones))].sort(), []);
  useEffect(() => {
    const handler = (event: Event) => { event.preventDefault(); setInstall(event as InstallEvent); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  return <header className="app-header">
    <Link className="brand" href="/" aria-label="Sun Direction home"><span className="brand-symbol"><Sun size={25} strokeWidth={1.8} /></span><span>sun direction<span className="brand-dot">.</span></span></Link>
    <span className="header-tagline">Take the scenic side. Skip the sun.</span>
    <nav aria-label="App settings"><label className="timezone-select"><Globe2 size={16} /><span>{timezone.replaceAll('_', ' ').split('/').pop()}</span><ChevronDown size={12} /><select aria-label="Journey timezone" value={timezone} onChange={event => setTimezone(event.target.value)}>{!zones.includes(timezone) && <option value={timezone}>{timezone}</option>}{zones.map(zone => <option key={zone} value={zone}>{zone.replaceAll('_', ' ')}</option>)}</select></label><button className="help-button" aria-label="How it works" onClick={onStartTour}><CircleHelp size={17} /><span>How it works</span></button>{install && <button className="icon-button" aria-label="Install app" onClick={async () => { await install.prompt(); if ((await install.userChoice).outcome === 'accepted') setInstall(null); }}><Download size={18} /></button>}</nav>
  </header>;
}
