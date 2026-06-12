'use client';

import { Sun } from 'lucide-react';

export default function Header() {
  return (
    <header className="glass-panel" style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 20,
      borderRadius: 0,
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Sun size={28} color="#eab308" />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Sun Direction</h1>
      </div>
    </header>
  );
}
