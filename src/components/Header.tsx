'use client';

import { Sun } from 'lucide-react';

export default function Header() {
  return (
    <header className="glass-panel header-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Sun size={28} color="#eab308" />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Sun Direction</h1>
      </div>
    </header>
  );
}
