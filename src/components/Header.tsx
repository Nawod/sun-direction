'use client';

import { Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

interface HeaderProps {
  timezone: string;
  setTimezone: (tz: string) => void;
}

export default function Header({ timezone, setTimezone }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [timezones, setTimezones] = useState<{value: string, label: string}[]>([]);

  useEffect(() => {
    setMounted(true);
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const uniqueTzs = Array.from(new Set([
      localTz,
      'Asia/Colombo',
      'America/New_York',
      'America/Los_Angeles',
      'Europe/London',
      'Asia/Tokyo',
      'Australia/Sydney',
      'UTC'
    ]));
    
    setTimezones(uniqueTzs.map(tz => ({
      value: tz,
      label: tz === localTz ? `Local (${tz})` : tz
    })));
  }, []);

  return (
    <header className="glass-panel header-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Sun size={28} color="#eab308" />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Sun Direction</h1>
      </div>
      
      {mounted && (
        <div>
          <select 
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: '8px',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '0.9rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {timezones.map(tz => (
              <option key={tz.value} value={tz.value} style={{ background: '#1e293b' }}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </header>
  );
}
