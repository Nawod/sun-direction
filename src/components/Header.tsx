'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sun, CircleHelp, Globe2, Download, ChevronDown } from 'lucide-react';

interface InstallEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> }
interface HeaderProps { timezone: string; setTimezone: (value: string) => void; onStartTour: () => void }

export default function Header({ timezone, setTimezone, onStartTour }: HeaderProps) {
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const zones = useMemo<string[]>(() => Intl.supportedValuesOf('timeZone'), []);
  useEffect(() => {
    const handler = (event: Event) => { event.preventDefault(); setInstall(event as InstallEvent); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  return <header className="app-header">
    <a className="brand" href="#planner" aria-label="Sun Direction route planner"><span className="brand-mark"><Sun size={23} /></span><span>sun direction<span className="brand-period">.</span></span></a>
    <span className="header-caption">A little less sun. A better journey.</span>
    <nav aria-label="Settings and help">
      <label className="timezone-select"><Globe2 size={15} /><span>{timezone.split('/').pop()?.replaceAll('_', ' ')}</span><ChevronDown size={12} /><select aria-label="Journey timezone" value={timezone} onChange={event => setTimezone(event.target.value)}>{!zones.includes(timezone) && <option>{timezone}</option>}{zones.map(zone => <option key={zone} value={zone}>{zone.replaceAll('_', ' ')}</option>)}</select></label>
      <button className="help-button" aria-label="How it works" onClick={onStartTour}><CircleHelp size={17} /><span>How it works</span></button>
      {install && <button className="icon-button" aria-label="Install app" onClick={async () => { await install.prompt(); if ((await install.userChoice).outcome === 'accepted') setInstall(null); }}><Download size={18} /></button>}
    </nav>
  </header>;
}
