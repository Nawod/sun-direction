'use client';

import { Sun, Download, Info, X, MapPin, Map, Sun as SunIcon, Bus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAllCountries } from 'countries-and-timezones';

interface HeaderProps {
  timezone: string;
  setTimezone: (tz: string) => void;
  onStartTour?: () => void;
}

export default function Header({ timezone, setTimezone, onStartTour }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [countries, setCountries] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const all = getAllCountries();
    const sorted = Object.values(all).sort((a, b) => a.name.localeCompare(b.name));
    setCountries(sorted);

    // Initial load: Find the country that matches the provided timezone
    const localTz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const found = sorted.find(c => (c.timezones as string[]).includes(localTz));
    if (found) {
      setSelectedCountry(found.id);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [timezone]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedCountry(id);
    const country = countries.find(c => c.id === id);
    if (country && country.timezones.length > 0) {
      setTimezone(country.timezones[0]);
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <>
      <header className="glass-panel header-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Sun size={28} color="#eab308" />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Sun Direction</h1>
        </div>

        {mounted && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              onClick={() => {
                if (onStartTour) onStartTour();
              }} 
              style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'none' }} 
              title="Start Tour"
            >
              <Info size={16} />
            </button>

            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)' }}
              >
                <Download size={16} /> Install App
              </button>
            )}
            <select
              value={selectedCountry}
              onChange={handleCountryChange}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: '8px',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '0.9rem',
                outline: 'none',
                cursor: 'pointer',
                maxWidth: '200px',
                textOverflow: 'ellipsis'
              }}
            >
              {countries.map(c => {
                if (c.timezones.length === 0) return null;
                return (
                  <option key={c.id} value={c.id} style={{ background: '#1e293b' }}>
                    {c.name}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </header>
    </>
  );
}

